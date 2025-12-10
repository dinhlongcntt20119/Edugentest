import React, { useRef } from 'react';
import { GRADES, QUESTION_TYPES, DIFFICULTIES, QUESTION_COUNTS, SUBJECTS, LIT_PAGE_COUNTS, BOOK_SETS } from '../constants';
import { ExamRequest, QuestionType } from '../types';

interface InputFormProps {
  request: ExamRequest;
  onChange: (field: keyof ExamRequest, value: string | number | undefined) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({
  request,
  onChange,
  onSubmit,
  isGenerating,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLiterature = request.subject === 'Ngữ văn / Tiếng Việt';
  const isEssayType = request.type === QuestionType.Essay;
  const isCustomBookSet = request.bookSet === 'Khác / Tổng hợp';

  // Helper to validate if submission is allowed
  const isValid = () => {
    if (!request.topic.trim()) return false;
    if (isCustomBookSet && !request.customBookSet?.trim()) return false;
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("File ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onChange('image', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onChange('image', undefined);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Cấu trúc câu hỏi
        </h2>
        <p className="text-sm text-slate-500 mt-1">Hỗ trợ tất cả các môn từ Lớp 1 đến Lớp 12 (Chương trình 2018)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Subject */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Môn học</label>
          <div className="relative">
            <select
              value={request.subject}
              onChange={(e) => onChange('subject', e.target.value)}
              className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm appearance-none"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Khối Lớp</label>
          <div className="relative">
            <select
              value={request.grade}
              onChange={(e) => onChange('grade', e.target.value)}
              className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm appearance-none"
            >
              {GRADES.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Book Set */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Bộ sách</label>
          <div className="space-y-3">
            <div className="relative">
              <select
                value={request.bookSet}
                onChange={(e) => onChange('bookSet', e.target.value)}
                className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm appearance-none"
              >
                {BOOK_SETS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* Custom Book Set Input */}
            {isCustomBookSet && (
              <div className="relative animate-fadeIn">
                 <input
                  type="text"
                  value={request.customBookSet || ''}
                  onChange={(e) => onChange('customBookSet', e.target.value)}
                  placeholder="Nhập chính xác tên bộ sách hoặc tài liệu tham khảo..."
                  className="block w-full rounded-lg border-blue-300 bg-blue-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm"
                />
                <p className="text-xs text-blue-600 mt-1 ml-1">
                  * Hệ thống sẽ sử dụng kiến thức về bộ sách này để tạo nội dung.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Topic */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Chủ đề (Nội dung kiến thức)</label>
          <input
            type="text"
            value={request.topic}
            onChange={(e) => onChange('topic', e.target.value)}
            placeholder="Ví dụ: Phép cộng trong phạm vi 100, Câu đơn, Thì hiện tại đơn, Tình yêu quê hương..."
            className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm"
          />
        </div>

        {/* Specific Requirements / Content Input */}
        <div className="space-y-2 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Nội dung chính (có thể upload hình ảnh trong SGK hoặc link bài học)
          </label>
          <div className="space-y-3">
             <textarea
                value={request.specificRequirements || ''}
                onChange={(e) => onChange('specificRequirements', e.target.value)}
                placeholder="Nhập yêu cầu cụ thể hoặc dán đường dẫn (link) bài học vào đây..."
                rows={3}
                className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm resize-none"
              />
              
              {/* Image Upload Area */}
              <div className="flex items-center gap-4">
                 <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    className="hidden" 
                    onChange={handleFileChange}
                 />
                 
                 {!request.image ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Upload ảnh bài học/SGK
                    </button>
                 ) : (
                    <div className="flex items-center gap-3 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                        <div className="h-10 w-10 rounded overflow-hidden bg-slate-200 shrink-0">
                            <img src={request.image} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900 truncate">Đã chọn ảnh</p>
                            <p className="text-xs text-blue-600 truncate">Hệ thống sẽ phân tích ảnh này</p>
                        </div>
                        <button 
                            type="button"
                            onClick={handleRemoveImage}
                            className="p-1 hover:bg-blue-100 rounded-full text-blue-500 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                 )}
              </div>
          </div>
        </div>

        {/* Question Type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Loại câu hỏi</label>
          <div className="relative">
            <select
              value={request.type}
              onChange={(e) => onChange('type', e.target.value)}
              className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm appearance-none"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        {/* Conditional Fields based on Subject/Type */}
        {isLiterature || isEssayType ? (
          /* Literature/Essay Logic */
          <>
             <div className="space-y-2">
               <label className="block text-sm font-medium text-slate-700">Độ dài bài văn mẫu (Dự kiến)</label>
               <div className="relative">
                 <select
                   value={request.literaturePageCount || 2}
                   onChange={(e) => onChange('literaturePageCount', parseInt(e.target.value))}
                   className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm appearance-none"
                 >
                   {LIT_PAGE_COUNTS.map((c) => (
                     <option key={c} value={c}>{c} trang (Khoảng {c * 400}-{c * 500} từ)</option>
                   ))}
                 </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
               </div>
             </div>
          </>
        ) : (
          /* Standard Logic */
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Mức độ</label>
              <div className="relative">
                <select
                  value={request.difficulty}
                  onChange={(e) => onChange('difficulty', e.target.value)}
                  className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm appearance-none"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Số lượng câu hỏi</label>
               <div className="relative">
                <select
                  value={request.questionCount}
                  onChange={(e) => onChange('questionCount', parseInt(e.target.value))}
                  className="block w-full rounded-lg border-slate-300 bg-slate-50 py-3 px-4 text-slate-900 focus:border-blue-500 focus:ring-blue-500 sm:text-sm border transition-shadow shadow-sm appearance-none"
                >
                  {QUESTION_COUNTS.map((count) => (
                    <option key={count} value={count}>{count} câu</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="pt-4">
        <button
          onClick={onSubmit}
          disabled={isGenerating || !isValid()}
          className={`w-full flex items-center justify-center py-4 px-6 rounded-lg text-white font-semibold text-lg transition-all duration-200 shadow-md hover:shadow-lg ${
            isGenerating || !isValid()
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:transform active:scale-[0.99]'
          }`}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Đang khởi tạo đề thi...
            </>
          ) : (
            'Tạo Đề Thi Ngay'
          )}
        </button>
      </div>
    </div>
  );
};