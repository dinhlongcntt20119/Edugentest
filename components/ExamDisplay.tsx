import React, { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle,
  ImageRun
} from "docx";
import { ExamRequest } from '../types';

interface ExamDisplayProps {
  content: string;
  request: ExamRequest;
}

export const ExamDisplay: React.FC<ExamDisplayProps> = ({ content, request }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Parse the content into two parts based on the headers defined in SYSTEM_INSTRUCTION
  const { questionsPart, answersPart } = useMemo(() => {
    // MUST match exactly what is defined in constants.ts SYSTEM_INSTRUCTION
    const part2Marker = "### PHẦN 2: ĐÁP ÁN VÀ HƯỚNG DẪN CHI TIẾT";
    
    // Check if the content contains the split marker
    if (content.includes(part2Marker)) {
      const [part1, part2] = content.split(part2Marker);
      return {
        questionsPart: part1.trim(),
        answersPart: `${part2Marker}\n${part2}`.trim() // Keep the header for Part 2
      };
    }
    
    // Fallback: Try looking for just "PHẦN 2" if the full string isn't exact (sometimes AI varies slightly)
    const fallbackMarker = "### PHẦN 2";
    if (content.includes(fallbackMarker)) {
        const parts = content.split(fallbackMarker);
        // Take the last part as answers, everything before as questions (in case multiple markers)
        const p2 = parts.pop(); 
        const p1 = parts.join(fallbackMarker);
        return {
            questionsPart: p1.trim(),
            answersPart: `${fallbackMarker}${p2}`.trim()
        };
    }

    // If Part 2 hasn't started generating yet, everything is Part 1
    return {
      questionsPart: content.trim(),
      answersPart: ''
    };
  }, [content]);

  const handleDownloadWord = async () => {
    setIsDownloading(true);
    try {
      // Helper to fetch and convert math latex to image blob
      // Using CodeCogs which is a reliable standard for this.
      const fetchMathImage = async (latex: string): Promise<ArrayBuffer | null> => {
        try {
            // Encode LaTeX. \dpi{200} gives a good resolution for Word without being huge.
            // \bg{white} ensures no transparency issues if Word background changes, though usually transparent is fine.
            const encoded = encodeURIComponent(latex.trim());
            const url = `https://latex.codecogs.com/png.image?\\dpi{200}${encoded}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.arrayBuffer();
        } catch (e) {
            console.error("Failed to fetch math image", e);
            return null;
        }
      };

      // Helper to get image dimensions
      const getImageDimensions = (buffer: ArrayBuffer): Promise<{width: number, height: number}> => {
          return new Promise((resolve) => {
              const blob = new Blob([buffer]);
              const img = new Image();
              img.onload = () => {
                  resolve({ width: img.naturalWidth, height: img.naturalHeight });
              };
              img.src = URL.createObjectURL(blob);
          });
      };

      // Helper: Parse text for Bold (**text**) and Math ($text$ or $$text$$)
      // Now async because we fetch images
      const parseStyledTextAsync = async (text: string): Promise<(TextRun | ImageRun)[]> => {
          // Regex logic:
          // 1. Block Math: $$...$$ or \[...\]
          // 2. Inline Math: $...$
          // 3. Bold: **...**
          const parts = text.split(/(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$.+?\$|\*\*.*?\*\*)/g);
          
          const children: (TextRun | ImageRun)[] = [];

          for (const part of parts) {
             if ((part.startsWith('$$') && part.endsWith('$$')) || (part.startsWith('\\[') && part.endsWith('\\]'))) {
                 // Block Math -> Image
                 const latex = part.startsWith('$$') ? part.slice(2, -2) : part.slice(2, -2);
                 const buffer = await fetchMathImage(latex);
                 
                 if (buffer) {
                     const dims = await getImageDimensions(buffer);
                     // Scale down slightly for Word (200dpi is approx 2x screen density)
                     // Target roughly 50% scale to look crisp
                     children.push(new ImageRun({
                         data: buffer,
                         transformation: {
                             width: dims.width * 0.5,
                             height: dims.height * 0.5
                         }
                     }));
                 } else {
                     // Fallback to text if fetch fails
                     children.push(new TextRun({ text: latex, font: "Cambria Math" }));
                 }

             } else if (part.startsWith('$') && part.endsWith('$')) {
                 // Inline Math -> Image
                 const latex = part.slice(1, -1).trim();
                 const buffer = await fetchMathImage(latex);

                 if (buffer) {
                     const dims = await getImageDimensions(buffer);
                     // Inline math needs to match text height approx (18-20px for 12pt font)
                     // If fetch returns a 40px height image (due to 200dpi), scale to 20px
                     const targetHeight = 20; 
                     const scaleFactor = targetHeight / dims.height;

                     children.push(new ImageRun({
                         data: buffer,
                         transformation: {
                             width: dims.width * 0.5, // Simple 50% scale often looks best for inline flow
                             height: dims.height * 0.5
                         }
                     }));
                 } else {
                     children.push(new TextRun({ text: latex, font: "Cambria Math" }));
                 }
             } else if (part.startsWith('**') && part.endsWith('**')) {
                 // Bold
                 children.push(new TextRun({
                     text: part.slice(2, -2),
                     bold: true,
                     font: "Times New Roman",
                     size: 24,
                 }));
             } else {
                 // Regular Text
                 children.push(new TextRun({
                     text: part,
                     font: "Times New Roman",
                     size: 24,
                 }));
             }
          }
          return children;
      };

      // Helper: Create a standard paragraph from a text line
      const createParagraphFromLineAsync = async (line: string): Promise<Paragraph> => {
        const cleanLine = line.trim();
        if (!cleanLine) return new Paragraph({ text: "" });

        // Headers
        if (cleanLine.startsWith('### ')) {
          return new Paragraph({
            text: cleanLine.replace('### ', ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 }
          });
        }
        if (cleanLine.startsWith('## ')) {
            return new Paragraph({
            text: cleanLine.replace('## ', ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 }
          });
        }
        if (cleanLine.startsWith('# ')) {
            return new Paragraph({
            text: cleanLine.replace('# ', ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
            alignment: AlignmentType.CENTER
          });
        }

        const children = await parseStyledTextAsync(cleanLine);

        return new Paragraph({
          children: children,
          spacing: { after: 120 }
        });
      };

      // Helper: Convert markdown table rows strings into a DOCX Table
      const createTableFromMarkdownRowsAsync = async (rows: string[]): Promise<Table | Paragraph> => {
        const contentRows = rows.filter(row => {
          const stripped = row.replace(/\|/g, '').trim();
          return !/^[-:\s]+$/.test(stripped);
        });

        if (contentRows.length === 0) return new Paragraph({ text: "" });

        const getCellCount = (rowStr: string) => {
            let cells = rowStr.split('|');
            if (rowStr.trim().startsWith('|')) cells.shift();
            if (rowStr.trim().endsWith('|')) cells.pop();
            return cells.length;
        };

        const isTwoColumnTable = getCellCount(contentRows[0]) === 2;

        // Process rows in parallel
        const tableRows = await Promise.all(contentRows.map(async row => {
          let cells = row.split('|');
          if (row.trim().startsWith('|')) cells.shift();
          if (row.trim().endsWith('|')) cells.pop();

          const createCellContent = async (text: string) => [
            new Paragraph({
                children: await parseStyledTextAsync(text.trim())
            })
          ];

          const standardBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
          const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

          if (isTwoColumnTable && cells.length === 2) {
             const cell0 = await createCellContent(cells[0]);
             const cell1 = await createCellContent(cells[1]);

             return new TableRow({
                children: [
                    new TableCell({
                        children: cell0,
                        width: { size: 4500, type: WidthType.DXA },
                        borders: { top: standardBorder, bottom: standardBorder, left: standardBorder, right: standardBorder }
                    }),
                    new TableCell({
                        children: [], 
                        width: { size: 1500, type: WidthType.DXA },
                        borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }
                    }),
                    new TableCell({
                        children: cell1,
                        width: { size: 4500, type: WidthType.DXA },
                        borders: { top: standardBorder, bottom: standardBorder, left: standardBorder, right: standardBorder }
                    })
                ]
             });
          } else {
             const cellPromises = cells.map(async cellText => {
                 const content = await createCellContent(cellText);
                 return new TableCell({
                    children: content,
                    width: { size: 100 / cells.length, type: WidthType.PERCENTAGE },
                    borders: { top: standardBorder, bottom: standardBorder, left: standardBorder, right: standardBorder }
                 });
             });
             const tableCells = await Promise.all(cellPromises);
             
             return new TableRow({ children: tableCells });
          }
        }));

        return new Table({
          rows: tableRows,
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          layout: "autofit" 
        });
      };

      // Parser: Async version
      const parseMarkdownToDocxNodesAsync = async (text: string) => {
        const lines = text.split('\n');
        const nodes = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();
            
            if (line.startsWith('|')) {
                const tableLines = [];
                while (i < lines.length && lines[i].trim().startsWith('|')) {
                    tableLines.push(lines[i].trim());
                    i++;
                }
                if (tableLines.length > 0) {
                    const table = await createTableFromMarkdownRowsAsync(tableLines);
                    nodes.push(table);
                    nodes.push(new Paragraph({text: ""}));
                }
            } else {
                nodes.push(await createParagraphFromLineAsync(line));
                i++;
            }
        }
        return nodes;
      };

      const docNodes = await parseMarkdownToDocxNodesAsync(content);

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: `ĐỀ ÔN LUYỆN ${request.subject.toUpperCase()}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 }
            }),
            new Paragraph({
              text: `Chủ đề: ${request.topic}`,
              alignment: AlignmentType.CENTER,
              spacing: { after: 480 }
            }),
            ...docNodes
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `De_Thi_${request.subject}_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error generating Word document:", error);
      alert("Có lỗi khi tạo file Word hoặc tải hình ảnh công thức. Vui lòng thử lại.");
    } finally {
      setIsDownloading(false);
    }
  };

  const MarkdownComponents = {
    table: (props: any) => (
        <div className="overflow-x-auto my-6 border rounded-lg border-slate-200">
            <table className="min-w-full divide-y divide-slate-200" {...props} />
        </div>
    ),
    thead: (props: any) => <thead className="bg-slate-50" {...props} />,
    tbody: (props: any) => <tbody className="bg-white divide-y divide-slate-200" {...props} />,
    tr: (props: any) => <tr className="hover:bg-slate-50 transition-colors" {...props} />,
    th: (props: any) => (
        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-200 last:border-r-0" {...props} />
    ),
    td: (props: any) => (
        <td className="px-6 py-4 whitespace-pre-wrap text-sm text-slate-800 border-r border-slate-200 last:border-r-0 align-top leading-relaxed" {...props} />
    ),
    p: (props: any) => <p className="mb-3 leading-relaxed text-slate-800" {...props} />,
    ul: (props: any) => <ul className="list-disc pl-5 mb-4 space-y-1 text-slate-800" {...props} />,
    ol: (props: any) => <ol className="list-decimal pl-5 mb-4 space-y-1 text-slate-800" {...props} />,
    h1: (props: any) => <h1 className="text-2xl font-bold text-slate-900 mt-6 mb-4" {...props} />,
    h2: (props: any) => <h2 className="text-xl font-bold text-slate-900 mt-5 mb-3 border-b pb-2 border-slate-200" {...props} />,
    h3: (props: any) => <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2" {...props} />,
    blockquote: (props: any) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-slate-600 bg-slate-50 p-2 rounded-r" {...props} />,
    strong: (props: any) => <strong className="font-bold text-slate-900" {...props} />,
    em: (props: any) => <em className="italic text-slate-800" {...props} />,
  };

  if (!content) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700">Nội dung đề thi</h3>
        <button
          onClick={handleDownloadWord}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang tải ảnh công thức...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Tải file Word
            </>
          )}
        </button>
      </div>

      {isDownloading && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Đang tạo file Word và xử lý công thức toán học...</h4>
              <p className="text-sm text-blue-700 mt-1">
                Hệ thống đang chuyển đổi mã LaTeX (phân số, căn thức, tích phân...) thành hình ảnh chất lượng cao để hiển thị không bị lỗi trong Word. 
              </p>
              <p className="text-sm text-blue-800 font-medium mt-1">
                ⚠️ Quá trình này có thể mất từ 30 giây đến 2 phút tùy thuộc vào số lượng công thức. Vui lòng không tắt trình duyệt cho đến khi file tải xong.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 max-w-none">
        {questionsPart && (
          <div className="mb-8">
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={MarkdownComponents}
            >
                {questionsPart}
            </ReactMarkdown>
          </div>
        )}

        {answersPart && (
          <div className="mt-8 pt-8 border-t-2 border-dashed border-slate-200">
             <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={MarkdownComponents}
            >
                {answersPart}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};