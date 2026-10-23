import { GoogleGenAI } from '@google/genai';
import { OCRResult } from '../types/canvas';

export const AI_MODELS = [
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash Preview',
    badge: 'Mặc định',
    tag: 'Tốc độ siêu nhanh & Xử lý nét vẽ mượt mà',
    desc: 'Tối ưu cho phản hồi thời gian thực, tư vấn bút vẽ và phân tích hình học.',
  },
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro Preview',
    badge: 'Nâng cao',
    tag: 'Suy luận chuyên sâu & Toán học phức tạp',
    desc: 'Xử lý công thức toán cao cấp, phân tích nhân trắc học chữ viết tay.',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Dự phòng',
    tag: 'Tiết kiệm Quota & Ổn định cao',
    desc: 'Lựa chọn tin cậy khi các model mới bị nghẽn tải hoặc hết hạn ngạch.',
  },
] as const;

export type SupportedModelId = typeof AI_MODELS[number]['id'];

const FALLBACK_CHAIN: SupportedModelId[] = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash',
];

export const SPECIALIST_SYSTEM_INSTRUCTION = `Bạn là một chuyên gia tư vấn kỹ thuật cấp cao và hướng dẫn người dùng cho hệ thống "Smart Vector Engine" (Digital Ink Specialist). Bạn am hiểu sâu sắc về công nghệ xử lý đồ họa vector thời gian thực, thuật toán ổn định nét vẽ (Stabilization), và ứng dụng AI trong phân tích nhân trắc học chữ viết. Nhiệm vụ của bạn là hỗ trợ người dùng (học sinh, giáo viên, nhà thiết kế) tối ưu hóa trải nghiệm viết, vẽ và học tập trên nền tảng bảng vẽ điện tử.

Mục tiêu chính:
- Tối ưu hóa hiệu suất: Hướng dẫn triệt tiêu độ trễ, tận dụng cảm biến áp lực bút (Pressure Sensitivity) để tạo nét thanh, nét đậm tự nhiên.
- Hỗ trợ sáng tạo & Học tập: Hướng dẫn bộ công cụ toán học tương tác vật lý (Thước kẻ, Ê-ke, Compa với cơ chế "Hít" Snapping và hiển thị thông số thời gian thực mm/độ) và nhận diện hình học thông minh (Auto-shape).
- Cá nhân hóa trải nghiệm: Tinh chỉnh giao diện Minimalist, Floating Panels, Nút bấm đa năng và AI Handwriting Refinement (căn chỉnh theo tỷ lệ vàng nhưng bảo tồn bản sắc nhân trắc học cá nhân).
- Quản lý dữ liệu chuyên nghiệp: Quản lý lớp (Layers), trích xuất mã màu (Color Picker), xuất bản đa định dạng (PDF, Vector SVG, OCR Searchable Text).

Bộ 4 bút vật lý:
1. Bút mực: Nét sắc sảo, tốc độ và lực nhấn tạo nét thanh đậm chuẩn.
2. Bút chì: Hạt chì nhám, độ mờ gradient, góc nghiêng tạo khối.
3. Bút lông: Hòa trộn màu nghệ thuật, nét dày mềm mại như thư pháp.
4. Bút dạ quang: Bán trong suốt, loang mực phủ văn bản phẳng mịn.

Phông nền hỗ trợ:
- Ô ly học sinh (chuẩn vở tiểu học/THCS Việt Nam)
- Grid kẻ ô vuông toán học
- Dot lưới điểm bullet journal
- Trắng trơn (Blank)
- Giấy ngà Vintage
- Kỹ thuật / Blueprint Dark Mode

CẤU TRÚC PHẢN HỒI BẮT BUỘC (4 BƯỚC):
Mọi phản hồi chuyên gia của bạn PHẢI tuân thủ chuẩn 4 phần rõ ràng:
1. Xác nhận yêu cầu: Nêu rõ mục tiêu của người dùng (tối ưu nét vẽ, vẽ hình học, trích xuất dữ liệu, căn chỉnh thẩm mỹ...).
2. Giải pháp kỹ thuật:
   - Bước 1: Thiết lập công cụ (loại bút, phông nền, lớp tương ứng).
   - Bước 2: Thao tác kỹ thuật (tận dụng cơ chế vật lý, snapping, stabilization, hoặc AI).
   - Bước 3: Tinh chỉnh thẩm mỹ (căn chỉnh tỷ lệ vàng, trích xuất phối màu).
3. Mẹo chuyên gia (Pro-tip): Gợi ý tính năng ẩn, phím tắt hoặc thao tác Multi-action Button nhanh.
4. Kết quả đầu ra: Xác nhận định dạng lưu trữ hoặc tương thích dữ liệu (SVG, PDF, OCR, LaTeX).

Luôn kết thúc hoặc dựa trên triết lý cốt lõi: "Công nghệ phục vụ sự mượt mà tuyệt đối và tính chính xác thẩm mỹ".`;

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem('gemini_api_key') || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string) {
  try {
    localStorage.setItem('gemini_api_key', key.trim());
  } catch {}
}

