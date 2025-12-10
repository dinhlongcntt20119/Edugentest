import React, { useState, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ExamDisplay } from './components/ExamDisplay';
import { Grade, QuestionType, Difficulty, ExamRequest } from './types';
import { generateExamStream } from './services/geminiService';

const App: React.FC = () => {
  const [request, setRequest] = useState<ExamRequest>({
    subject: 'Toán',
    grade: Grade.Grade12,
    bookSet: 'Kết nối tri thức với cuộc sống',
    topic: '',
    specificRequirements: '',
    image: undefined,
    type: QuestionType.Mixed,
    difficulty: Difficulty.Mixed,
    questionCount: 10,
  });

  const [generatedContent, setGeneratedContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Adjusted to handle generic values including undefined for image clearing
  const handleInputChange = useCallback((field: keyof ExamRequest, value: string | number | undefined) => {
    setRequest((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = async () => {
    if (!request.topic.trim()) {
      setError('Vui lòng nhập chủ đề.');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent('');
    setError(null);

    // Variables for throttling
    let accumulatedText = '';
    let lastUpdateTime = 0;

    try {
      await generateExamStream(request, (chunk) => {
        accumulatedText += chunk;
        const now = Date.now();
        // Throttle UI updates to every 100ms to prevent React rendering lag
        if (now - lastUpdateTime > 100) {
          setGeneratedContent(accumulatedText);
          lastUpdateTime = now;
        }
      });
      // Ensure the final complete text is set
      setGeneratedContent(accumulatedText);
    } catch (err: any) {
      console.error(err);
      let errorMessage = "Đã xảy ra lỗi khi tạo đề thi. Vui lòng thử lại.";
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      if (errorMessage.includes("http status code: 0")) {
        errorMessage = "Lỗi kết nối mạng (Network Error). Vui lòng kiểm tra kết nối internet.";
      }

      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      {/* Header Sinh động */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white shadow-xl relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
           <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
           <div className="absolute bottom-[-50px] right-[-50px] w-60 h-60 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            
            {/* Left Content */}
            <div className="flex items-start gap-5 w-full lg:w-auto">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner hidden sm:flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M12 11h.01"></path><path d="M12 15h.01"></path></svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2 uppercase drop-shadow-md leading-tight max-w-xl">
                  PHẦN MỀM TẠO CÂU HỎI ÔN TẬP - ĐỀ THI
                </h2>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-xs sm:text-sm font-semibold border border-white/20 backdrop-blur-sm">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 text-yellow-300"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                   Theo chương trình GDPT 2018
                </div>
              </div>
            </div>

            {/* Right Content - Contact Info */}
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 shadow-lg w-full lg:w-auto hover:bg-white/15 transition-all duration-300">
              <div className="flex flex-col space-y-2">
                <div className="font-bold text-base text-yellow-300 border-b border-white/20 pb-1 mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Nguyễn Đình Bạch Long
                </div>
                
                <div className="flex items-center gap-2 text-white/90 group text-sm">
                  <div className="bg-blue-800/50 p-1 rounded-md group-hover:bg-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  </div>
                  <span className="font-medium tracking-wide">ĐT: 0937438939</span>
                </div>
                
                <div className="flex items-center gap-2 text-white/90 group text-sm">
                  <div className="bg-blue-800/50 p-1 rounded-md group-hover:bg-blue-600 transition-colors">
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  </div>
                  <span className="font-medium">Email: dinhlongcntt20119@gmail.com</span>
                </div>
                
                <div className="flex items-center gap-2 text-white/90 group text-sm">
                  <div className="bg-blue-800/50 p-1 rounded-md group-hover:bg-blue-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                  </div>
                  <span className="font-medium">TK: 0937438939 Vietinbank</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-4 space-y-6">
            <InputForm 
              request={request}
              onChange={handleInputChange}
              onSubmit={handleGenerate}
              isGenerating={isGenerating}
            />

            {/* Helper Info Card */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
              <h4 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                Hướng dẫn
              </h4>
              <ul className="text-sm text-blue-700 space-y-2 list-none">
                <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Hỗ trợ <strong>tất cả các môn</strong> và <strong>mọi cấp học (1-12)</strong>.</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Chọn <strong>Bộ sách</strong> phù hợp (Kết nối tri thức, Cánh diều...).</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Bạn có thể <strong>upload ảnh chụp trang sách</strong> hoặc dán link bài học để AI tạo đề sát nội dung nhất.</span>
                </li>
                <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>Chọn <strong>Kết hợp</strong> để có cấu trúc đề chuẩn.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 shadow-sm animate-pulse">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                 {error}
              </div>
            )}
            
            {/* Loading Notification during generation */}
            {isGenerating && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-900 px-4 py-4 rounded-xl flex items-start gap-3 shadow-sm">
                 <div className="shrink-0 mt-1">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                 </div>
                 <div>
                    <h4 className="font-semibold text-lg">Hệ thống đang khởi tạo đề thi...</h4>
                    <p className="text-sm mt-1 text-blue-700">
                      AI đang phân tích yêu cầu, tra cứu kiến thức trong sách giáo khoa và biên soạn câu hỏi phù hợp.
                    </p>
                    <p className="text-sm font-medium mt-1 text-blue-800">
                      ⚠️ Vui lòng đợi trong giây lát, nội dung sẽ xuất hiện ngay bên dưới.
                    </p>
                 </div>
              </div>
            )}

            {generatedContent || isGenerating ? (
              <ExamDisplay content={generatedContent} request={request} />
            ) : (
              <div className="h-[500px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-blue-200"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                </div>
                <p className="font-semibold text-lg text-slate-600">Chưa có nội dung đề thi</p>
                <p className="text-sm mt-2 text-slate-500 max-w-xs text-center">Hãy điền thông tin ở cột bên trái và nhấn nút <strong>"Tạo Đề Thi Ngay"</strong> để bắt đầu.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
           © 2024 EDUGEN VN. Được phát triển bởi Nguyễn Đình Bạch Long. Powered by Gemini.
        </div>
      </footer>
    </div>
  );
};

export default App;