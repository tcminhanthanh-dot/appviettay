import React from 'react';
import { CanvasPage } from '../types/canvas';
import { Plus, Trash2, Split, ArrowDown } from 'lucide-react';

interface OneNotePageBreaksProps {
  currentPage: CanvasPage;
  canvasWidth: number;
  showPageBreaks: boolean;
  onExpandPageHeight: () => void;
  onRemovePageBreak: (breakY: number) => void;
  onInsertBreakAt: (y: number) => void;
}

export const OneNotePageBreaks: React.FC<OneNotePageBreaksProps> = ({
  currentPage,
  canvasWidth,
  showPageBreaks,
  onExpandPageHeight,
  onRemovePageBreak,
}) => {
  const standardA4Height = Math.round(canvasWidth * 1.4142);
  const totalHeight = Math.max(currentPage.pageHeight, standardA4Height);

  // Combine automatic A4 breaks and manual breaks
  const breaks: { y: number; pageNumber: number; isManual: boolean }[] = [];

  // 1. Automatic A4 boundaries
  let autoY = standardA4Height;
  let pageNum = 1;
  while (autoY < totalHeight) {
    breaks.push({ y: autoY, pageNumber: pageNum, isManual: false });
    autoY += standardA4Height;
    pageNum++;
  }

  // 2. Manual breaks (merge and sort)
  if (currentPage.pageBreaks) {
    for (const manualY of currentPage.pageBreaks) {
      // Check if not too close to auto breaks
      if (!breaks.some(b => Math.abs(b.y - manualY) < 40)) {
        breaks.push({ y: manualY, pageNumber: 0, isManual: true });
      }
    }
  }

  breaks.sort((a, b) => a.y - b.y);

  // Assign page numbers in sorted sequence
  breaks.forEach((b, index) => {
    b.pageNumber = index + 1;
  });

  return (
    <div
      className="absolute inset-x-0 pointer-events-none z-10"
      style={{ height: `${totalHeight}px`, top: 0, left: 0 }}
    >
      {/* Page Breaks */}
      {showPageBreaks &&
        breaks.map(b => (
          <div
            key={b.y}
            className="absolute left-0 right-0 pointer-events-auto flex items-center justify-center group"
            style={{ top: `${b.y}px`, transform: 'translateY(-50%)' }}
          >
            {/* Dashed Line */}
            <div className="absolute inset-x-0 h-px border-b-2 border-dashed border-indigo-300/80 group-hover:border-indigo-500 transition-colors" />

            {/* Pill Badge */}
            <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 bg-white/95 backdrop-blur-md border border-indigo-200/90 group-hover:border-indigo-400 rounded-full shadow-md text-[11px] font-semibold text-slate-700 transition-all">
              <Split className="w-3.5 h-3.5 text-indigo-600" />
              <span>
                Hết Trang {b.pageNumber} • Chuẩn Khổ A4
              </span>
              {b.isManual && (
                <button
                  onClick={() => onRemovePageBreak(b.y)}
                  className="ml-1 p-0.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                  title="Xóa ngắt trang này"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}

      {/* Bottom Infinite Expansion Bar */}
      <div
        className="absolute left-0 right-0 pointer-events-auto flex items-center justify-center py-6"
        style={{ top: `${totalHeight - 40}px` }}
      >
        <button
          onClick={onExpandPageHeight}
          className="group flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-md hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-300/80 hover:border-indigo-600 rounded-full shadow-lg text-xs font-bold transition-all active:scale-95"
          title="Kéo dài không gian cuộn không giới hạn (+1 Trang A4)"
        >
          <ArrowDown className="w-4 h-4 text-indigo-600 group-hover:text-white animate-bounce" />
          <span>Cuộn không giới hạn: Thêm 1 trang A4 xuống dưới</span>
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