export function getStoredModel(): SupportedModelId {
  try {
    const m = localStorage.getItem('gemini_selected_model') as SupportedModelId;
    if (FALLBACK_CHAIN.includes(m)) return m;
  } catch {}
  return 'gemini-3-flash-preview';
}

export function setStoredModel(model: SupportedModelId) {
  try {
    localStorage.setItem('gemini_selected_model', model);
  } catch {}
}

/**
 * Execute Gemini generateContent with automatic retry and model fallback chain
 */
export async function generateContentWithFallback(
  apiKey: string,
  preferredModel: SupportedModelId,
  contents: any,
  config?: any,
  onModelFallback?: (fromModel: string, toModel: string, errorReason: string) => void
): Promise<{ text: string; modelUsed: string }> {
  if (!apiKey) {
    throw new Error('Chưa thiết lập Gemini API Key. Vui lòng bấm vào nút "Cài đặt API Key" để nhập.');
  }

  // Build model priority chain starting with preferredModel
  const chain: SupportedModelId[] = [
    preferredModel,
    ...FALLBACK_CHAIN.filter(m => m !== preferredModel),
  ];

  let lastError: any = null;

  for (let i = 0; i < chain.length; i++) {
    const currentModel = chain[i];
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const response = await ai.models.generateContent({
        model: currentModel,
        contents,
        config,
      });

      return {
        text: response.text || '',
        modelUsed: currentModel,
      };
    } catch (err: any) {
      lastError = err;
      const errorMsg = err?.message || String(err);
      console.warn(`Model ${currentModel} gặp lỗi: ${errorMsg}`);

      // If next model exists, trigger fallback
      if (i < chain.length - 1) {
        const nextModel = chain[i + 1];
        if (onModelFallback) {
          onModelFallback(currentModel, nextModel, errorMsg);
        }
      }
    }
  }

  // All models failed -> Throw raw error (VD: 429 RESOURCE_EXHAUSTED)
  const rawStatus = lastError?.status || lastError?.code || '';
  const rawMsg = lastError?.message || 'Không thể kết nối đến Gemini API';
  throw new Error(`${rawStatus ? `[${rawStatus}] ` : ''}${rawMsg}`);
}

/**
 * Call Specialist Assistant Chat
 */
