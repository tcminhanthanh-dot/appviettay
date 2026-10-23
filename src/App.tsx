/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  PenType,
  BackgroundType,
  Point,
  Stroke,
  Layer,
  RulerConfig,
  SquareConfig,
  CompassConfig,
  CanvasPage,
  ViewMode,
  CanvasImageItem,
  CanvasTextItem,
  MathPlotItem,
  LaserPoint,
} from './types/canvas';
import { drawBackground } from './utils/backgroundRenderer';
import {
  drawStroke,
  smoothPoints,
  detectAutoShape,
  applyGoldenRatioRefinement,
} from './utils/strokeRenderer';
import { Toolbar } from './components/Toolbar';
import { MathToolsOverlay } from './components/MathToolsOverlay';
import { SpecialistPanel } from './components/SpecialistPanel';
import { LayersPanel } from './components/LayersPanel';
import { ExportModal } from './components/ExportModal';
import { PagesPanel } from './components/PagesPanel';
import { OneNotePageBreaks } from './components/OneNotePageBreaks';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ClassroomToolsModal } from './components/ClassroomToolsModal';
import { MathToolsDialog } from './components/MathToolsDialog';
import { LassoMathModal } from './components/LassoMathModal';
import { LessonShareModal } from './components/LessonShareModal';
import { BoardElementsOverlay } from './components/BoardElementsOverlay';
import { getStoredApiKey } from './utils/geminiClient';
import { Sparkles } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Canvas viewport dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: window.innerWidth || 1400,
    height: window.innerHeight || 900,
  });

  const standardA4Height = Math.round(canvasDimensions.width * 1.4142);

  // OneNote Pages State with LocalStorage Persistence
  const [pages, setPages] = useState<CanvasPage[]>(() => {
    try {
      const saved = localStorage.getItem('smart_vector_notebook_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
          return parsed.pages;
        }
      }
    } catch (e) {
      console.warn('Could not load saved notebook', e);
    }
    return [
      {
        id: 'page-1',
        title: 'Trang 1',
        strokes: [],
        history: [],
        redoStack: [],
        pageHeight: Math.round((window.innerWidth || 1400) * 1.4142),
        pageBreaks: [],
        createdAt: Date.now(),
      },
    ];
  });

  const [currentPageId, setCurrentPageId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('smart_vector_notebook_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activePageId) return parsed.activePageId;
      }
    } catch {}
    return 'page-1';
  });

  const [showPageBreaks, setShowPageBreaks] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('infinite');
  const [isPagesOpen, setIsPagesOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(() => !getStoredApiKey());

  // Educational Classroom & Math Modals State
  const [isClassroomToolsOpen, setIsClassroomToolsOpen] = useState(false);
  const [isMathToolsDialogOpen, setIsMathToolsDialogOpen] = useState(false);
  const [isLassoMathOpen, setIsLassoMathOpen] = useState(false);
  const [isLessonShareOpen, setIsLessonShareOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Laser Pointer State
  const [laserPoints, setLaserPoints] = useState<LaserPoint[]>([]);

  // State: Tools & Pen
  const [currentPen, setCurrentPen] = useState<PenType>('fountain');
  const [isEraser, setIsEraser] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('#1e293b');
  const [penSize, setPenSize] = useState<number>(4);
  const [stabilization, setStabilization] = useState<number>(0.4);
  const [autoShape, setAutoShape] = useState<boolean>(true);
  const [background, setBackground] = useState<BackgroundType>('oly');

  // Layers
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'layer-content', name: 'Lớp 1: Ghi chú & Chữ viết', visible: true, locked: false, opacity: 1 },
    { id: 'layer-math', name: 'Lớp 2: Hình học & Minh họa', visible: true, locked: false, opacity: 1 },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-content');

  // Current active page object
  const currentPage = pages.find(p => p.id === currentPageId) || pages[0];
  const currentTotalHeight = Math.max(currentPage?.pageHeight || standardA4Height, standardA4Height);

  // Active strokes and history
  const [strokes, setStrokes] = useState<Stroke[]>(() => currentPage?.strokes || []);
  const [history, setHistory] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  // Educational Elements on active page
  const [images, setImages] = useState<CanvasImageItem[]>(() => currentPage?.images || []);
  const [texts, setTexts] = useState<CanvasTextItem[]>(() => currentPage?.texts || []);
  const [plots, setPlots] = useState<MathPlotItem[]>(() => currentPage?.plots || []);

  // Drawing in progress
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const lastPointTimeRef = useRef<number>(0);
  const lastSpeedRef = useRef<number>(0);

  // Modals & Panels
  const [isSpecialistOpen, setIsSpecialistOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Physical Math Tools State
  const [ruler, setRuler] = useState<RulerConfig>({
    x: 200,
    y: 220,
    length: 420,
    angle: 0,
    visible: false,
  });

  const [square, setSquare] = useState<SquareConfig>({
    x: 350,
    y: 300,
    size: 260,
    angle: 0,
    visible: false,
  });

  const [compass, setCompass] = useState<CompassConfig>({
    anchorX: 600,
    anchorY: 380,
    radius: 120,
    angle: 0,
    sweepAngle: 0,
    visible: false,
    isDrawing: false,
  });

  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      setCanvasDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sync strokes to localStorage notebook
  useEffect(() => {
    try {
      const data = {
        pages,
        activePageId: currentPageId,
        background,
        showPageBreaks,
      };
      localStorage.setItem('smart_vector_notebook_v2', JSON.stringify(data));
    } catch (e) {
      // Ignore quota errors
    }
  }, [pages, currentPageId, background, showPageBreaks]);

  // Keep active page synced with latest images, texts, plots
  useEffect(() => {
    setPages(prev =>
      prev.map(p =>
        p.id === currentPageId
          ? { ...p, images, texts, plots }
          : p
      )
    );
  }, [images, texts, plots, currentPageId]);

  // Laser points auto-cleanup
  useEffect(() => {
    if (laserPoints.length === 0) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPoints(prev => prev.filter(p => now - p.time < 1600));
    }, 50);
    return () => clearInterval(interval);
  }, [laserPoints.length]);

  // Clipboard Image Paste (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = event => {
              const base64 = event.target?.result as string;
              if (base64) {
                const scrollY = scrollContainerRef.current?.scrollTop || 0;
                const newImg: CanvasImageItem = {
                  id: 'img-' + Date.now(),
                  src: base64,
                  x: Math.max(40, canvasDimensions.width * 0.2),
                  y: scrollY + 120,
                  width: 360,
                  height: 260,
                };
                setImages(prev => {
                  const updated = [...prev, newImg];
                  setPages(pagesPrev =>
                    pagesPrev.map(p =>
                      p.id === currentPageId ? { ...p, images: updated } : p
                    )
                  );
                  return updated;
                });
                showToast('✨ Đã dán ảnh từ clipboard vào bảng (Ctrl+V)');
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [canvasDimensions.width, currentPageId]);

  const handleUploadImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target?.result as string;
      if (src) {
        const scrollY = scrollContainerRef.current?.scrollTop || 0;
        const newImg: CanvasImageItem = {
          id: 'img-' + Date.now(),
          src,
          x: Math.max(40, canvasDimensions.width * 0.2),
          y: scrollY + 100,
          width: 360,
          height: 260,
        };
        setImages(prev => {
          const updated = [...prev, newImg];
          setPages(pagesPrev =>
            pagesPrev.map(p =>
              p.id === currentPageId ? { ...p, images: updated } : p
            )
          );
          return updated;
        });
        showToast('✨ Đã chèn ảnh lên bảng');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddTextBox = () => {
    const scrollY = scrollContainerRef.current?.scrollTop || 0;
    const newText: CanvasTextItem = {
      id: 'text-' + Date.now(),
      text: 'Nhấp đúp để chỉnh sửa văn bản...',
      x: Math.max(40, canvasDimensions.width * 0.25),
      y: scrollY + 140,
      fontSize: 16,
      color: penColor,
    };
    setTexts(prev => {
      const updated = [...prev, newText];
      setPages(pagesPrev =>
        pagesPrev.map(p =>
          p.id === currentPageId ? { ...p, texts: updated } : p
        )
      );
      return updated;
    });
    showToast('✨ Đã thêm hộp văn bản (Click đúp để sửa)');
  };

  const handleInsertPlot = (plot: MathPlotItem) => {
    setPlots(prev => {
      const updated = [...prev, plot];
      setPages(pagesPrev =>
        pagesPrev.map(p =>
          p.id === currentPageId ? { ...p, plots: updated } : p
        )
      );
      return updated;
    });
    showToast(`✨ Đã chèn ${plot.type === 'function' ? 'đồ thị hàm số Oxy' : 'khối hình 3D'} lên bảng`);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Redraw canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvasDimensions.width;
    const height = currentTotalHeight;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background
    const pageBg = currentPage?.background || background;
    drawBackground(ctx, width, height, pageBg);

    // 2. Render committed strokes by layer
    const layerMap = new Map(layers.map(l => [l.id, l]));

    for (const stroke of strokes) {
      const layer = layerMap.get(stroke.layerId);
      if (layer && !layer.visible) continue;
      const layerOpacity = layer ? layer.opacity : 1;
      drawStroke(ctx, stroke, layerOpacity);
    }

    // 3. Render active stroke in progress
    if (isDrawingRef.current && currentPointsRef.current.length > 0 && !isEraser) {
      const activeLayer = layerMap.get(activeLayerId);
      const activeOpacity = activeLayer ? activeLayer.opacity : 1;

      const tempStroke: Stroke = {
        id: 'active',
        penType: currentPen,
        color: penColor,
        size: penSize,
        points: currentPointsRef.current,
        layerId: activeLayerId,
        timestamp: Date.now(),
      };
      drawStroke(ctx, tempStroke, activeOpacity);
    }
  }, [canvasDimensions.width, currentTotalHeight, currentPage?.background, background, layers, strokes, isEraser, currentPen, penColor, penSize, activeLayerId]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Page switching logic
  const handleSelectPage = (targetId: string) => {
    if (targetId === currentPageId) return;

    // 1. Commit current strokes/images/texts/plots to current page
    setPages(prev =>
      prev.map(p =>
        p.id === currentPageId
          ? {
              ...p,
              strokes,
              images,
              texts,
              plots,
              history,
              redoStack,
              updatedAt: Date.now(),
            }
          : p
      )
    );

    // 2. Load target page
    const target = pages.find(p => p.id === targetId);
    if (target) {
      setStrokes(target.strokes || []);
      setImages(target.images || []);
      setTexts(target.texts || []);
      setPlots(target.plots || []);
      setHistory(target.history || []);
      setRedoStack(target.redoStack || []);
      setCurrentPageId(targetId);
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Đã chuyển sang ${target.title}`);
    }
  };

  const currentPageIndex = Math.max(0, pages.findIndex(p => p.id === currentPageId));

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      handleSelectPage(pages[currentPageIndex - 1].id);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      handleSelectPage(pages[currentPageIndex + 1].id);
    }
  };

  const handleAddNewPage = () => {
    const newPageNum = pages.length + 1;
    const newPage: CanvasPage = {
      id: 'page-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: `Trang ${newPageNum}`,
      strokes: [],
      images: [],
      texts: [],
      plots: [],
      history: [],
      redoStack: [],
      pageHeight: standardA4Height,
      pageBreaks: [],
      createdAt: Date.now(),
    };

    setPages(prev => [
      ...prev.map(p =>
        p.id === currentPageId
          ? {
              ...p,
              strokes,
              images,
              texts,
              plots,
              history,
              redoStack,
            }
          : p
      ),
      newPage,
    ]);

    setStrokes([]);
    setImages([]);
    setTexts([]);
    setPlots([]);
    setHistory([]);
    setRedoStack([]);
    setCurrentPageId(newPage.id);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`✨ Đã tạo ${newPage.title}`);
  };

  // Expand vertical height for current page (Infinite scroll)
  const handleExpandPageHeight = () => {
    setPages(prev =>
      prev.map(p => {
        if (p.id === currentPageId) {
          const newHeight = p.pageHeight + standardA4Height;
          return { ...p, pageHeight: newHeight };
        }
        return p;
      })
    );
    showToast('Đã mở rộng thêm 1 khổ A4 xuống dưới (Cuộn không giới hạn)');
  };

  const handleRemovePageBreak = (breakY: number) => {
    setPages(prev =>
      prev.map(p => {
        if (p.id === currentPageId) {
          return {
            ...p,
            pageBreaks: (p.pageBreaks || []).filter(y => Math.abs(y - breakY) > 10),
          };
        }
        return p;
      })
    );
    showToast('Đã xóa vạch ngắt trang');
  };

  const handleAddPageBreakAtScroll = () => {
    const scrollPos = scrollContainerRef.current
      ? scrollContainerRef.current.scrollTop + 350
      : standardA4Height;

    setPages(prev =>
      prev.map(p => {
        if (p.id === currentPageId) {
          const currentBreaks = p.pageBreaks || [];
          return {
            ...p,
            pageBreaks: [...currentBreaks, Math.round(scrollPos)],
          };
        }
        return p;
      })
    );
    showToast('✨ Đã chèn vạch chia trang OneNote tại vị trí hiện tại');
  };

  const handleInsertBreakAt = (y: number) => {
    setPages(prev =>
      prev.map(p => {
        if (p.id === currentPageId) {
          const currentBreaks = p.pageBreaks || [];
          return {
            ...p,
            pageBreaks: [...currentBreaks, Math.round(y)],
          };
        }
        return p;
      })
    );
    showToast('Đã chèn ngắt trang');
  };

  // Snapping logic with ruler edge
  const snapToRulerEdge = (pt: Point): Point => {
    if (!ruler.visible) return pt;

    const rad = (-ruler.angle * Math.PI) / 180;
    const dx = pt.x - ruler.x;
    const dy = pt.y - ruler.y;
    const localX = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localY = dx * Math.sin(rad) + dy * Math.cos(rad);

    if (Math.abs(localY) < 25 && localX >= -10 && localX <= ruler.length + 10) {
      const snappedLocalX = Math.max(0, Math.min(ruler.length, localX));
      const invRad = (ruler.angle * Math.PI) / 180;
      const worldX = ruler.x + snappedLocalX * Math.cos(invRad);
      const worldY = ruler.y + snappedLocalX * Math.sin(invRad);
      return { ...pt, x: worldX, y: worldY };
    }

    return pt;
  };

  // Pointer down (Mouse or Stylus/Pen)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (activeLayer?.locked) {
      showToast('⚠️ Lớp hiện tại đang bị khóa! Vui lòng mở khóa trong bảng Quản Lý Lớp.');
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    let pressure = e.pressure;
    if (!pressure || pressure === 0.5) {
      pressure = 0.6;
    }

    const initialPoint: Point = snapToRulerEdge({
      x: rawX,
      y: rawY,
      pressure,
      time: Date.now(),
    });

    if (currentPen === 'laser') {
      isDrawingRef.current = true;
      setLaserPoints(prev => [...prev, { x: initialPoint.x, y: initialPoint.y, time: Date.now() }]);
      return;
    }

    isDrawingRef.current = true;
    currentPointsRef.current = [initialPoint];
    lastPointTimeRef.current = Date.now();

    if (isEraser) {
      eraseAtPoint(initialPoint);
    } else {
      renderCanvas();
    }
  };

  // Pointer move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    const now = Date.now();
    const dt = Math.max(1, now - lastPointTimeRef.current);

    const prevPt = currentPointsRef.current[currentPointsRef.current.length - 1];
    const dist = Math.hypot(rawX - prevPt.x, rawY - prevPt.y);
    const speed = dist / dt;
    lastSpeedRef.current = speed;

    let pressure = e.pressure;
    if (!pressure || pressure === 0.5) {
      pressure = Math.max(0.2, Math.min(1.0, 1.1 / (1 + speed * 0.4)));
    }

    const nextPoint: Point = snapToRulerEdge({
      x: rawX,
      y: rawY,
      pressure,
      time: now,
    });

    if (currentPen === 'laser') {
      setLaserPoints(prev => [...prev, { x: nextPoint.x, y: nextPoint.y, time: now }]);
      return;
    }

    lastPointTimeRef.current = now;

    // Auto-scroll viewport down if pointer approaches the bottom edge
    if (e.clientY > window.innerHeight - 70 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop += 12;
    }

    // Auto-expand canvas height if drawing within 200px of bottom
    if (rawY > currentTotalHeight - 200) {
      setPages(prev =>
        prev.map(p =>
          p.id === currentPageId ? { ...p, pageHeight: p.pageHeight + standardA4Height } : p
        )
      );
    }

    if (isEraser) {
      eraseAtPoint(nextPoint);
    } else {
      currentPointsRef.current.push(nextPoint);
      renderCanvas();
    }
  };

  // Pointer up
  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPen === 'laser') {
      return;
    }

    if (isEraser) {
      currentPointsRef.current = [];
      return;
    }

    if (currentPointsRef.current.length === 0) return;

    let finalPoints = currentPointsRef.current;
    if (stabilization > 0) {
      finalPoints = smoothPoints(finalPoints, stabilization);
    }

    let isShape = false;
    let shapeType: any = undefined;
    let shapeData: any = undefined;

    if (autoShape && finalPoints.length >= 8) {
      const shapeResult = detectAutoShape(finalPoints);
      if (shapeResult.isShape) {
        isShape = true;
        shapeType = shapeResult.shapeType;
        shapeData = shapeResult.shapeData;
        showToast(`✨ Tự động nhận diện hình: ${shapeType?.toUpperCase()}`);
      }
    }

    const newStroke: Stroke = {
      id: 'stroke-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      penType: currentPen,
      color: penColor,
      size: penSize,
      points: finalPoints,
      layerId: activeLayerId,
      timestamp: Date.now(),
      isShape,
      shapeType,
      shapeData,
    };

    const newStrokes = [...strokes, newStroke];
    setHistory(prev => [...prev, strokes]);
    setRedoStack([]);
    setStrokes(newStrokes);

    // Sync to current page
    setPages(prev =>
      prev.map(p =>
        p.id === currentPageId ? { ...p, strokes: newStrokes, updatedAt: Date.now() } : p
      )
    );

    currentPointsRef.current = [];
  };

  // Eraser function
  const eraseAtPoint = (pt: Point) => {
    const eraseRadius = penSize * 3 + 12;
    const remaining = strokes.filter(s => {
      const layer = layers.find(l => l.id === s.layerId);
      if (layer?.locked) return true;

      for (const p of s.points) {
        if (Math.hypot(p.x - pt.x, p.y - pt.y) < eraseRadius) {
          return false;
        }
      }
      return true;
    });

    if (remaining.length !== strokes.length) {
      setHistory(prev => [...prev, strokes]);
      setRedoStack([]);
      setStrokes(remaining);
      setPages(prev =>
        prev.map(p =>
          p.id === currentPageId ? { ...p, strokes: remaining, updatedAt: Date.now() } : p
        )
      );
    }
  };

  // Undo / Redo
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [...prev, strokes]);
    setStrokes(previous);
    setHistory(prev => prev.slice(0, prev.length - 1));
    setPages(prev =>
      prev.map(p =>
        p.id === currentPageId ? { ...p, strokes: previous, updatedAt: Date.now() } : p
      )
    );
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, strokes]);
    setStrokes(next);
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setPages(prev =>
      prev.map(p =>
        p.id === currentPageId ? { ...p, strokes: next, updatedAt: Date.now() } : p
      )
    );
  };

  const handleClear = () => {
    if (strokes.length === 0) return;
    if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ nét vẽ trên ${currentPage?.title || 'trang này'}?`)) {
      setHistory(prev => [...prev, strokes]);
      setRedoStack([]);
      setStrokes([]);
      setPages(prev =>
        prev.map(p =>
          p.id === currentPageId ? { ...p, strokes: [], updatedAt: Date.now() } : p
        )
      );
      showToast('Đã xóa trắng trang hiện tại');
    }
  };

  // AI Golden Ratio Refinement
  const handleApplyGoldenRatio = () => {
    if (strokes.length === 0) {
      showToast('Chưa có nét vẽ để căn chỉnh Tỷ Lệ Vàng.');
      return;
    }
    setHistory(prev => [...prev, strokes]);
    setRedoStack([]);
    const refined = applyGoldenRatioRefinement(strokes);
    setStrokes(refined);
    setPages(prev =>
      prev.map(p =>
        p.id === currentPageId ? { ...p, strokes: refined, updatedAt: Date.now() } : p
      )
    );
    showToast('✨ Đã căn chỉnh nhịp điệu chữ viết theo Tỷ Lệ Vàng (1:1.618)!');
  };

  // Toggle Math Tools
  const handleToggleMathTool = (tool: 'ruler' | 'square' | 'compass') => {
    if (tool === 'ruler') {
      setRuler(prev => ({ ...prev, visible: !prev.visible }));
    } else if (tool === 'square') {
      setSquare(prev => ({ ...prev, visible: !prev.visible }));
    } else if (tool === 'compass') {
      setCompass(prev => ({ ...prev, visible: !prev.visible }));
    }
  };

  const handleCommitArc = (arcStroke: Stroke) => {
    setHistory(prev => [...prev, strokes]);
    setRedoStack([]);
    const newStrokes = [...strokes, arcStroke];
    setStrokes(newStrokes);
    setPages(prev =>
      prev.map(p =>
        p.id === currentPageId ? { ...p, strokes: newStrokes, updatedAt: Date.now() } : p
      )
    );
    showToast('Đã ghi nhận hình tròn từ Compa');
  };

  // Snapshot canvas to base64
  const getCanvasSnapshot = (): string => {
    if (!canvasRef.current) return '';
    if (canvasRef.current.height <= 2000) {
      return canvasRef.current.toDataURL('image/png', 0.85);
    }
    // Crop visible viewport for long continuous canvas
    try {
      const tempCanvas = document.createElement('canvas');
      const scrollY = scrollContainerRef.current ? scrollContainerRef.current.scrollTop : 0;
      const vpWidth = canvasDimensions.width;
      const vpHeight = window.innerHeight;
      tempCanvas.width = vpWidth;
      tempCanvas.height = vpHeight;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(canvasRef.current, 0, scrollY, vpWidth, vpHeight, 0, 0, vpWidth, vpHeight);
        return tempCanvas.toDataURL('image/png', 0.85);
      }
    } catch (e) {}
    return canvasRef.current.toDataURL('image/png', 0.85);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '1') {
        setCurrentPen('fountain');
        setIsEraser(false);
      } else if (e.key === '2') {
        setCurrentPen('pencil');
        setIsEraser(false);
      } else if (e.key === '3') {
        setCurrentPen('brush');
        setIsEraser(false);
      } else if (e.key === '4') {
        setCurrentPen('highlighter');
        setIsEraser(false);
      } else if (e.key.toLowerCase() === 'e') {
        setIsEraser(prev => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        handleToggleMathTool('ruler');
      } else if (e.key.toLowerCase() === 'c') {
        handleToggleMathTool('compass');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none touch-none font-sans"
    >
      {/* Top Floating Navigation and Controls */}
      <Toolbar
        currentPen={currentPen}
        setCurrentPen={setCurrentPen}
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        penColor={penColor}
        setPenColor={setPenColor}
        penSize={penSize}
        setPenSize={setPenSize}
        stabilization={stabilization}
        setStabilization={setStabilization}
        autoShape={autoShape}
        setAutoShape={setAutoShape}
        background={background}
        setBackground={setBackground}
        onToggleMathTool={handleToggleMathTool}
        mathToolsState={{
          ruler: ruler.visible,
          square: square.visible,
          compass: compass.visible,
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={redoStack.length > 0}
        onClear={handleClear}
        onApplyGoldenRatio={handleApplyGoldenRatio}
        onToggleLayers={() => setIsLayersOpen(!isLayersOpen)}
        onToggleExport={() => setIsExportOpen(true)}
        onToggleSpecialist={() => setIsSpecialistOpen(!isSpecialistOpen)}
        isSpecialistOpen={isSpecialistOpen}
        onToggleApiKeyModal={() => setIsApiKeyModalOpen(true)}
        // OneNote Pages controls
        totalPages={pages.length}
        currentPageIndex={currentPageIndex}
        currentPageTitle={currentPage?.title || 'Trang 1'}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onAddNewPage={handleAddNewPage}
        onTogglePagesPanel={() => setIsPagesOpen(!isPagesOpen)}
        isPagesPanelOpen={isPagesOpen}
        showPageBreaks={showPageBreaks}
        onTogglePageBreaks={() => setShowPageBreaks(!showPageBreaks)}
        // Educational Tools Callbacks
        onToggleClassroomTools={() => setIsClassroomToolsOpen(true)}
        onToggleMathToolsDialog={() => setIsMathToolsDialogOpen(true)}
        onToggleLassoMath={() => setIsLassoMathOpen(true)}
        onToggleLessonShare={() => setIsLessonShareOpen(true)}
        onUploadImage={handleUploadImage}
        onAddTextBox={handleAddTextBox}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Scrollable Infinite Canvas Viewport */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden bg-slate-900 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="relative mx-auto transition-all"
          style={{
            width: `${canvasDimensions.width}px`,
            height: `${currentTotalHeight}px`,
          }}
        >
          {/* Main Drawing Canvas */}
          <canvas
            ref={canvasRef}
            width={canvasDimensions.width}
            height={currentTotalHeight}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className={`block touch-none ${
              isEraser ? 'cursor-cell' : 'cursor-crosshair'
            }`}
          />

          {/* Educational Elements: Images, Texts, Oxy/3D plots & Laser Pointer */}
          <BoardElementsOverlay
            images={images}
            setImages={setImages}
            texts={texts}
            setTexts={setTexts}
            plots={plots}
            setPlots={setPlots}
            laserPoints={laserPoints}
          />

          {/* OneNote Style Page Breaks & Infinite Expansion Guide */}
          <OneNotePageBreaks
            currentPage={currentPage}
            canvasWidth={canvasDimensions.width}
            showPageBreaks={showPageBreaks}
            onExpandPageHeight={handleExpandPageHeight}
            onRemovePageBreak={handleRemovePageBreak}
            onInsertBreakAt={handleInsertBreakAt}
          />

          {/* Physical Math Tools Interactive Layer */}
          <MathToolsOverlay
            ruler={ruler}
            setRuler={setRuler}
            square={square}
            setSquare={setSquare}
            compass={compass}
            setCompass={setCompass}
            onCommitArc={handleCommitArc}
            activeColor={penColor}
            activeSize={penSize}
            activeLayerId={activeLayerId}
          />
        </div>
      </div>

      {/* OneNote Pages Manager Sliding Panel */}
      <PagesPanel
        isOpen={isPagesOpen}
        onClose={() => setIsPagesOpen(false)}
        pages={pages}
        setPages={setPages}
        currentPageId={currentPageId}
        setCurrentPageId={handleSelectPage}
        showPageBreaks={showPageBreaks}
        setShowPageBreaks={setShowPageBreaks}
        viewMode={viewMode}
        setViewMode={setViewMode}
        canvasWidth={canvasDimensions.width}
        onAddPageBreakAtScroll={handleAddPageBreakAtScroll}
        onExpandPageHeight={handleExpandPageHeight}
      />

      {/* Layers Panel */}
      <LayersPanel
        isOpen={isLayersOpen}
        onClose={() => setIsLayersOpen(false)}
        layers={layers}
        setLayers={setLayers}
        activeLayerId={activeLayerId}
        setActiveLayerId={setActiveLayerId}
      />

      {/* Multi-Page & OneNote Sliced Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        pages={pages}
        currentPageId={currentPageId}
        layers={layers}
        background={background}
        canvasRef={canvasRef}
        canvasWidth={canvasDimensions.width}
        canvasHeight={canvasDimensions.height}
      />

      {/* Digital Ink Specialist AI Assistant Panel */}
      <SpecialistPanel
        isOpen={isSpecialistOpen}
        onClose={() => setIsSpecialistOpen(false)}
        getCanvasSnapshot={getCanvasSnapshot}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        canvasContext={{
          currentPen:
            currentPen === 'fountain'
              ? 'Bút mực'
              : currentPen === 'pencil'
              ? 'Bút chì'
              : currentPen === 'brush'
              ? 'Bút lông'
              : 'Bút dạ quang',
          background:
            background === 'oly'
              ? 'Ô ly học sinh'
              : background === 'grid'
              ? 'Kẻ ô toán học'
              : background === 'dot'
              ? 'Lưới điểm'
              : background === 'vintage'
              ? 'Giấy ngà'
              : background === 'blueprint'
              ? 'Blueprint kỹ thuật'
              : 'Trắng trơn',
          layerCount: layers.length,
          strokeCount: strokes.length,
          autoShape,
          mathTool: ruler.visible
            ? 'Thước kẻ thẳng'
            : square.visible
            ? 'Ê-ke'
            : compass.visible
            ? 'Compa'
            : 'Không',
          activeTool: isEraser ? 'Tẩy' : 'Bút vẽ',
          penSize,
          penColor,
        }}
      />

      {/* Gemini API Key & Model Selection Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        isMandatory={!getStoredApiKey()}
        onSave={() => showToast('✨ Đã cập nhật Gemini API Key và Model thành công!')}
      />

      {/* Classroom Gamification & Tools Modal (Lucky Wheel, Timer) */}
      <ClassroomToolsModal
        isOpen={isClassroomToolsOpen}
        onClose={() => setIsClassroomToolsOpen(false)}
      />

      {/* Math 2D/3D Grapher & SGK Geometry Dialog */}
      <MathToolsDialog
        isOpen={isMathToolsDialogOpen}
        onClose={() => setIsMathToolsDialogOpen(false)}
        onInsertPlot={handleInsertPlot}
        currentScrollY={scrollContainerRef.current?.scrollTop || 0}
      />

      {/* AI Pedagogical Step-by-Step Math Solver & Generator */}
      <LassoMathModal
        isOpen={isLassoMathOpen}
        onClose={() => setIsLassoMathOpen(false)}
        getCanvasSnapshot={getCanvasSnapshot}
        onInsertTextToBoard={(solutionText) => {
          const scrollY = scrollContainerRef.current?.scrollTop || 0;
          const newText: CanvasTextItem = {
            id: 'text-math-' + Date.now(),
            text: solutionText,
            x: 80,
            y: scrollY + 120,
            fontSize: 15,
            color: '#0284c7',
          };
          setTexts(prev => [...prev, newText]);
          setPages(prevPages =>
            prevPages.map(p =>
              p.id === currentPageId ? { ...p, texts: [...(p.texts || []), newText] } : p
            )
          );
          showToast('✨ Đã chèn lời giải AI lên bảng');
        }}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Student Cloud Read-Only View & QR Sharing Modal */}
      <LessonShareModal
        isOpen={isLessonShareOpen}
        onClose={() => setIsLessonShareOpen(false)}
        pages={pages}
        docTitle={currentPage?.title || 'Bài Giảng'}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-semibold flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
