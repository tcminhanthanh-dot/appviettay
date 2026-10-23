import React, { useState } from 'react';
import {
  Sparkles,
  Calculator,
  Send,
  Loader2,
  Check,
  Copy,
  Plus,
  X,
  FileQuestion,
  Lightbulb,
} from 'lucide-react';
import { callSpecialistChat, getStoredApiKey, getStoredModel } from '../utils/geminiClient';

interface LassoMathModalProps {
  isOpen: boolean;
  onClose: () => void;
  getCanvasSnapshot: () => string;
  onInsertTextToBoard: (text: string) => void;
  onOpenApiKeyModal: () => void;
}

export const LassoMathModal: React.FC<LassoMathModalProps> = ({
  isOpen,
  onClose,
  getCanvasSnapshot,
  onInsertTextToBoard,
  onOpenApiKeyModal,
}) => {
  const [loading, setLoading] = useState(false);
  const [solutionText, setSolutionText] = useState('');
  const [adaptiveExercises, setAdaptiveExercises] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'solver' | 'practice'>('solver');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSolveMath = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    setLoading(true);
    setSolutionText('');

    try {
      const snapshot = getCanvasSnapshot();
      const prompt = `Bạn là Trợ Lý Giảng Dạy AI Sư Phạm (Math Solver Agent) chuyên giải bài toán viết tay từ bảng lớp học.
Hãy nhìn vào hình ảnh nét vẽ / bài toán trên bảng:
1. Đọc và nhận diện chính xác đề bài toán.
2. Trình bày lời giải chi tiết, rõ ràng từng bước (Bước 1, Bước 2, Bước 3...) theo chuẩn sư phạm Việt Nam.
3. Sử dụng công thức LaTeX ($...$) cho mọi biến số và biểu thức toán học.
4. Đưa ra kết luận rõ ràng và mẹo giải nhanh hoặc lỗi học sinh hay mắc phải.`;

      const result = await callSpecialistChat({
        message: prompt,
        context: { activeTool: 'AI Giải Toán Sư Phạm' },
        imageBase64: snapshot,
        apiKey,
      });

      setSolutionText(result.reply);
    } catch (err: any) {
      setSolutionText(`🔴 Đã dừng do lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdaptiveExercises = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      onOpenApiKeyModal();
      return;
    }

    setLoading(true);
    setActiveSubTab('practice');

    try {
      const snapshot = getCanvasSnapshot();
      const prompt = `Từ bài toán viết tay trên bảng vẽ, hãy tự động sinh 3 BÀI TẬP TƯƠNG TỰ với các mức độ tăng dần:
- Bài 1: Mức độ Nhận biết / Thông hiểu (tương tự bài mẫu, chỉ thay đổi số liệu).
- Bài 2: Mức độ Vận dụng (thêm một bước biến đổi hoặc tham số).
- Bài 3: Mức độ Vận dụng cao / Mở rộng (câu hỏi phân loại học sinh giỏi).
Kèm theo đáp án ngắn gọn ở cuối mỗi bài. Định dạng công thức bằng LaTeX ($...).`;

      const result = await callSpecialistChat({
        message: prompt,
        context: { activeTool: 'AI Sinh Bài Tập Tương Tự' },
        imageBase64: snapshot,
        apiKey,
      });

      setAdaptiveExercises(result.reply);
    } catch (err: any) {
      setAdaptiveExercises(`🔴 Lỗi: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInsertToBoard = () => {
    const textToInsert = activeSubTab === 'solver' ? solutionText : adaptiveExercises;
    if (textToInsert) {
      // Clean markdown tags for canvas display
      const clean = textToInsert.replace(/[*#]/g, '');
      onInsertTextToBoard(clean.substring(0, 400));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 flex flex-col text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AI Sư Phạm: Giải Toán &amp; Sinh Bài Tập Tương Tự
              </h3>
              <p className="text-[11px] text-slate-500">
                Theo mô hình AI Agents Architect &amp; LangGraph trong SKILL EDUCATION
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Triggers */}
        <div className="flex gap-2 my-3">
          <button
            onClick={handleSolveMath}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Phân Tích &amp; Giải Bài Toán Này</span>
          </button>
          <button
            onClick={handleGenerateAdaptiveExercises}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 text-indigo-700 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
          >
            <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sinh 3 Bài Tập Tương Tự</span>
          </button>
        </div>

        {/* Tabs for result */}
        <div className="flex border-b border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('solver')}
            className={`py-1.5 px-3 border-b-2 transition-all ${
              activeSubTab === 'solver'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Lời Giải Bước Từng Bước
          </button>
          <button
            onClick={() => setActiveSubTab('practice')}
            className={`py-1.5 px-3 border-b-2 transition-all ${
              activeSubTab === 'practice'
                ? 'border-indigo-600 text-indigo-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Bài Tập Tương Tự (3 Cấp Độ)
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto my-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 min-h-[220px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 py-8 text-indigo-700">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              <span className="font-semibold text-xs">AI đang suy luận từng bước...</span>
            </div>
          ) : activeSubTab === 'solver' ? (
            solutionText ? (
              <div className="whitespace-pre-wrap leading-relaxed text-slate-800 font-sans">
                {solutionText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400">
                <Lightbulb className="w-8 h-8 text-amber-400 mb-2 opacity-80" />
                <p>Bấm vào nút "Phân Tích &amp; Giải Bài Toán Này" ở trên để bắt đầu.</p>
              </div>
            )
          ) : adaptiveExercises ? (
            <div className="whitespace-pre-wrap leading-relaxed text-slate-800 font-sans">
              {adaptiveExercises}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400">
              <FileQuestion className="w-8 h-8 text-indigo-400 mb-2 opacity-80" />
              <p>Bấm vào nút "Sinh 3 Bài Tập Tương Tự" để tạo bài luyện tập.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              const text = activeSubTab === 'solver' ? solutionText : adaptiveExercises;
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            disabled={!(activeSubTab === 'solver' ? solutionText : adaptiveExercises)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép văn bản'}</span>
          </button>

          <button
            onClick={handleInsertToBoard}
            disabled={!(activeSubTab === 'solver' ? solutionText : adaptiveExercises)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Chèn Lời Giải Vào Bảng</span>
          </button>
        </div>
      </div>
    </div>
  );
};
