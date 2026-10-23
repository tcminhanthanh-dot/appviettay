import React, { useRef, useState, useEffect } from 'react';
import {
  CanvasImageItem,
  CanvasTextItem,
  MathPlotItem,
  LaserPoint,
} from '../types/canvas';
import { drawOxyPlane, drawFunctionGraph } from '../utils/mathGrapher';
import { drawShape3D } from '../utils/geometry3D';
import { Trash2, Move, Maximize2, Edit3, X, Check } from 'lucide-react';

interface BoardElementsOverlayProps {
  images: CanvasImageItem[];
  setImages: React.Dispatch<React.SetStateAction<CanvasImageItem[]>>;
  texts: CanvasTextItem[];
  setTexts: React.Dispatch<React.SetStateAction<CanvasTextItem[]>>;
  plots: MathPlotItem[];
  setPlots: React.Dispatch<React.SetStateAction<MathPlotItem[]>>;
  laserPoints: LaserPoint[];
}

export const BoardElementsOverlay: React.FC<BoardElementsOverlayProps> = ({
  images,
  setImages,
  texts,
  setTexts,
  plots,
  setPlots,
  laserPoints,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeResizeId, setActiveResizeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');

  // Plot canvases refs map
  const plotCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Render plots whenever plot data updates
  useEffect(() => {
    for (const plot of plots) {
      const canvas = plotCanvasesRef.current.get(plot.id);
      if (!canvas) continue;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.clearRect(0, 0, plot.width, plot.height);

      if (plot.type === 'function' && plot.expression) {
        drawOxyPlane(ctx, { x: 0, y: 0, width: plot.width, height: plot.height });
        drawFunctionGraph(
          ctx,
          plot.expression,
          { x: 0, y: 0, width: plot.width, height: plot.height },
          plot.color || '#2563eb'
        );
      } else if (plot.type === 'shape3d' && plot.shape3DType) {
        drawShape3D(ctx, {
          type: plot.shape3DType,
          x: 0,
          y: 0,
          width: plot.width,
          height: plot.height,
        });
      }
    }
  }, [plots]);

  // Handle Dragging & Resizing
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeDragId && !activeResizeId) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (activeDragId) {
        // Drag image
        setImages(prev =>
          prev.map(img =>
            img.id === activeDragId
              ? { ...img, x: img.x + dx, y: img.y + dy }
              : img
          )
        );
        // Drag text
        setTexts(prev =>
          prev.map(t =>
            t.id === activeDragId
              ? { ...t, x: t.x + dx, y: t.y + dy }
              : t
          )
        );
        // Drag plot
        setPlots(prev =>
          prev.map(p =>
            p.id === activeDragId
              ? { ...p, x: p.x + dx, y: p.y + dy }
              : p
          )
        );
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      } else if (activeResizeId) {
        // Resize image
        setImages(prev =>
          prev.map(img =>
            img.id === activeResizeId
              ? {
                  ...img,
                  width: Math.max(100, img.width + dx),
                  height: Math.max(80, img.height + dy),
                }
              : img
          )
        );
        // Resize plot
        setPlots(prev =>
          prev.map(plot =>
            plot.id === activeResizeId
              ? {
                  ...plot,
                  width: Math.max(160, plot.width + dx),
                  height: Math.max(120, plot.height + dy),
                }
              : plot
          )
        );
        dragStartRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerUp = () => {
      setActiveDragId(null);
      setActiveResizeId(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDragId, activeResizeId, setImages, setTexts, setPlots]);

  // Keyboard shortcut to delete selected item (Delete or Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        setPlots(prev => prev.filter(p => p.id !== selectedId));
        setImages(prev => prev.filter(img => img.id !== selectedId));
        setTexts(prev => prev.filter(t => t.id !== selectedId));
        setSelectedId(null);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, setPlots, setImages, setTexts]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-15 overflow-visible"
      onPointerDown={() => setSelectedId(null)}
    >
      {/* 1. Laser Pointer Trail */}
      {laserPoints.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polyline
            points={laserPoints.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#ff0055"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: 'drop-shadow(0 0 8px #ff0055)',
              opacity: 0.85,
            }}
          />
        </svg>
      )}

      {/* 2. Canvas Images */}
      {images.map(img => {
        const isSelected = selectedId === img.id;
        return (
          <div
            key={img.id}
            onClick={e => {
              e.stopPropagation();
              setSelectedId(img.id);
            }}
            className={`absolute pointer-events-auto group rounded-xl transition-shadow select-none ${
              isSelected
                ? 'ring-2 ring-indigo-500 shadow-2xl bg-white/10'
                : 'border border-transparent hover:border-indigo-400 bg-white/20'
            }`}
            style={{
              left: `${img.x}px`,
              top: `${img.y}px`,
              width: `${img.width}px`,
              height: `${img.height}px`,
            }}
          >
            <img
              src={img.src}
              alt="Đề bài / Ảnh minh họa"
              className="w-full h-full object-contain rounded-lg pointer-events-none"
            />

            {/* Quick Delete Badge (Always visible at top-right corner) */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setImages(prev => prev.filter(i => i.id !== img.id));
                if (selectedId === img.id) setSelectedId(null);
              }}
              className="absolute -top-3.5 -right-3.5 z-30 w-7 h-7 bg-rose-600 hover:bg-rose-700 active:scale-90 text-white rounded-full shadow-xl border-2 border-white flex items-center justify-center cursor-pointer transition-transform"
              title="Xóa hình ảnh này"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Controls Bar on Hover / Selection */}
            <div
              className={`absolute -top-8 left-0 right-8 flex items-center justify-between px-2 py-0.5 bg-slate-900/90 backdrop-blur-md rounded-lg text-white text-[10px] transition-opacity z-20 ${
                isSelected
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <span
                onPointerDown={e => {
                  e.stopPropagation();
                  dragStartRef.current = { x: e.clientX, y: e.clientY };
                  setActiveDragId(img.id);
                  setSelectedId(img.id);
                }}
                className="flex items-center gap-1 cursor-grab active:cursor-grabbing font-semibold text-indigo-200"
              >
                <Move className="w-3 h-3" />
                <span>Kéo ảnh</span>
              </span>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setImages(prev => prev.filter(i => i.id !== img.id));
                  if (selectedId === img.id) setSelectedId(null);
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded"
                title="Xóa ảnh này"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            </div>

            {/* Resize Corner Handle */}
            <div
              onPointerDown={e => {
                e.stopPropagation();
                dragStartRef.current = { x: e.clientX, y: e.clientY };
                setActiveResizeId(img.id);
                setSelectedId(img.id);
              }}
              className={`absolute -bottom-3 -right-3 w-6 h-6 bg-indigo-600 hover:bg-indigo-700 border-2 border-white rounded-full cursor-se-resize flex items-center justify-center shadow-lg transition-all z-20 ${
                isSelected ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Kéo góc để thay đổi kích thước ảnh"
            >
              <Maximize2 className="w-3 h-3 text-white" />
            </div>
          </div>
        );
      })}

      {/* 3. Canvas Text Items */}
      {texts.map(t => {
        const isEditing = editingTextId === t.id;
        const isSelected = selectedId === t.id;
        return (
          <div
            key={t.id}
            onClick={e => {
              e.stopPropagation();
              setSelectedId(t.id);
            }}
            className={`absolute pointer-events-auto group rounded-xl p-2 transition-all bg-white/90 backdrop-blur-md select-none shadow-md ${
              isSelected
                ? 'ring-2 ring-indigo-500 shadow-2xl'
                : 'border border-transparent hover:border-indigo-400'
            }`}
            style={{
              left: `${t.x}px`,
              top: `${t.y}px`,
              maxWidth: '500px',
            }}
          >
            {/* Quick Delete Badge */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setTexts(prev => prev.filter(item => item.id !== t.id));
                if (selectedId === t.id) setSelectedId(null);
              }}
              className="absolute -top-3 -right-3 z-30 w-6 h-6 bg-rose-600 hover:bg-rose-700 active:scale-90 text-white rounded-full shadow-lg border-2 border-white flex items-center justify-center cursor-pointer transition-transform"
              title="Xóa hộp văn bản"
            >
              <X className="w-3.5 h-3.5 stroke-[3]" />
            </button>

            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <textarea
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  autoFocus
                  rows={3}
                  className="px-2 py-1 text-xs border border-indigo-400 rounded-lg bg-white w-64 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setTexts(prev =>
                      prev.map(item =>
                        item.id === t.id ? { ...item, text: textValue } : item
                      )
                    );
                    setEditingTextId(null);
                  }}
                  className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg shadow-sm"
                  title="Xong"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDoubleClick={() => {
                  setEditingTextId(t.id);
                  setTextValue(t.text);
                }}
                className="whitespace-pre-wrap font-sans font-medium cursor-text pr-3"
                style={{
                  fontSize: `${t.fontSize || 14}px`,
                  color: t.color || '#1e293b',
                }}
                title="Nhấp đúp chuột để chỉnh sửa văn bản"
              >
                {t.text}
              </div>
            )}

            {/* Hover actions */}
            <div
              className={`absolute -top-7 left-0 right-6 flex items-center justify-between px-2 py-0.5 bg-slate-900/90 rounded-lg text-white text-[10px] z-20 ${
                isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <span
                onPointerDown={e => {
                  e.stopPropagation();
                  dragStartRef.current = { x: e.clientX, y: e.clientY };
                  setActiveDragId(t.id);
                  setSelectedId(t.id);
                }}
                className="cursor-grab active:cursor-grabbing flex items-center gap-1 text-indigo-200"
              >
                <Move className="w-3 h-3" />
                <span>Di chuyển</span>
              </span>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setTexts(prev => prev.filter(item => item.id !== t.id));
                  if (selectedId === t.id) setSelectedId(null);
                }}
                className="text-rose-400 hover:text-rose-200 font-bold flex items-center gap-0.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* 4. Math Plots & 3D Shapes */}
      {plots.map(p => {
        const isSelected = selectedId === p.id;
        return (
          <div
            key={p.id}
            onClick={e => {
              e.stopPropagation();
              setSelectedId(p.id);
            }}
            className={`absolute pointer-events-auto group rounded-2xl shadow-xl transition-all select-none bg-white/95 ${
              isSelected
                ? 'ring-3 ring-indigo-500 shadow-2xl'
                : 'border-2 border-slate-300 hover:border-indigo-400'
            }`}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.width}px`,
              height: `${p.height}px`,
            }}
          >
            {/* Quick Delete Badge Button (LỚN, ĐỎ, NỔI BẬT Ở GÓC TRÊN BÊN PHẢI) */}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setPlots(prev => prev.filter(item => item.id !== p.id));
                if (selectedId === p.id) setSelectedId(null);
              }}
              className="absolute -top-3.5 -right-3.5 z-40 w-8 h-8 bg-rose-600 hover:bg-rose-700 active:scale-90 text-white rounded-full shadow-2xl border-2 border-white flex items-center justify-center cursor-pointer transition-all hover:scale-110"
              title="Xóa đồ thị này"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Main Canvas rendering Oxy or 3D Shape */}
            <canvas
              ref={el => {
                if (el) plotCanvasesRef.current.set(p.id, el);
                else plotCanvasesRef.current.delete(p.id);
              }}
              width={p.width}
              height={p.height}
              className="w-full h-full rounded-2xl block"
            />

            {/* Top Action & Delete Bar */}
            <div
              className={`absolute -top-9 left-0 right-8 flex items-center justify-between px-2.5 py-1 bg-slate-900/90 backdrop-blur-md rounded-xl text-white text-[11px] shadow-xl z-30 transition-opacity ${
                isSelected ? 'opacity-100 ring-1 ring-white/20' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <span
                onPointerDown={e => {
                  e.stopPropagation();
                  dragStartRef.current = { x: e.clientX, y: e.clientY };
                  setActiveDragId(p.id);
                  setSelectedId(p.id);
                }}
                className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing font-bold text-sky-300 select-none truncate max-w-[200px]"
                title="Kéo giữ để di chuyển đồ thị"
              >
                <Move className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {p.title || (p.type === 'function' ? `y = ${p.expression}` : 'Khối 3D')}
                </span>
              </span>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setPlots(prev => prev.filter(item => item.id !== p.id));
                  if (selectedId === p.id) setSelectedId(null);
                }}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-lg transition-all shadow-sm shrink-0"
                title="Xóa đồ thị khỏi bảng"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa đồ thị</span>
              </button>
            </div>

            {/* Resize Corner Handle (Góc dưới bên phải) */}
            <div
              onPointerDown={e => {
                e.stopPropagation();
                dragStartRef.current = { x: e.clientX, y: e.clientY };
                setActiveResizeId(p.id);
                setSelectedId(p.id);
              }}
              className={`absolute -bottom-3 -right-3 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 border-2 border-white rounded-full cursor-se-resize flex items-center justify-center shadow-lg transition-all z-30 ${
                isSelected ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Kéo góc để thu phóng kích thước đồ thị"
            >
              <Maximize2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
