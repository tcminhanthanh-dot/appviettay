import React, { useState } from 'react';
import { PenType, BackgroundType, MathToolType } from '../types/canvas';
import {
  PenTool,
  Pencil,
  Paintbrush,
  Highlighter,
  Eraser,
  Grid,
  Pipette,
  Sliders,
  Sparkles,
  Compass,
  Layers,
  Download,
  RotateCcw,
  RotateCw,
  Trash2,
  Bot,
  CircleDot,
  FileCheck2,
  BookOpen,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Split,
  Key,
  Zap,
  ImagePlus,
  Type,
  TrendingUp,
  Gamepad2,
  Calculator,
  Share2,
  Minimize2,
} from 'lucide-react';

interface ToolbarProps {
  currentPen: PenType;
  setCurrentPen: (pen: PenType) => void;
  isEraser: boolean;
  setIsEraser: (val: boolean) => void;
  penColor: string;
  setPenColor: (color: string) => void;
  penSize: number;
  setPenSize: (size: number) => void;
  stabilization: number;
  setStabilization: (val: number) => void;
  autoShape: boolean;
  setAutoShape: (val: boolean) => void;
  background: BackgroundType;
  setBackground: (bg: BackgroundType) => void;
  onToggleMathTool: (tool: 'ruler' | 'square' | 'compass') => void;
  mathToolsState: { ruler: boolean; square: boolean; compass: boolean };
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  onApplyGoldenRatio: () => void;
  onToggleLayers: () => void;
  onToggleExport: () => void;
  onToggleSpecialist: () => void;
  isSpecialistOpen: boolean;
  onToggleApiKeyModal: () => void;
  // OneNote Pages & Page Breaks
  totalPages: number;
  currentPageIndex: number;
  currentPageTitle: string;
  onPrevPage: () => void;
  onNextPage: () => void;
  onAddNewPage: () => void;
  onTogglePagesPanel: () => void;
  isPagesPanelOpen: boolean;
  showPageBreaks: boolean;
  onTogglePageBreaks: () => void;
  // Educational Tools Callbacks
  onToggleClassroomTools: () => void;
  onToggleMathToolsDialog: () => void;
  onToggleLassoMath: () => void;
  onToggleLessonShare: () => void;
  onUploadImage: (file: File) => void;
  onAddTextBox: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentPen,
  setCurrentPen,
  isEraser,
  setIsEraser,
  penColor,
  setPenColor,
  penSize,
  setPenSize,
  stabilization,
  setStabilization,
  autoShape,
  setAutoShape,
  background,
  setBackground,
  onToggleMathTool,
  mathToolsState,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClear,
  onApplyGoldenRatio,
  onToggleLayers,
  onToggleExport,
  onToggleSpecialist,
  isSpecialistOpen,
  onToggleApiKeyModal,
  totalPages,
  currentPageIndex,
  currentPageTitle,
  onPrevPage,
  onNextPage,
  onAddNewPage,
  onTogglePagesPanel,
  isPagesPanelOpen,
  showPageBreaks,
  onTogglePageBreaks,
  onToggleClassroomTools,
  onToggleMathToolsDialog,
  onToggleLassoMath,
  onToggleLessonShare,
  onUploadImage,
  onAddTextBox,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showMathMenu, setShowMathMenu] = useState(false);

  const colors = [
    '#1e293b', // Deep ink black/slate
    '#2563eb', // Royal blue
    '#dc2626', // Crimson red
    '#16a34a', // Emerald green
    '#9333ea', // Purple
    '#f59e0b', // Amber / Highlighter yellow
    '#ec4899', // Pink
    '#0891b2', // Cyan
  ];

  const backgrounds: { id: BackgroundType; label: string; icon: string; desc: string }[] = [
    { id: 'oly', label: 'Ô Ly Học Sinh', icon: '📝', desc: 'Chuẩn 4-5 ô ly vở tiểu học / THCS' },
    { id: 'grid', label: 'Kẻ Ô Toán Học', icon: '📐', desc: 'Lưới caro 5mm tính toán' },
    { id: 'dot', label: 'Lưới Điểm (Dot)', icon: '•', desc: 'Bullet journal & kiến trúc' },
    { id: 'blank', label: 'Trắng Trơn', icon: '📄', desc: 'Khung vẽ tối giản tự do' },
    { id: 'vintage', label: 'Giấy Ngà Vintage', icon: '📜', desc: 'Màu ngà ấm cổ điển' },
    { id: 'blueprint', label: 'Kỹ Thuật Blueprint', icon: '🔷', desc: 'Màu xanh bóng đêm kỹ sư' },
  ];

  return (
    <>
      {/* 1. TOP MINIMALIST HEADER & QUICK CONTROLS */}
      <header className="absolute top-4 left-4 right-4 z-30 pointer-events-none flex items-center justify-between">
        {/* Left: Branding & Fast actions */}
        <div className="pointer-events-auto flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-lg">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-xs text-slate-900 tracking-tight flex items-center gap-1.5">
              Smart Vector Engine
              <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-semibold">
                v2.5
              </span>
            </h1>
            <p className="text-[10px] text-slate-500">Digital Ink & Thước Đo Vật Lý</p>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Hoàn tác (Ctrl+Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Làm lại (Ctrl+Y)"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
            title="Xóa trắng bảng vẽ"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Center: OneNote Pages & New Page Quick Navigation */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-slate-200/80 shadow-lg">
          <button
            onClick={onTogglePagesPanel}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
              isPagesPanelOpen ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-800'
            }`}
            title="Mở bảng Quản Lý Trang OneNote"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="max-w-[120px] truncate">{currentPageTitle}</span>
            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-100/60 text-indigo-800 font-semibold">
              {currentPageIndex + 1}/{totalPages}
            </span>
          </button>

          <div className="flex items-center">
            <button
              onClick={onPrevPage}
              disabled={currentPageIndex <= 0}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextPage}
              disabled={currentPageIndex >= totalPages - 1}
              className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Quick Add New Page */}
          <button
            onClick={onAddNewPage}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors"
            title="Mở thêm trang mới (+)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Trang Mới</span>
          </button>
        </div>

        {/* Right: AI Specialist & Document Export */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Toggle OneNote Page Breaks */}
          <button
            onClick={onTogglePageBreaks}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold shadow-lg transition-all border ${
              showPageBreaks
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                : 'bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-700 hover:bg-slate-100'
            }`}
            title="Bật/Tắt vạch chia trang OneNote (khổ A4)"
          >
            <Split className={`w-4 h-4 ${showPageBreaks ? 'text-amber-600' : 'text-slate-500'}`} />
            <span className="hidden md:inline">Chia Trang OneNote</span>
          </button>

          {/* Golden ratio auto-refine */}
          <button
            onClick={onApplyGoldenRatio}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-amber-50 border border-slate-200/80 text-amber-900 rounded-2xl text-xs font-semibold shadow-lg transition-all active:scale-95"
            title="Căn chỉnh nhịp điệu chữ viết theo Tỷ Lệ Vàng (1:1.618)"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Tỷ Lệ Vàng</span>
          </button>

          {/* Background selector button */}
          <div className="relative">
            <button
              onClick={() => setShowBgMenu(!showBgMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-slate-100 border border-slate-200/80 text-slate-800 rounded-2xl text-xs font-semibold shadow-lg transition-all"
            >
              <Grid className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">Phông Nền</span>
            </button>

            {showBgMenu && (
              <div className="absolute top-12 right-0 w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <span className="text-[11px] font-bold text-slate-500 px-2 py-1 block uppercase">
                  Chọn Phông Nền Vở Vẽ
                </span>
                <div className="space-y-1">
                  {backgrounds.map(bg => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        setBackground(bg.id);
                        setShowBgMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 text-xs transition-all ${
                        background === bg.id
                          ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{bg.icon}</span>
                      <div className="flex-1">
                        <span className="block leading-tight">{bg.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal leading-tight">
                          {bg.desc}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Layers panel toggle */}
          <button
            onClick={onToggleLayers}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-slate-100 border border-slate-200/80 text-slate-800 rounded-2xl text-xs font-semibold shadow-lg transition-all"
            title="Quản lý các lớp vẽ"
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="hidden md:inline">Lớp (Layers)</span>
          </button>

          {/* Export button */}
          <button
            onClick={onToggleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-slate-100 border border-slate-200/80 text-slate-800 rounded-2xl text-xs font-semibold shadow-lg transition-all"
            title="Xuất file Vector SVG, PDF, PNG"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Xuất Bản</span>
          </button>

          {/* Classroom Tools Button */}
          <button
            onClick={onToggleClassroomTools}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-amber-50 border border-slate-200/80 text-amber-900 rounded-2xl text-xs font-semibold shadow-lg transition-all"
            title="Vòng quay may mắn gọi học sinh & Đồng hồ đếm ngược"
          >
            <Gamepad2 className="w-4 h-4 text-amber-600" />
            <span className="hidden xl:inline">Lớp Học</span>
          </button>

          {/* Share Lesson Button */}
          <button
            onClick={onToggleLessonShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-emerald-50 border border-slate-200/80 text-emerald-900 rounded-2xl text-xs font-semibold shadow-lg transition-all"
            title="Chia sẻ bài giảng trực tiếp qua link / QR cho học sinh"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span className="hidden xl:inline">Chia Sẻ</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-2 bg-white/90 backdrop-blur-md hover:bg-slate-100 border border-slate-200/80 text-slate-800 rounded-2xl text-xs font-semibold shadow-lg transition-all"
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình trình chiếu bài giảng'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings / API Key Button */}
          <button
            onClick={onToggleApiKeyModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md hover:bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-semibold shadow-lg transition-all"
            title="Cài đặt Gemini API Key & Model AI"
          >
            <Key className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline text-slate-800">Cài Đặt</span>
            <span className="text-[10px] font-bold text-rose-600 animate-pulse bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
              Lấy API key để sử dụng app
            </span>
          </button>

          {/* AI Digital Ink Specialist Assistant Toggle */}
          <button
            onClick={onToggleSpecialist}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-lg transition-all active:scale-95 ${
              isSpecialistOpen
                ? 'bg-indigo-600 text-white shadow-indigo-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Chuyên Gia AI</span>
          </button>
        </div>
      </header>

      {/* 2. FLOATING BOTTOM / CENTER DOCK (4 PHYSICAL PENS + TOOLS) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-2 shadow-2xl flex items-center gap-2 text-slate-700">
          {/* Pen 1: Bút mực (Fountain) */}
          <button
            onClick={() => {
              setCurrentPen('fountain');
              setIsEraser(false);
            }}
            className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
              !isEraser && currentPen === 'fountain'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold scale-105'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Bút Mực: Nét sắc sảo, lực nhấn tạo nét thanh đậm"
          >
            <PenTool className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bút mực</span>
          </button>

          {/* Pen 2: Bút chì (Pencil) */}
          <button
            onClick={() => {
              setCurrentPen('pencil');
              setIsEraser(false);
            }}
            className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
              !isEraser && currentPen === 'pencil'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold scale-105'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Bút Chì: Độ nhám hạt chì, thích hợp phác thảo"
          >
            <Pencil className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bút chì</span>
          </button>

          {/* Pen 3: Bút lông (Brush) */}
          <button
            onClick={() => {
              setCurrentPen('brush');
              setIsEraser(false);
            }}
            className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
              !isEraser && currentPen === 'brush'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold scale-105'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Bút Lông: Hòa trộn màu, nét vẽ nghệ thuật thư pháp"
          >
            <Paintbrush className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Bút lông</span>
          </button>

          {/* Pen 4: Bút dạ quang (Highlighter) */}
          <button
            onClick={() => {
              setCurrentPen('highlighter');
              setIsEraser(false);
            }}
            className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
              !isEraser && currentPen === 'highlighter'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold scale-105'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Bút Dạ Quang: Bán trong suốt, loang mực đều mịn"
          >
            <Highlighter className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Dạ quang</span>
          </button>

          {/* Pen 5: Bút Laser Giảng Bài (Tự tan biến) */}
          <button
            onClick={() => {
              setCurrentPen('laser');
              setIsEraser(false);
            }}
            className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
              !isEraser && currentPen === 'laser'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-500/40 font-bold scale-105 animate-pulse'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Bút Laser: Chỉ bài giảng, tự động tan biến mờ dần sau 1.5s"
          >
            <Zap className="w-5 h-5 text-rose-500" />
            <span className="text-[10px] mt-0.5">Laser</span>
          </button>

          {/* Eraser */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
              isEraser
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-bold scale-105'
                : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Cục tẩy nét vẽ"
          >
            <Eraser className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Tẩy</span>
          </button>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          {/* Color palette quick swatches */}
          <div className="flex items-center gap-1">
            {colors.slice(0, 5).map(c => (
              <button
                key={c}
                onClick={() => {
                  setPenColor(c);
                  if (isEraser) setIsEraser(false);
                }}
                className={`w-6 h-6 rounded-full transition-transform ${
                  penColor === c && !isEraser
                    ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}

            {/* Native color picker */}
            <label className="w-6 h-6 rounded-full overflow-hidden border border-slate-300 cursor-pointer flex items-center justify-center relative hover:scale-105">
              <input
                type="color"
                value={penColor}
                onChange={e => {
                  setPenColor(e.target.value);
                  if (isEraser) setIsEraser(false);
                }}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
              <Pipette className="w-3.5 h-3.5 text-slate-600" />
            </label>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-1" />

          {/* Math Tools Button */}
          <div className="relative">
            <button
              onClick={() => setShowMathMenu(!showMathMenu)}
              className={`flex flex-col items-center px-3 py-1.5 rounded-2xl transition-all ${
                mathToolsState.ruler || mathToolsState.square || mathToolsState.compass
                  ? 'bg-amber-500 text-white font-bold shadow-md shadow-amber-500/30'
                  : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Công cụ hình học: Thước, Ê-ke, Compa"
            >
              <Compass className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">Toán học</span>
            </button>

            {showMathMenu && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-2 z-50">
                <span className="text-[10px] font-bold text-slate-400 px-2 py-1 block uppercase">
                  Dụng Cụ Hình Học THCS
                </span>
                <button
                  onClick={() => {
                    onToggleMathTool('ruler');
                    setShowMathMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                    mathToolsState.ruler ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>Thước kẻ thẳng (20cm)</span>
                  {mathToolsState.ruler && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                </button>
                <button
                  onClick={() => {
                    onToggleMathTool('square');
                    setShowMathMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                    mathToolsState.square ? 'bg-sky-50 text-sky-900 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>Ê-ke vuông (45°-90°)</span>
                  {mathToolsState.square && <span className="w-2 h-2 rounded-full bg-sky-500" />}
                </button>
                <button
                  onClick={() => {
                    onToggleMathTool('compass');
                    setShowMathMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                    mathToolsState.compass ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-100'
                  }`}
                >
                  <span>Compa quay góc tròn</span>
                  {mathToolsState.compass && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Insert Image Button */}
          <label
            className="flex flex-col items-center px-2.5 py-1.5 rounded-2xl hover:bg-slate-100 text-slate-700 cursor-pointer transition-colors"
            title="Chèn ảnh đề bài / Dán clipboard (Ctrl+V)"
          >
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  onUploadImage(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <ImagePlus className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] mt-0.5">Chèn ảnh</span>
          </label>

          {/* Insert Text Box Button */}
          <button
            onClick={onAddTextBox}
            className="flex flex-col items-center px-2.5 py-1.5 rounded-2xl hover:bg-slate-100 text-slate-700 transition-colors"
            title="Thêm hộp gõ văn bản / công thức Toán"
          >
            <Type className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] mt-0.5">Văn bản</span>
          </button>

          {/* Math Oxy Graph & 3D Shapes Button */}
          <button
            onClick={onToggleMathToolsDialog}
            className="flex flex-col items-center px-2.5 py-1.5 rounded-2xl hover:bg-slate-100 text-slate-700 transition-colors"
            title="Vẽ đồ thị hàm số Oxy & Khối hình học không gian 3D"
          >
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <span className="text-[10px] mt-0.5">Oxy &amp; 3D</span>
          </button>

          {/* AI Math Solver Button */}
          <button
            onClick={onToggleLassoMath}
            className="flex flex-col items-center px-2.5 py-1.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold transition-all active:scale-95"
            title="AI Sư Phạm: Giải bài toán viết tay từng bước & Sinh bài tập tương tự"
          >
            <Calculator className="w-5 h-5 text-indigo-600" />
            <span className="text-[10px] mt-0.5">Giải toán</span>
          </button>

          <div className="h-8 w-px bg-slate-200 mx-0.5" />

          {/* Engine Settings (Stabilization, Auto-shape, Stroke size) */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-2xl hover:bg-slate-100 transition-colors ${
                showSettings ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
              }`}
              title="Cài đặt tham số Smart Vector Engine"
            >
              <Sliders className="w-5 h-5" />
            </button>

            {showSettings && (
              <div className="absolute bottom-16 right-0 w-72 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 text-xs">
                <span className="font-bold text-slate-800 text-sm block mb-3">
                  Thông Số Smart Vector Engine
                </span>

                {/* Stroke size */}
                <div className="mb-3">
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Độ dày nét vẽ:</span>
                    <span className="font-mono font-bold text-indigo-600">{penSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={penSize}
                    onChange={e => setPenSize(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between gap-1 mt-1.5">
                    {[2, 4, 8, 14, 24].map(s => (
                      <button
                        key={s}
                        onClick={() => setPenSize(s)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          penSize === s ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {s}px
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stabilization */}
                <div className="mb-3 pt-2 border-t border-slate-200">
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Ổn định nét (Triệt tiêu rung):</span>
                    <span className="font-mono font-bold text-indigo-600">{Math.round(stabilization * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={stabilization}
                    onChange={e => setStabilization(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Thuật toán Moving Average làm mượt nét tay cầm bút cảm ứng.
                  </span>
                </div>

                {/* Auto shape */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-800 block">Nhận diện hình học (Auto-shape)</span>
                    <span className="text-[10px] text-slate-500">Tự động nắn thẳng đường, elip, tam giác</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoShape}
                    onChange={e => setAutoShape(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
