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
                  width: Math.max(80, img.width + dx),
                  height: Math.max(80, img.height + dy),
                }
              : img
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
  }, [activeDragId, activeResizeId]);

  return (
    <div className="absolute inset-0 pointer-events-none z-15 overflow-visible">
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
      {images.map(img => (
        <div
          key={img.id}
          className="absolute pointer-events-auto group border border-transparent hover:border-indigo-400 rounded-xl transition-shadow hover:shadow-xl bg-white/20 select-none"
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

          {/* Controls Bar on Hover */}
          <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded-lg text-white text-[10px] py-0.5">
            <span
              onPointerDown={e => {
                e.stopPropagation();
                dragStartRef.current = { x: e.clientX, y: e.clientY };
                setActiveDragId(img.id);
              }}
              className="flex items-center gap-1 cursor-grab active:cursor-grabbing font-semibold"
            >
              <Move className="w-3 h-3" />
              <span>Di chuyển</span>
            </span>

            <button
              onClick={() => setImages(prev => prev.filter(i => i.id !== img.id))}
              className="p-0.5 text-rose-400 hover:text-rose-200"
              title="Xóa ảnh này"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>

          {/* Resize Corner Handle */}
          <div
            onPointerDown={e => {
              e.stopPropagation();
              dragStartRef.current = { x: e.clientX, y: e.clientY };
              setActiveResizeId(img.id);
            }}
            className="absolute -bottom-2 -right-2 w-5 h-5 bg-indigo-600 border-2 border-white rounded-full cursor-se-resize flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            title="Kéo để thay đổi kích thước ảnh"
          >
            <Maximize2 className="w-2.5 h-2.5 text-white" />
          </div>
        </div>
      ))}

      {/* 3. Canvas Text Items */}
      {texts.map(t => {
        const isEditing = editingTextId === t.id;
        return (
          <div
            key={t.id}
            className="absolute pointer-events-auto group border border-transparent hover:border-indigo-400 rounded-lg p-1 transition-all bg-white/70 backdrop-blur-xs select-none"
            style={{
              left: `${t.x}px`,
              top: `${t.y}px`,
              maxWidth: '450px',
            }}
          >
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={textValue}
                  onChange={e => setTextValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setTexts(prev =>
                        prev.map(item =>
                          item.id === t.id ? { ...item, text: textValue } : item
                        )
                      );
                      setEditingTextId(null);
                    }
                  }}
                  autoFocus
                  className="px-2 py-1 text-xs border border-indigo-400 rounded bg-white"
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
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onDoubleClick={() => {
                  setEditingTextId(t.id);
                  setTextValue(t.text);
                }}
                className="whitespace-pre-wrap font-sans font-medium"
                style={{
                  fontSize: `${t.fontSize || 14}px`,
                  color: t.color || '#1e293b',
                }}
              >
                {t.text}
              </div>
            )}

            {/* Hover actions */}
            <div className="absolute -top-6 left-0 right-0 flex items-center justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 rounded text-white text-[9px] py-0.5">
              <span
                onPointerDown={e => {
                  e.stopPropagation();
                  dragStartRef.current = { x: e.clientX, y: e.clientY };
                  setActiveDragId(t.id);
                }}
                className="cursor-grab active:cursor-grabbing flex items-center gap-1"
              >
                <Move className="w-2.5 h-2.5" />
                <span>Kéo</span>
              </span>

              <button
                onClick={() => setTexts(prev => prev.filter(item => item.id !== t.id))}
                className="text-rose-400 hover:text-rose-200"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        );
      })}

      {/* 4. Math Plots & 3D Shapes */}
      {plots.map(p => (
        <div
          key={p.id}
          className="absolute pointer-events-auto group border border-transparent hover:border-indigo-400 rounded-2xl shadow-md transition-all select-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.width}px`,
            height: `${p.height}px`,
          }}
        >
          <canvas
            ref={el => {
              if (el) plotCanvasesRef.current.set(p.id, el);
              else plotCanvasesRef.current.delete(p.id);
            }}
            width={p.width}
            height={p.height}
            className="w-full h-full rounded-2xl"
          />

          {/* Action bar */}
          <div className="absolute -top-7 left-0 right-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/85 rounded-lg text-white text-[10px] py-1">
            <span
              onPointerDown={e => {
                e.stopPropagation();
                dragStartRef.current = { x: e.clientX, y: e.clientY };
                setActiveDragId(p.id);
              }}
              className="flex items-center gap-1 cursor-grab active:cursor-grabbing font-bold text-indigo-200"
            >
              <Move className="w-3 h-3" />
              <span>{p.title || (p.type === 'function' ? `Đồ thị y = ${p.expression}` : 'Khối 3D')}</span>
            </span>

            <button
              onClick={() => setPlots(prev => prev.filter(item => item.id !== p.id))}
              className="text-rose-400 hover:text-rose-200 p-0.5"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
