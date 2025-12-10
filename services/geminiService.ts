import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { ExamRequest, QuestionType } from "../types";

export const generateExamStream = async (
  request: ExamRequest,
  onChunk: (text: string) => void
): Promise<void> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  // Create a new instance for each request to ensure fresh config/key if needed
  const ai = new GoogleGenAI({ apiKey });

  const isLiterature = request.subject === 'Ngữ văn / Tiếng Việt';
  const isEssay = request.type === QuestionType.Essay;

  // Determine effective book set name
  const effectiveBookSet = (request.bookSet === 'Khác / Tổng hợp' && request.customBookSet) 
    ? request.customBookSet 
    : request.bookSet;

  let extraPrompt = '';
  
  if (isLiterature || isEssay) {
    extraPrompt += `
    LƯU Ý ĐẶC BIỆT: Đây là yêu cầu tạo đề Văn / Bài tự luận.
    1. Số lượng câu hỏi: Chỉ tạo 01 câu duy nhất.
    2. Yêu cầu đáp án: BẮT BUỘC PHẢI BAO GỒM 2 PHẦN:
       - Phần 1: Dàn ý chi tiết.
       - Phần 2: Bài văn hoàn chỉnh (Độ dài khoảng ${request.literaturePageCount || 2} trang).
    `;
  }

  // Add specific instruction for custom book set internet knowledge
  if (request.bookSet === 'Khác / Tổng hợp' && request.customBookSet) {
    extraPrompt += `
    QUAN TRỌNG: Người dùng đã chỉ định bộ sách cụ thể là "${request.customBookSet}".
    Hãy sử dụng kiến thức rộng của bạn về bộ sách này (hoặc các giáo trình tương đương liên quan đến nó) để biên soạn nội dung, thuật ngữ và phương pháp tiếp cận phù hợp nhất.
    `;
  }
  
  // Specific requirements processing (links or text)
  const specificReqs = request.specificRequirements 
    ? `Nội dung chính/Yêu cầu từ người dùng: "${request.specificRequirements}". (Nếu là đường dẫn/link, hãy phân tích nội dung từ đó. Nếu là văn bản, hãy bám sát nội dung này).` 
    : 'Không có yêu cầu cụ thể (Tạo bài tập bao quát cả chủ đề)';

  const userPromptText = `
    Hãy tạo đề thi với các thông số sau:
    - Môn học: ${request.subject}
    - Khối lớp: ${request.grade}
    - Bộ sách: ${effectiveBookSet}
    - Chủ đề: ${request.topic}
    - ${specificReqs}
    - Loại câu hỏi: ${request.type}
    - Mức độ: ${request.difficulty}
    - Số lượng câu hỏi: ${isLiterature || isEssay ? '1 câu (Bài làm văn)' : request.questionCount}
    
    YÊU CẦU BẮT BUỘC VỀ ĐỊNH DẠNG:
    1. Mỗi câu hỏi PHẢI có nhãn mức độ ở ngay đầu (Ví dụ: [Nhận biết], [Thông hiểu], [Vận dụng]).
    2. Hãy lưu ý đặc thù của môn ${request.subject} ở lớp ${request.grade} theo bộ sách "${effectiveBookSet}" để sử dụng ngôn ngữ và kiến thức phù hợp nhất.
    3. Nếu người dùng cung cấp hình ảnh hoặc nội dung cụ thể, hãy ưu tiên sử dụng dữ liệu đó để đặt câu hỏi.
    
    ${extraPrompt}
  `;

  // Prepare contents payload
  let contentsPayload: any = {
     parts: [{ text: userPromptText }]
  };

  // If an image is provided, append it to the parts
  if (request.image) {
      // request.image is a data URL like "data:image/jpeg;base64,....."
      // We need to extract the base64 data and the mime type.
      const match = request.image.match(/^data:(.+);base64,(.+)$/);
      if (match) {
          const mimeType = match[1];
          const data = match[2];
          contentsPayload.parts.push({
              inlineData: {
                  mimeType: mimeType,
                  data: data
              }
          });
          // Modify prompt to explicitly mention the image
          contentsPayload.parts[0].text += "\n\n[QUAN TRỌNG]: Hãy phân tích hình ảnh đính kèm để trích xuất nội dung kiến thức và tạo câu hỏi dựa trên đó.";
      }
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: contentsPayload,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3, // Lower temperature for faster, more deterministic results
        maxOutputTokens: 8192,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        onChunk(text);
      }
    }
  } catch (error) {
    console.error("Error generating exam:", error);
    throw error;
  }
};