import React, { useState } from 'react';
import { Stroke, Layer, BackgroundType, CanvasPage } from '../types/canvas';
import { exportToSVG } from '../utils/strokeRenderer';
import {
  renderPDFSlices,
  buildPDFBlobFromSlices,
  downloadPDFBlob,
  printPDFSlices,
} from '../utils/pdfGenerator';
import {
  exportToPPTX,
  exportToDOCX,
  downloadOfficeBlob,
} from '../utils/officeExporter';
import {
  Download,
  FileCode,
  FileImage,
  FileText,
  Check,
  X,
  Printer,
  Loader2,
  Presentation,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: CanvasPage[];
  currentPageId: string;
  layers: Layer[];
  background: BackgroundType;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  canvasWidth: number;
  canvasHeight: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  pages,
  currentPageId,
  layers,
  background,
  canvasRef,
  canvasWidth,
  canvasHeight,
}) => {
  const [copiedSVG, setCopiedSVG] = useState(false);
  const [docTitle, setDocTitle] = useState('SmartVector_Note');
  const [exportScope, setExportScope] = useState<'all' | 'current'>('all');
  const [includeBackground, setIncludeBackground] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgressMsg, setPdfProgressMsg] = useState('');

  if (!isOpen) return null;

  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  const activeStrokes = currentPage?.strokes || [];

  // 1. Direct PDF File Download
  const handleDownloadDirectPDF = async () => {
    try {
      setIsExportingPDF(true);
      setPdfProgressMsg('Đang trích xuất nét vẽ và xử lý phân trang OneNote...');

      const slices = await renderPDFSlices({
        pages,
        layers,
        globalBackground: background,
        canvasWidth,
        exportScope,
        currentPageId,
        includeBackground,
        docTitle,
        showPageNumbers,
      });

      setPdfProgressMsg('Đang đóng gói tệp PDF đa trang chuẩn in ấn...');
      const blob = buildPDFBlobFromSlices(slices);

      const fileName = `${docTitle || 'vector_note'}_${exportScope === 'all' ? 'ToanBo' : currentPage?.title || 'Trang'}.pdf`;
      downloadPDFBlob(blob, fileName);
    } catch (err: any) {
      alert(`Đã có lỗi khi tạo PDF: ${err.message}`);
    } finally {
      setIsExportingPDF(false);
      setPdfProgressMsg('');
    }
  };

  // 2. Open System Print / Browser PDF Dialog
  const handlePrintPDFDialog = async () => {
    try {
      setIsExportingPDF(true);
      setPdfProgressMsg('Đang chuẩn bị trang in chất lượng cao...');

      const slices = await renderPDFSlices({
        pages,
        layers,
        globalBackground: background,
        canvasWidth,
        exportScope,
        currentPageId,
        includeBackground,
        docTitle,
        showPageNumbers,
      });

      printPDFSlices(slices, docTitle);
    } catch (err: any) {
      alert(`Đã có lỗi khi mở trang in: ${err.message}`);
    } finally {
      setIsExportingPDF(false);
      setPdfProgressMsg('');
    }
  };

  // 3. Download Vector SVG
  const handleDownloadSVG = () => {
    const svgString = exportToSVG(activeStrokes, canvasWidth, currentPage?.pageHeight || canvasHeight, background);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle || 'vector_note'}_${currentPage?.title || 'trang'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4. Download High-Res PNG
  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png', 1.0);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle || 'vector_note'}_${currentPage?.title || 'trang'}.png`;
    a.click();
  };

  // 5. Download PowerPoint Presentation (.pptx)
  const handleDownloadPPTX = async () => {
    try {
      setIsExportingPDF(true);
      setPdfProgressMsg('Đang tạo các Slide PowerPoint 16:9 chuẩn bài giảng...');
      const targetPages = exportScope === 'all' ? pages : [currentPage];
      const blob = await exportToPPTX(targetPages, layers, background, canvasWidth, docTitle);
      downloadOfficeBlob(blob, `${docTitle || 'Lesson'}.pptx`);
    } catch (err: any) {
      alert(`Lỗi xuất PowerPoint: ${err.message}`);
    } finally {
      setIsExportingPDF(false);
      setPdfProgressMsg('');
    }
  };

  // 6. Download Word Document (.docx)
  const handleDownloadDOCX = async () => {
    try {
      setIsExportingPDF(true);
      setPdfProgressMsg('Đang đóng gói tài liệu Word .docx...');
      const targetPages = exportScope === 'all' ? pages : [currentPage];
      const blob = await exportToDOCX(targetPages, layers, background, canvasWidth, docTitle);
      downloadOfficeBlob(blob, `${docTitle || 'Document'}.docx`);
    } catch (err: any) {
      alert(`Lỗi xuất Word: ${err.message}`);
    } finally {
      setIsExportingPDF(false);
      setPdfProgressMsg('');
    }
  };

  // 7. Download Complete JSON Project Backup
  const handleDownloadJSON = () => {
    const data = {
      title: docTitle,
      version: '2.0',
      timestamp: Date.now(),
      background,
      layers,
      pages,
      activePageId: currentPageId,
      viewport: { width: canvasWidth, height: canvasHeight },
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
    const a = document.createElement('a');
    a.href = jsonString;
    a.download = `${docTitle || 'vector_note'}_backup.json`;
    a.click();
  };

  // Copy SVG Code
  const handleCopySVG = () => {
    const svgString = exportToSVG(activeStrokes, canvasWidth, currentPage?.pageHeight || canvasHeight, background);
    navigator.clipboard.writeText(svgString);
    setCopiedSVG(true);
    setTimeout(() => setCopiedSVG(false), 2000);
  };

  const totalStrokes = pages.reduce((acc, p) => acc + p.strokes.length, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 flex flex-col text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600" />
              Xuất Bản & Tải Về Tài Liệu (PDF / Vector)
            </h3>
            <p className="text-[11px] text-slate-500">
              Chia trang OneNote chuẩn A4, độ phân giải cao không vỡ hạt
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title input */}
        <div className="mt-3 mb-2">
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Tên tài liệu / bài giảng:
          </label>
          <input
            type="text"
            value={docTitle}
            onChange={e => setDocTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Nhập tên tệp..."
          />
        </div>

        {/* PDF Settings & Scope Selection */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl p-3 my-2 space-y-2.5">
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block">
            Cấu Hình Xuất Tệp PDF (Chia Trang OneNote)
          </span>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Scope: All vs Current */}
            <label
              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                exportScope === 'all'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={exportScope === 'all'}
                onChange={() => setExportScope('all')}
                className="accent-indigo-600"
              />
              <div>
                <span className="block">Toàn bộ sổ tay</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Tất cả {pages.length} trang ({totalStrokes} nét)
                </span>
              </div>
            </label>

            <label
              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${
                exportScope === 'current'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <input
                type="radio"
                name="exportScope"
                checked={exportScope === 'current'}
                onChange={() => setExportScope('current')}
                className="accent-indigo-600"
              />
              <div>
                <span className="block">Chỉ trang hiện tại</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {currentPage?.title} ({activeStrokes.length} nét)
                </span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={e => setIncludeBackground(e.target.checked)}
                className="accent-indigo-600 rounded"
              />
              <span>Bao gồm phông nền (Ô ly / Kẻ ô)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={showPageNumbers}
                onChange={e => setShowPageNumbers(e.target.checked)}
                className="accent-indigo-600 rounded"
              />
              <span>In số trang & tiêu đề OneNote</span>
            </label>
          </div>
        </div>

        {/* Loading status if generating */}
        {isExportingPDF && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2.5 my-2 text-indigo-800 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">{pdfProgressMsg}</span>
          </div>
        )}

        {/* Main Export Action Cards */}
        <div className="grid grid-cols-2 gap-3 my-2">
          {/* 1. Direct PDF Download (Highlight) */}
          <div
            onClick={!isExportingPDF ? handleDownloadDirectPDF : undefined}
            className="p-3.5 border-2 border-indigo-500 bg-indigo-50/70 hover:bg-indigo-100/70 rounded-2xl cursor-pointer transition-all flex flex-col gap-1.5 shadow-sm hover:shadow group"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Download className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-200/80 px-2 py-0.5 rounded-full">
                Tải Trực Tiếp
              </span>
            </div>
            <span className="font-bold text-slate-900 text-sm">
              Tải Về File .PDF
            </span>
            <span className="text-[11px] text-slate-600 leading-tight">
              Tự động cắt theo vạch chia trang OneNote thành các trang A4 riêng biệt, tải file .pdf về máy.
            </span>
          </div>

          {/* 2. System Print to PDF */}
          <div
            onClick={!isExportingPDF ? handlePrintPDFDialog : undefined}
            className="p-3.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-2xl cursor-pointer transition-all flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                <Printer className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-500 uppercase">Hộp Thoại In</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">
              In & Lưu PDF Trình Duyệt
            </span>
            <span className="text-[11px] text-slate-600 leading-tight">
              Mở giao diện Print Preview để chỉnh lề, máy in vật lý hoặc lưu PDF qua Google Chrome/Edge.
            </span>
          </div>

          {/* 3. PowerPoint Presentation */}
          <div
            onClick={!isExportingPDF ? handleDownloadPPTX : undefined}
            className="p-3.5 border border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50 rounded-2xl cursor-pointer transition-all flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-amber-600 text-white">
                <Presentation className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded uppercase">
                Slide 16:9
              </span>
            </div>
            <span className="font-bold text-slate-900 text-sm">Slide PowerPoint (.PPTX)</span>
            <span className="text-[11px] text-slate-600 leading-tight">
              Chuyển mỗi trang bảng thành 1 slide PowerPoint chuẩn tỉ lệ 16:9 để trình chiếu.
            </span>
          </div>

          {/* 4. Word Document */}
          <div
            onClick={!isExportingPDF ? handleDownloadDOCX : undefined}
            className="p-3.5 border border-blue-300 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 rounded-2xl cursor-pointer transition-all flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase">
                Giáo Án
              </span>
            </div>
            <span className="font-bold text-slate-900 text-sm">Tài Liệu Word (.DOCX)</span>
            <span className="text-[11px] text-slate-600 leading-tight">
              Tạo tài liệu Word đính kèm hình ảnh và đề cương bài học chuẩn A4 in ấn.
            </span>
          </div>

          {/* 5. Vector SVG */}
          <div
            onClick={handleDownloadSVG}
            className="p-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-2xl cursor-pointer transition-all flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                <FileCode className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase">Vector</span>
            </div>
            <span className="font-bold text-slate-900 text-xs">Đồ Họa Vector (.SVG)</span>
            <span className="text-[10px] text-slate-500">
              Vô hạn độ phân giải, phù hợp mở trong Illustrator / Figma.
            </span>
          </div>

          {/* 6. High-Res PNG */}
          <div
            onClick={handleDownloadPNG}
            className="p-3 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-2xl cursor-pointer transition-all flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <FileImage className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-slate-400 uppercase">Hình ảnh</span>
            </div>
            <span className="font-bold text-slate-900 text-xs">Ảnh Siêu Nét (.PNG)</span>
            <span className="text-[10px] text-slate-500">
              Chụp màn hình độ phân giải cao để gửi qua Zalo / Facebook.
            </span>
          </div>
        </div>

        {/* Footer: JSON Backup & Quick SVG copy */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <button
            onClick={handleDownloadJSON}
            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1.5"
            title="Sao lưu toàn bộ sổ tay, nét vẽ và cấu trúc lớp"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Sao Lưu Sổ Tay (.JSON)</span>
          </button>

          <button
            onClick={handleCopySVG}
            className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5"
          >
            {copiedSVG ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã sao chép mã SVG!</span>
              </>
            ) : (
              <>
                <FileCode className="w-3.5 h-3.5" />
                <span>Sao chép mã SVG</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
