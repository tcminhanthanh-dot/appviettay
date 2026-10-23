import React, { useState, useRef, useEffect } from 'react';
import { RulerConfig, SquareConfig, CompassConfig, Point, Stroke } from '../types/canvas';
import { RotateCw, Compass, Maximize2, Move, X } from 'lucide-react';

interface MathToolsOverlayProps {
  ruler: RulerConfig;
  setRuler: React.Dispatch<React.SetStateAction<RulerConfig>>;
  square: SquareConfig;
  setSquare: React.Dispatch<React.SetStateAction<SquareConfig>>;
  compass: CompassConfig;
  setCompass: React.Dispatch<React.SetStateAction<CompassConfig>>;
  onCommitArc: (stroke: Stroke) => void;
  activeColor: string;
  activeSize: number;
  activeLayerId: string;
}

export const MathToolsOverlay: React.FC<MathToolsOverlayProps> = ({
  ruler,
  setRuler,
  square,
  setSquare,
  compass,
  setCompass,
  onCommitArc,
  activeColor,
  activeSize,
  activeLayerId,
}) => {
  const [dragTool, setDragTool] = useState<'ruler-body' | 'ruler-rotate' | 'square-body' | 'square-rotate' | 'compass-needle' | 'compass-arm' | 'compass-sweep' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialAngle?: number; initialRadius?: number }>({ x: 0, y: 0 });
  const compassPointsRef = useRef<Point[]>([]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragTool) return;

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // 1. Ruler dragging
      if (dragTool === 'ruler-body') {
        setRuler(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        dragStartRef.current.x = e.clientX;
        dragStartRef.current.y = e.clientY;
      } else if (dragTool === 'ruler-rotate') {
        const center = { x: ruler.x, y: ruler.y };
        const angleRad = Math.atan2(e.clientY - center.y, e.clientX - center.x);
        let angleDeg = (angleRad * 180) / Math.PI;
        if (e.shiftKey) {
          // Snap to 15 deg
          angleDeg = Math.round(angleDeg / 15) * 15;
        }
        setRuler(prev => ({ ...prev, angle: angleDeg }));
      }

      // 2. Square dragging
      else if (dragTool === 'square-body') {
        setSquare(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        dragStartRef.current.x = e.clientX;
        dragStartRef.current.y = e.clientY;
      } else if (dragTool === 'square-rotate') {
        const center = { x: square.x, y: square.y };
        const angleRad = Math.atan2(e.clientY - center.y, e.clientX - center.x);
        let angleDeg = (angleRad * 180) / Math.PI;
        if (e.shiftKey) {
          angleDeg = Math.round(angleDeg / 15) * 15;
        }
        setSquare(prev => ({ ...prev, angle: angleDeg }));
      }

      // 3. Compass dragging
      else if (dragTool === 'compass-needle') {
        setCompass(prev => ({
          ...prev,
          anchorX: prev.anchorX + dx,
          anchorY: prev.anchorY + dy,
        }));
        dragStartRef.current.x = e.clientX;
        dragStartRef.current.y = e.clientY;
      } else if (dragTool === 'compass-arm') {
        // Adjust radius by dragging pencil arm
        const currentDist = Math.hypot(e.clientX - compass.anchorX, e.clientY - compass.anchorY);
        setCompass(prev => ({
          ...prev,
          radius: Math.max(30, Math.min(450, currentDist)),
        }));
      } else if (dragTool === 'compass-sweep') {
        // Rotating compass arm to draw circular arc
        const angleRad = Math.atan2(e.clientY - compass.anchorY, e.clientX - compass.anchorX);
        let angleDeg = (angleRad * 180) / Math.PI;
        if (angleDeg < 0) angleDeg += 360;

        setCompass(prev => {
          const sweepDiff = Math.abs(angleDeg - prev.angle);
          return {
            ...prev,
            angle: angleDeg,
            sweepAngle: sweepDiff,
            isDrawing: true,
          };
        });

        // Add point to circular arc
        const ptX = compass.anchorX + Math.cos((angleDeg * Math.PI) / 180) * compass.radius;
        const ptY = compass.anchorY + Math.sin((angleDeg * Math.PI) / 180) * compass.radius;
        compassPointsRef.current.push({ x: ptX, y: ptY, pressure: 0.8 });
      }
    };

    const handlePointerUp = () => {
      if (dragTool === 'compass-sweep' && compassPointsRef.current.length > 2) {
        // Commit drawn arc to canvas
        onCommitArc({
          id: 'compass-' + Date.now(),
          penType: 'fountain',
          color: activeColor,
          size: activeSize,
          points: [...compassPointsRef.current],
          layerId: activeLayerId,
          timestamp: Date.now(),
        });
        compassPointsRef.current = [];
        setCompass(prev => ({ ...prev, isDrawing: false, sweepAngle: 0 }));
      }
      setDragTool(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragTool, ruler, square, compass, activeColor, activeSize, activeLayerId]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-20">
      {/* 1. THƯỚC KẺ THẲNG (PHYSICAL INTERACTIVE RULER) */}
      {ruler.visible && (
        <div
          className="absolute pointer-events-auto shadow-2xl transition-shadow border border-amber-300/40 rounded-sm cursor-grab active:cursor-grabbing backdrop-blur-md"
          style={{
            left: `${ruler.x}px`,
            top: `${ruler.y}px`,
            width: `${ruler.length}px`,
            height: '70px',
            transformOrigin: '0 0',
            transform: `rotate(${ruler.angle}deg)`,
            background: 'linear-gradient(180deg, rgba(254, 243, 199, 0.88) 0%, rgba(253, 230, 138, 0.75) 100%)',
          }}
          onPointerDown={(e) => {
            // Check if clicking close or rotate
            if ((e.target as HTMLElement).closest('.tool-action')) return;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            setDragTool('ruler-body');
          }}
        >
          {/* Top ruler edge markings (Centimeters & Millimeters) */}
          <div className="w-full h-8 relative flex border-b border-amber-400/50">
            {Array.from({ length: Math.floor(ruler.length / 20) + 1 }).map((_, i) => {
              const cm = i * 0.5;
              const isCm = i % 2 === 0;
              return (
                <div
                  key={i}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${i * 20}px` }}
                >
                  <div
                    className={`w-px ${isCm ? 'h-3.5 bg-slate-800' : 'h-2 bg-slate-600'}`}
                  />
                  {isCm && (
                    <span className="text-[10px] font-mono font-bold text-slate-800 -translate-x-1/2 pt-0.5">
                      {cm}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Ruler info & controls */}
          <div className="flex items-center justify-between px-3 pt-1 text-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="bg-amber-200/90 text-amber-900 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                {Math.round(ruler.angle % 360)}°
              </span>
              <span className="text-[11px] text-slate-700">Thước Kẻ 20cm</span>
            </div>

            <div className="flex items-center gap-2 tool-action">
              {/* Rotate Knob */}
              <div
                className="w-6 h-6 rounded-full bg-amber-400 hover:bg-amber-500 text-amber-950 flex items-center justify-center cursor-ew-resize shadow-sm hover:scale-110 active:scale-95 transition-transform"
                title="Kéo xoay thước (Giữ Shift để snap 15°)"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragTool('ruler-rotate');
                }}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </div>

              {/* Close Button */}
              <button
                className="w-5 h-5 rounded hover:bg-red-400/30 text-slate-700 flex items-center justify-center transition-colors"
                onClick={() => setRuler(prev => ({ ...prev, visible: false }))}
                title="Ẩn thước"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Snapping indicator badge */}
          <div className="absolute -top-6 left-2 bg-slate-900/90 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded shadow">
            Hít nét vẽ theo cạnh thẳng (Snapping)
          </div>
        </div>
      )}

      {/* 2. Ê-KE VUÔNG (PHYSICAL SET SQUARE) */}
      {square.visible && (
        <div
          className="absolute pointer-events-auto shadow-2xl transition-shadow cursor-grab active:cursor-grabbing backdrop-blur-md"
          style={{
            left: `${square.x}px`,
            top: `${square.y}px`,
            width: `${square.size}px`,
            height: `${square.size}px`,
            transformOrigin: '0 0',
            transform: `rotate(${square.angle}deg)`,
          }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest('.tool-action')) return;
            dragStartRef.current = { x: e.clientX, y: e.clientY };
            setDragTool('square-body');
          }}
        >
          {/* Triangular SVG body */}
          <svg
            className="w-full h-full drop-shadow-md"
            viewBox={`0 0 ${square.size} ${square.size}`}
          >
            {/* Triangular filled polygon with slight transparency */}
            <polygon
              points={`0,0 ${square.size},0 0,${square.size}`}
              fill="rgba(224, 242, 254, 0.78)"
              stroke="rgba(56, 189, 248, 0.8)"
              strokeWidth="2"
            />
            {/* Center cutout */}
            <polygon
              points={`35,35 ${square.size - 70},35 35,${square.size - 70}`}
              fill="rgba(255, 255, 255, 0.4)"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="1.5"
            />
            {/* Right angle symbol at (0,0) */}
            <rect
              x="2"
              y="2"
              width="22"
              height="22"
              fill="none"
              stroke="#0284c7"
              strokeWidth="1.5"
            />
            <circle cx="13" cy="13" r="2.5" fill="#0284c7" />

            {/* Angle labels */}
            <text x="30" y="24" fontSize="12" fontWeight="bold" fill="#0369a1" fontFamily="monospace">
              90°
            </text>
            <text x={square.size - 50} y="22" fontSize="11" fontWeight="bold" fill="#0369a1" fontFamily="monospace">
              45°
            </text>
            <text x="10" y={square.size - 30} fontSize="11" fontWeight="bold" fill="#0369a1" fontFamily="monospace">
              45°
            </text>
          </svg>

          {/* Action buttons inside center cutout */}
          <div
            className="absolute top-12 left-12 flex flex-col gap-1.5 tool-action bg-white/80 p-2 rounded-lg border border-sky-200 shadow-sm"
          >
            <span className="text-[11px] font-bold text-sky-900">Ê-ke 45°-90°</span>
            <div className="flex items-center gap-1.5">
              <span className="bg-sky-100 text-sky-800 text-[10px] font-mono px-1.5 py-0.5 rounded font-bold">
                {Math.round(square.angle % 360)}°
              </span>
              <button
                className="w-6 h-6 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center cursor-ew-resize shadow-sm transition-transform active:scale-95"
                title="Xoay Ê-ke"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setDragTool('square-rotate');
                }}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                className="w-5 h-5 rounded hover:bg-red-100 text-slate-600 flex items-center justify-center"
                onClick={() => setSquare(prev => ({ ...prev, visible: false }))}
                title="Ẩn Ê-ke"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPA TƯƠNG TÁC VẬT LÝ (PHYSICAL INTERACTIVE COMPASS) */}
      {compass.visible && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: `${compass.anchorX}px`,
            top: `${compass.anchorY}px`,
          }}
        >
          {/* Compass center needle point (Anchor) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-500/80 border-2 border-white shadow-lg flex items-center justify-center cursor-move tool-action hover:scale-110 active:scale-95 transition-transform"
            title="Kéo tâm kim Compa"
            onPointerDown={(e) => {
              e.stopPropagation();
              dragStartRef.current = { x: e.clientX, y: e.clientY };
              setDragTool('compass-needle');
            }}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>

          {/* Compass radius circle preview */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-rose-400/40 pointer-events-none"
            style={{
              width: `${compass.radius * 2}px`,
              height: `${compass.radius * 2}px`,
            }}
          />

          {/* Compass Arm Line connecting anchor to pencil */}
          <div
            className="absolute top-0 left-0 h-1 bg-gradient-to-r from-rose-500 to-indigo-600 rounded origin-left"
            style={{
              width: `${compass.radius}px`,
              transform: `rotate(${compass.angle}deg)`,
            }}
          />

          {/* Pencil tip at the end of the compass arm */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer tool-action select-none"
            style={{
              left: `${Math.cos((compass.angle * Math.PI) / 180) * compass.radius}px`,
              top: `${Math.sin((compass.angle * Math.PI) / 180) * compass.radius}px`,
            }}
          >
            {/* Draw Handle (Rotate arm to draw arc) */}
            <div
              className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl border-2 border-white flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95 transition-transform"
              title="Kéo xoay để vẽ cung tròn / hình tròn"
              onPointerDown={(e) => {
                e.stopPropagation();
                compassPointsRef.current = [];
                setDragTool('compass-sweep');
              }}
            >
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>

            {/* Radius adjustment handle */}
            <div
              className="mt-1 flex items-center gap-1 bg-slate-900/90 text-white px-2 py-0.5 rounded text-[10px] font-mono shadow-md"
              title="Kéo để đổi bán kính R"
              onPointerDown={(e) => {
                e.stopPropagation();
                setDragTool('compass-arm');
              }}
            >
              <Maximize2 className="w-3 h-3 text-indigo-300" />
              <span>R = {(compass.radius / 37.8).toFixed(1)} cm</span>
            </div>
          </div>

          {/* Floating HUD info for Compass */}
          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-slate-200 shadow-xl flex items-center gap-3 tool-action">
            <div className="text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>Compa Vẽ Hình Tròn</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Bán kính: {(compass.radius / 37.8).toFixed(1)} cm | Góc: {Math.round(compass.angle)}°
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Quick Preset Radii */}
              <button
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded"
                onClick={() => setCompass(prev => ({ ...prev, radius: 113 }))}
                title="Bán kính 3cm"
              >
                3 cm
              </button>
              <button
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded"
                onClick={() => setCompass(prev => ({ ...prev, radius: 189 }))}
                title="Bán kính 5cm"
              >
                5 cm
              </button>
              <button
                className="w-6 h-6 rounded hover:bg-red-100 text-slate-600 flex items-center justify-center"
                onClick={() => setCompass(prev => ({ ...prev, visible: false }))}
                title="Ẩn Compa"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
