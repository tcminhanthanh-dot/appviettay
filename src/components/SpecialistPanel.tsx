import React, { useState } from 'react';
import { Bot, Send, Sparkles, FileText, CheckCircle2, Copy, HelpCircle, X, ChevronRight, Lightbulb, PenTool, RefreshCw, Key } from 'lucide-react';
import { OCRResult } from '../types/canvas';
import {
  callSpecialistChat,
  callOcrAnalyze,
  getStoredApiKey,
  getStoredModel,
} from '../utils/geminiClient';

interface SpecialistPanelProps {
  isOpen: boolean;
  onClose: () => void;
  getCanvasSnapshot: () => string;
  canvasContext: {
    currentPen: string;
    background: string;
    layerCount: number;
    strokeCount: number;
    autoShape: boolean;
    mathTool: string;
    activeTool: string;
    penSize: number;
    penColor: string;
  };
  onOpenApiKeyModal?: () => void;
}

export const SpecialistPanel: React.FC<SpecialistPanelProps> = ({
  isOpen,
  onClose,
  getCanvasSnapshot,
  canvasContext,
  onOpenApiKeyModal,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'ocr' | 'guide'>('chat');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'specialist'; text: string; image?: string; timestamp: number }>>([
    {
      sender: 'specialist',
      text: `Xin chào! Tôi là **Chuyên gia Tư vấn Kỹ thuật Smart Vector Engine**.

Tôi có thể hỗ trợ bạn:
- Tối ưu hóa nét bút vật lý (Bút mực, Bút chì, Bút lông, Bút dạ quang) và triệt tiêu độ trễ.
- Hướng dẫn công cụ toán học tương tác vật lý (Thước kẻ, Ê-ke, Compa) với cơ chế "Hít" nét.
- Nhận diện hình học Auto-shape & Căn chỉnh chữ viết tay theo Tỷ Lệ Vàng.
- Trích xuất chữ viết tay OCR và công thức toán học số hóa.

Bạn đang cần giải pháp cho bài vẽ, ghi chú hay công cụ nào?`,
      timestamp: Date.now(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachSnapshot, setAttachSnapshot] = useState(true);

  // OCR State
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrData, setOcrData] = useState<OCRResult | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() && !attachSnapshot) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      if (onOpenApiKeyModal) onOpenApiKeyModal();
      setMessages(prev => [
        ...prev,
        {
          sender: 'specialist',
          text: `⚠️ **Thông báo:** Bạn chưa thiết lập Gemini API Key. Vui lòng bấm vào nút **"Cài đặt (Lấy API key để sử dụng app)"** trên Header hoặc nhập Key vào bảng cài đặt để kích hoạt trợ lý AI.`,
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    let snapshot: string | undefined;
    if (attachSnapshot) {
      snapshot = getCanvasSnapshot();
    }

    const newMsg = {
      sender: 'user' as const,
      text,
      image: snapshot,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInputPrompt('');
    setLoading(true);

    try {
      const result = await callSpecialistChat({
        message: text,
        context: canvasContext,
        imageBase64: snapshot,
        apiKey,
        preferredModel: getStoredModel(),
        onModelFallback: (fromModel, toModel, errorReason) => {
          setMessages(prev => [
            ...prev,
            {
              sender: 'specialist',
              text: `🔄 *Cơ chế Fallback:* Model \`${fromModel}\` bị quá tải (${errorReason}). Đang tự động chuyển đổi sang \`${toModel}\`...`,
              timestamp: Date.now(),
            },
          ]);
        },
      });

      setMessages(prev => [
        ...prev,
        {
          sender: 'specialist',
          text: result.reply,
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'specialist',
          text: `🔴 **Đã dừng do lỗi API:** \`${err.message}\`\n\n*Nếu gặp lỗi 429 RESOURCE_EXHAUSTED, vui lòng đổi API key khác bằng nút Cài đặt trên Header.*`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunOCR = async () => {
    const apiKey = getStoredApiKey();
    if (!apiKey) {
      if (onOpenApiKeyModal) onOpenApiKeyModal();
      alert('Vui lòng thiết lập Gemini API Key để thực hiện trích xuất OCR.');
      return;
    }

    setOcrLoading(true);
    setOcrData(null);
    try {
      const snapshot = getCanvasSnapshot();
      const result = await callOcrAnalyze({
        imageBase64: snapshot,
        apiKey,
        preferredModel: getStoredModel(),
        onModelFallback: (fromModel, toModel, errorReason) => {
          console.log(`OCR Fallback from ${fromModel} to ${toModel}: ${errorReason}`);
        },
      });
      setOcrData(result.data);
    } catch (err: any) {
      alert(`🔴 Đã dừng do lỗi OCR: ${err.message}`);
    } finally {
      setOcrLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (!isOpen) return null;

  const currentModel = getStoredModel();


  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white/95 backdrop-blur-xl border-l border-slate-200/80 shadow-2xl z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
              Chuyên Gia Digital Ink
              <span className="text-[10px] bg-indigo-500/40 text-indigo-200 px-1.5 py-0.5 rounded font-mono">
                Smart Vector AI
              </span>
            </h3>
            <p className="text-[11px] text-slate-300">Tư vấn xử lý nét vẽ, toán học & nhân trắc học</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenApiKeyModal && (
            <button
              onClick={onOpenApiKeyModal}
              className="flex items-center gap-1.5 text-[11px] bg-white/10 hover:bg-white/20 text-indigo-200 px-2.5 py-1.5 rounded-xl transition-colors border border-indigo-400/30"
              title="Cài đặt API Key & Chọn Model AI"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[10px] hidden sm:inline">{currentModel}</span>
              <span className="text-[10px] text-amber-300 font-semibold underline">Đổi Key</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50/80 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'chat'
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Tư Vấn Kỹ Thuật</span>
        </button>
        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'ocr'
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>OCR & Toán Học</span>
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'guide'
              ? 'border-indigo-600 text-indigo-600 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Chuẩn System</span>
        </button>
      </div>

      {/* Tab 1: Chat Tư Vấn Chuyên Gia */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick preset suggestions */}
          <div className="p-2.5 bg-indigo-50/60 border-b border-indigo-100 flex gap-1.5 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => handleSendMessage('Tối ưu hóa nét thanh nét đậm với bút mực và thuật toán ổn định?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-full transition-colors flex items-center gap-1 shadow-xs"
            >
              <Lightbulb className="w-3 h-3 text-indigo-600" />
              Nét thanh nét đậm
            </button>
            <button
              onClick={() => handleSendMessage('Hướng dẫn sử dụng Thước kẻ và Compa để dựng góc 60 độ chuẩn xác?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-full transition-colors flex items-center gap-1 shadow-xs"
            >
              <PenTool className="w-3 h-3 text-indigo-600" />
              Dựng hình với Compa
            </button>
            <button
              onClick={() => handleSendMessage('Cách căn chỉnh chữ viết theo Tỷ Lệ Vàng bảo tồn nhân trắc học?')}
              className="whitespace-nowrap px-2.5 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-950 rounded-full transition-colors flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Tỷ lệ vàng chữ viết
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none'
                  }`}
                >
                  {msg.image && (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                      <img src={msg.image} alt="Canvas Snapshot" className="max-h-28 w-auto object-contain bg-slate-100" />
                    </div>
                  )}
                  <div className="prose prose-xs max-w-none space-y-1.5 whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">
                  {msg.sender === 'user' ? 'Bạn' : 'Digital Ink Specialist'} •{' '}
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Chuyên gia đang phân tích đồ họa và cấu trúc nét vẽ...</span>
              </div>
            )}
          </div>

          {/* Input box */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 px-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={attachSnapshot}
                  onChange={e => setAttachSnapshot(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Đính kèm ảnh bản vẽ hiện tại để phân tích</span>
              </label>
              <span className="text-slate-400">
                {canvasContext.currentPen} • {canvasContext.background}
              </span>
            </div>
            <div className="flex gap-2">
              <textarea
                value={inputPrompt}
                onChange={e => setInputPrompt(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Hỏi về cách vẽ, tối ưu nét, toán học hoặc yêu cầu tinh chỉnh..."
                rows={2}
                className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                disabled={loading || (!inputPrompt.trim() && !attachSnapshot)}
                onClick={() => handleSendMessage()}
                className="w-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: OCR & Công Thức Toán Học */}
      {activeTab === 'ocr' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-semibold text-indigo-950">AI OCR Quang Học & Nhân Trắc Học</p>
              <p className="text-indigo-800/80 mt-0.5">
                Chuyển chữ viết tay sang văn bản số tìm kiếm được (Searchable Text), trích xuất công thức LaTeX và đánh giá nét chữ.
              </p>
            </div>
          </div>

          <button
            onClick={handleRunOCR}
            disabled={ocrLoading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            {ocrLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang quét và nhận dạng nét chữ...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Quét Bản Vẽ Hiện Tại (Trích Xuất OCR)</span>
              </>
            )}
          </button>

          {ocrData && (
            <div className="space-y-4 text-xs">
              {/* Text result */}
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Văn Bản Đã Số Hóa
                  </span>
                  <button
                    onClick={() => copyToClipboard(ocrData.transcribedText)}
                    className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedText ? 'Đã sao chép!' : 'Sao chép'}
                  </button>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap">
                  {ocrData.transcribedText || '(Không phát hiện văn bản rõ ràng)'}
                </div>
              </div>

              {/* Math Formulas if any */}
              {ocrData.mathFormulas && ocrData.mathFormulas.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <span className="font-bold text-slate-800 block mb-2">
                    📐 Công Thức Toán Học (LaTeX):
                  </span>
                  <div className="space-y-1.5">
                    {ocrData.mathFormulas.map((form, idx) => (
                      <div key={idx} className="bg-indigo-50/50 p-2 rounded border border-indigo-100 font-mono text-indigo-900 text-[11px]">
                        {form}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Handwriting anthropometrics */}
              {ocrData.handwritingAnalysis && (
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
                  <span className="font-bold text-slate-800 block mb-2.5">
                    🔬 Phân Tích Nhân Trắc Học Chữ Viết:
                  </span>
                  <div className="space-y-2 text-slate-700">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <span>Điểm Thẩm Mỹ / Đều Nét:</span>
                      <span className="font-bold font-mono text-indigo-600">
                        {ocrData.handwritingAnalysis.neatnessScore}/100
                      </span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="font-semibold block text-slate-800">Góc nghiêng nét:</span>
                      <span className="text-slate-600">{ocrData.handwritingAnalysis.slantAngle}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded">
                      <span className="font-semibold block text-slate-800">Đánh giá Tỷ Lệ Vàng (1:1.618):</span>
                      <span className="text-slate-600">{ocrData.handwritingAnalysis.goldenRatioEvaluation}</span>
                    </div>
                  </div>
                </div>
              )}

              {ocrData.recommendations && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block mb-1">💡 Lời khuyên của chuyên gia:</span>
                  <p>{ocrData.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Chuẩn System & Hướng Dẫn */}
      {activeTab === 'guide' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <h4 className="font-bold text-indigo-950 text-sm mb-1.5">
              Quy Chuẩn 4 Loại Bút Vật Lý
            </h4>
            <ul className="space-y-2">
              <li className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <strong>Bút mực:</strong> Nét sắc sảo, độ trễ cực thấp. Biến thiên lực nhấn (Pressure Sensitivity) và tốc độ tạo nét thanh, nét đậm tự nhiên.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                <div>
                  <strong>Bút chì:</strong> Mô phỏng độ nhám bề mặt giấy, hạt graphite siêu nhỏ, độ mờ gradient lý tưởng cho phác thảo mỹ thuật.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <div>
                  <strong>Bút lông:</strong> Khả năng hòa trộn màu nghệ thuật, nét dày mềm mại biểu cảm như nghệ thuật thư pháp.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                <div>
                  <strong>Bút dạ quang:</strong> Bán trong suốt với hiệu ứng hòa trộn Multiply, đầu vát phẳng nhấn mạnh văn bản mà không che lấp chữ.
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
            <h4 className="font-bold text-indigo-950 text-sm mb-1.5">
              Công Cụ Toán Học & Snapping
            </h4>
            <p className="mb-2">
              Bộ công cụ toán học tương tác vật lý (Thước kẻ thẳng, Ê-ke 45°-90°, Compa góc quét) tích hợp cơ chế <strong>"Hít" (Snapping)</strong> và hiển thị thông số thời gian thực (mm, độ góc, bán kính R).
            </p>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-600">
              • Vẽ gần mép thước &lt; 20px → Tự động hít thành đường thẳng chuẩn.<br />
              • Compa quay tâm cố định → Bán kính hiển thị tức thì theo chuẩn cm.
            </div>
          </div>

          <div className="p-3 bg-indigo-50/80 rounded-xl border border-indigo-100 text-indigo-900 font-medium text-center">
            "Công nghệ phục vụ sự mượt mà tuyệt đối và tính chính xác thẩm mỹ."
          </div>
        </div>
      )}
    </div>
  );
};
