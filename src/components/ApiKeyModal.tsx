import React, { useState } from 'react';
import {
  AI_MODELS,
  SupportedModelId,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel,
} from '../utils/geminiClient';
import { Key, Sparkles, ExternalLink, Check, X, ShieldAlert, Cpu } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (key: string, model: SupportedModelId) => void;
  isMandatory?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isMandatory = false,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
  const [selectedModel, setSelectedModel] = useState<SupportedModelId>(() => getStoredModel());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!apiKeyInput.trim()) {
      alert('Vui lòng nhập API key từ Google AI Studio để tiếp tục.');
      return;
    }
    setStoredApiKey(apiKeyInput);
    setStoredModel(selectedModel);
    setIsSaved(true);
    if (onSave) onSave(apiKeyInput.trim(), selectedModel);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 flex flex-col text-xs text-slate-700 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Thiết Lập Gemini API Key & Model AI</h3>
              <p className="text-[11px] text-slate-500">
                Lưu vào trình duyệt của bạn (Local Storage) • Bảo mật 100%
              </p>
            </div>
          </div>
          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Instructions banner */}
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 my-3">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-900">
              <p className="font-semibold mb-0.5">
                Chưa có Google Gemini API Key?
              </p>
              <p className="text-amber-800 leading-relaxed mb-1.5">
                Bạn có thể lấy API Key miễn phí hoàn toàn từ Google AI Studio chỉ trong 30 giây để kích hoạt Chuyên Gia AI và nhận diện chữ viết tay OCR.
              </p>
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-bold text-indigo-700 hover:text-indigo-900 underline"
              >
                <span>Nhận API Key tại https://aistudio.google.com/api-keys</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mb-3">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Google Gemini API Key:
          </label>
          <div className="relative">
            <input
              type="password"
              value={apiKeyInput}
              onChange={e => setApiKeyInput(e.target.value)}
              placeholder="Dán mã API Key của bạn (AIzaSy...)"
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none pr-8"
            />
            {apiKeyInput && (
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Đã nhập
              </span>
            )}
          </div>
        </div>

        {/* Model Selection Cards */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-600" />
            Chọn Model AI Mặc Định & Cơ Chế Fallback Dự Phòng:
          </label>
          <div className="space-y-2">
            {AI_MODELS.map(model => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedModel"
                    checked={isSelected}
                    onChange={() => setSelectedModel(model.id)}
                    className="mt-1 accent-indigo-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs text-slate-900">{model.name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                          model.badge === 'Mặc định'
                            ? 'bg-indigo-200 text-indigo-800'
                            : model.badge === 'Nâng cao'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-indigo-700 leading-tight mb-0.5">
                      {model.tag}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {model.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1.5 italic">
            * Cơ chế Fallback tự động: Nếu model hiện tại quá tải (429), hệ thống sẽ tự động thử lại với model kế tiếp.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
          {!isMandatory && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Hủy
            </button>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Đã Lưu Cấu Hình!</span>
              </>
            ) : (
              <span>Lưu Thiết Lập & Bắt Đầu Dùng</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
