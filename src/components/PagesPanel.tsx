import React, { useState } from 'react';
import { CanvasPage, BackgroundType, ViewMode } from '../types/canvas';
import {
  BookOpen,
  Plus,
  Trash2,
  Copy,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  Edit2,
  Check,
  Split,
  Eye,
  EyeOff,
  Scroll,
  Layers,
  ArrowDown
} from 'lucide-react';

interface PagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pages: CanvasPage[];
  setPages: React.Dispatch<React.SetStateAction<CanvasPage[]>>;
  currentPageId: string;
  setCurrentPageId: (id: string) => void;
  showPageBreaks: boolean;
  setShowPageBreaks: (val: boolean) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  canvasWidth: number;
  onAddPageBreakAtScroll: () => void;
  onExpandPageHeight: () => void;
}

export const PagesPanel: React.FC<PagesPanelProps> = ({
  isOpen,
  onClose,
  pages,
  setPages,
  currentPageId,
  setCurrentPageId,
  showPageBreaks,
  setShowPageBreaks,
  viewMode,
  setViewMode,
  canvasWidth,
  onAddPageBreakAtScroll,
  onExpandPageHeight,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (!isOpen) return null;

  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];

  // Add a new page
  const handleAddNewPage = () => {
    const newPageNumber = pages.length + 1;
    const standardA4Height = Math.round(canvasWidth * 1.4142);
    const newPage: CanvasPage = {
      id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: `Trang ${newPageNumber}`,
      strokes: [],
      history: [],
      redoStack: [],
      pageHeight: standardA4Height,
      pageBreaks: [],
      createdAt: Date.now(),
    };
    setPages(prev => [...prev, newPage]);
    setCurrentPageId(newPage.id);
  };

  // Duplicate current page
  const handleDuplicatePage = (pageToDup: CanvasPage, e: React.MouseEvent) => {
    e.stopPropagation();
    const clonedStrokes = JSON.parse(JSON.stringify(pageToDup.strokes));
    const newPage: CanvasPage = {
      id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: `${pageToDup.title} (Bản sao)`,
      strokes: clonedStrokes,
      history: [],
      redoStack: [],
      pageHeight: pageToDup.pageHeight,
      pageBreaks: [...(pageToDup.pageBreaks || [])],
      background: pageToDup.background,
      createdAt: Date.now(),
    };
    const index = pages.findIndex(p => p.id === pageToDup.id);
    const updated = [...pages];
    updated.splice(index + 1, 0, newPage);
    setPages(updated);
    setCurrentPageId(newPage.id);
  };

  // Delete page
  const handleDeletePage = (pageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) {
      alert('Tài liệu phải có ít nhất 1 trang.');
      return;
    }
    const target = pages.find(p => p.id === pageId);
    const hasStrokes = target && target.strokes.length > 0;
    if (hasStrokes) {
      if (!confirm(`Trang "${target.title}" có chứa ${target.strokes.length} nét vẽ. Bạn có chắc chắn muốn xóa?`)) {
        return;
      }
    }

    const filtered = pages.filter(p => p.id !== pageId);
    setPages(filtered);

    if (currentPageId === pageId) {
      setCurrentPageId(filtered[0].id);
    }
  };

  // Start renaming
  const handleStartRename = (page: CanvasPage, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(page.id);
    setEditTitle(page.title);
  };

  // Save renamed title
  const handleSaveRename = (pageId: string) => {
    if (editTitle.trim()) {
      setPages(prev =>
        prev.map(p => (p.id === pageId ? { ...p, title: editTitle.trim() } : p))
      );
    }
    setEditingId(null);
  };

  // Move page up or down
  const handleMovePage = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setPages(newPages);
  };

  const standardA4Height = Math.round(canvasWidth * 1.4142);
  const a4PageEquivalent = ((currentPage?.pageHeight || standardA4Height) / standardA4Height).toFixed(1);

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-white/95 backdrop-blur-xl border-r border-slate-200/90 shadow-2xl z-40 flex flex-col text-xs text-slate-700 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">Quản Lý Trang OneNote</h2>
            <p className="text-[10px] text-slate-500">Phân trang & Cuộn vô hạn</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* View Mode & Page Break Settings */}
      <div className="p-3 border-b border-slate-200 bg-indigo-50/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5">
            <Scroll className="w-3.5 h-3.5 text-indigo-600" />
            Chế độ hiển thị:
          </span>
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-medium">
            <button
              onClick={() => setViewMode('infinite')}
              className={`px-2 py-1 rounded-md transition-all ${
                viewMode === 'infinite'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cuộn vô hạn
            </button>
            <button
              onClick={() => setViewMode('paginated')}
              className={`px-2 py-1 rounded-md transition-all ${
                viewMode === 'paginated'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trang rời
            </button>
          </div>
        </div>

        {/* Toggle OneNote Page Breaks */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          <span className="text-slate-700 flex items-center gap-1.5">
            <Split className="w-3.5 h-3.5 text-amber-600" />
            Vạch chia trang OneNote:
          </span>
          <button
            onClick={() => setShowPageBreaks(!showPageBreaks)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg font-medium transition-colors ${
              showPageBreaks
                ? 'bg-indigo-600 text-white font-bold'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {showPageBreaks ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            <span>{showPageBreaks ? 'Đang hiện' : 'Đang ẩn'}</span>
          </button>
        </div>

        {/* Quick actions for current page */}
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={onExpandPageHeight}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 flex items-center justify-center gap-1 transition-all"
            title="Tăng chiều cao cuộn thêm 1 khổ A4 xuống dưới"
          >
            <ArrowDown className="w-3 h-3 text-indigo-600" />
            <span>Mở rộng trang (+A4)</span>
          </button>
          <button
            onClick={onAddPageBreakAtScroll}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-700 flex items-center justify-center gap-1 transition-all"
            title="Chèn vạch chia trang OneNote tại vị trí đang xem"
          >
            <Split className="w-3 h-3 text-amber-600" />
            <span>Chèn ngắt trang</span>
          </button>
        </div>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Danh sách trang ({pages.length})
          </span>
          <span className="text-[10px] text-slate-400">
            Khổ ~ {a4PageEquivalent} A4
          </span>
        </div>

        {pages.map((page, index) => {
          const isActive = page.id === currentPageId;
          const isEditing = editingId === page.id;
          const strokeCount = page.strokes.length;

          return (
            <div
              key={page.id}
              onClick={() => {
                if (!isEditing) setCurrentPageId(page.id);
              }}
              className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-medium shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Number & Title */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </span>

                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveRename(page.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full px-1.5 py-0.5 border border-indigo-400 rounded bg-white text-xs text-slate-900 focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(page.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-semibold text-xs block">
                          {page.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        {strokeCount} nét vẽ • {Math.round(page.pageHeight / standardA4Height * 10) / 10} trang A4
                      </span>
                    </div>
                  )}
                </div>

                {/* Page actions (visible on hover or when active) */}
                {!isEditing && (
                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => handleStartRename(page, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                      title="Đổi tên trang"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => handleDuplicatePage(page, e)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                      title="Nhân bản trang này"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={e => handleDeletePage(page.id, e)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Xóa trang"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom: Add Page Button */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70">
        <button
          onClick={handleAddNewPage}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Trang Mới</span>
        </button>
      </div>
    </div>
  );
};