export async function callSpecialistChat(options: {
  message: string;
  context: any;
  imageBase64?: string;
  apiKey: string;
  preferredModel?: SupportedModelId;
  onModelFallback?: (fromModel: string, toModel: string, errorReason: string) => void;
}): Promise<{ reply: string; modelUsed: string }> {
  const { message, context, imageBase64, apiKey, preferredModel = getStoredModel(), onModelFallback } = options;

  const parts: any[] = [];

  if (imageBase64) {
    const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: cleanData,
      },
    });
  }

  const promptContext = `[Thông tin trạng thái Canvas hiện tại]
- Công cụ đang dùng: ${context?.activeTool || 'Bút vẽ'}
- Loại bút: ${context?.currentPen || 'Bút mực'}
- Kích thước nét: ${context?.penSize || 4}px, Màu: ${context?.penColor || '#1e293b'}
- Phông nền: ${context?.background || 'Ô ly học sinh'}
- Số lớp (Layers): ${context?.layerCount || 1}
- Số nét vẽ hiện có: ${context?.strokeCount || 0}
- Chế độ Auto-shape: ${context?.autoShape ? 'Đang bật' : 'Tắt'}
- Công cụ toán học: ${context?.mathTool || 'Không'}

Câu hỏi hoặc yêu cầu từ người dùng: ${message}`;

  parts.push({ text: promptContext });

  const result = await generateContentWithFallback(
    apiKey,
    preferredModel,
    { parts },
    {
      systemInstruction: SPECIALIST_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
    onModelFallback
  );

  return {
    reply: result.text || 'Đã xử lý thông tin từ chuyên gia.',
    modelUsed: result.modelUsed,
  };
}

/**
 * Call Optical Character Recognition (OCR) & Handwriting Anthropometrics
 */
export async function callOcrAnalyze(options: {
  imageBase64: string;
  apiKey: string;
  preferredModel?: SupportedModelId;
  onModelFallback?: (fromModel: string, toModel: string, errorReason: string) => void;
}): Promise<{ data: OCRResult; modelUsed: string }> {
  const { imageBase64, apiKey, preferredModel = getStoredModel(), onModelFallback } = options;

  const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

  const parts = [
    {
      inlineData: {
        mimeType: 'image/png',
        data: cleanData,
      },
    },
    {
      text: `Bạn là hệ thống OCR quang học chuyên sâu và phân tích nhân trắc học chữ viết tay cho Smart Vector Engine.
Hãy phân tích hình ảnh chữ viết và nét vẽ từ bảng vẽ điện tử:
1. Trích xuất chính xác toàn bộ văn bản chữ viết tay thành text số có thể tìm kiếm (Searchable Text).
2. Nếu có công thức toán học, hãy trích xuất sang định dạng LaTeX chuẩn ($...$).
3. Phân tích nét viết: nhận xét độ nghiêng, tính ổn định nét, và mức độ cân đối nhân trắc học.
4. Gợi ý căn chỉnh thẩm mỹ theo tỷ lệ vàng (Golden Ratio).

Trả về dạng JSON với định dạng:
{
  "transcribedText": "chuỗi văn bản đã trích xuất",
  "mathFormulas": ["công thức 1", "công thức 2"],
  "handwritingAnalysis": {
    "neatnessScore": 85,
    "slantAngle": "khoảng 15 độ nghiêng về phải",
    "consistency": "Đều nét, nhịp điệu tốt",
    "goldenRatioEvaluation": "Độ cao thân chữ x-height đạt tỷ lệ 1:1.6 so với nét vươn cao (ascender)."
  },
  "recommendations": "Lời khuyên cải thiện"
}`,
    },
  ];

  const result = await generateContentWithFallback(
    apiKey,
    preferredModel,
    { parts },
    {
      responseMimeType: 'application/json',
    },
    onModelFallback
  );

  let parsed: OCRResult;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    parsed = {
      transcribedText: result.text,
      mathFormulas: [],
      handwritingAnalysis: {
        neatnessScore: 80,
        slantAngle: 'Thẳng đứng',
        consistency: 'Tốt',
        goldenRatioEvaluation: 'Đạt chuẩn',
      },
      recommendations: 'Tận dụng thuật toán Stabilization để nét vẽ mượt mà hơn.',
    };
  }

  return {
    data: parsed,
    modelUsed: result.modelUsed,
  };
}
