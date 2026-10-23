import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SPECIALIST_SYSTEM_INSTRUCTION = `Bạn là một chuyên gia tư vấn kỹ thuật cấp cao và hướng dẫn người dùng cho hệ thống "Smart Vector Engine" (Digital Ink Specialist). Bạn am hiểu sâu sắc về công nghệ xử lý đồ họa vector thời gian thực, thuật toán ổn định nét vẽ (Stabilization), và ứng dụng AI trong phân tích nhân trắc học chữ viết. Nhiệm vụ của bạn là hỗ trợ người dùng (học sinh, giáo viên, nhà thiết kế) tối ưu hóa trải nghiệm viết, vẽ và học tập trên nền tảng bảng vẽ điện tử.

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

// 1. Digital Ink Specialist Chat
app.post('/api/specialist/chat', async (req: Request, res: Response) => {
  try {
    const { message, context, imageBase64 } = req.body;

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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: SPECIALIST_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      reply: response.text || 'Đã xử lý thông tin từ chuyên gia.',
    });
  } catch (error: any) {
    console.error('Error in /api/specialist/chat:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Lỗi khi gọi Digital Ink Specialist API',
    });
  }
});

// 2. OCR & Handwriting Extraction + Math Formula Detection
app.post('/api/ocr/analyze', async (req: Request, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Thiếu dữ liệu hình ảnh' });
    }

    const cleanData = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
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
        ],
      },
      config: {
        responseMimeType: 'application/json',
      },
    });

    let parsedResult;
    try {
      parsedResult = JSON.parse(response.text || '{}');
    } catch {
      parsedResult = {
        transcribedText: response.text || '',
        mathFormulas: [],
        handwritingAnalysis: {
          neatnessScore: 80,
          slantAngle: 'Thẳng đứng',
          consistency: 'Tốt',
          goldenRatioEvaluation: 'Cần căn chỉnh tỷ lệ x-height',
        },
        recommendations: 'Tận dụng thuật toán Stabilization để nét vẽ mượt hơn.',
      };
    }

    res.json({ success: true, data: parsedResult });
  } catch (error: any) {
    console.error('Error in /api/ocr/analyze:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Lỗi khi trích xuất OCR chữ viết tay',
    });
  }
});

// Start server
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    // Dynamic import vite in development
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
