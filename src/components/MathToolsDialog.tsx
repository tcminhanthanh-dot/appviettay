import React, { useState } from 'react';
import { MathPlotItem } from '../types/canvas';
import {
  TrendingUp,
  Box,
  Plus,
  X,
  Sparkles,
  Layers,
  Check,
  Grid,
} from 'lucide-react';

interface MathToolsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertPlot: (plot: MathPlotItem) => void;
  currentScrollY: number;
}

export const MathToolsDialog: React.FC<MathToolsDialogProps> = ({
  isOpen,
  onClose,
  onInsertPlot,
  currentScrollY,
}) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'shape3d'>('graph');

  // Function Graph State
  const [expression, setExpression] = useState('x^2 - 4*x + 3');
  const [graphColor, setGraphColor] = useState('#2563eb');
  const [graphWidth, setGraphWidth] = useState(420);
  const [graphHeight, setGraphHeight] = useState(300);

  // 3D Shape State
  const [selectedShape, setSelectedShape] = useState<'pyramid' | 'prism' | 'cylinder' | 'cone' | 'cube'>('pyramid');
  const [shapeWidth, setShapeWidth] = useState(360);
  const [shapeHeight, setShapeHeight] = useState(280);

  if (!isOpen) return null;

  const sampleFunctions = [
    { label: 'Bậc nhất', expr: '2*x - 1' },
    { label: 'Parabol', expr: 'x^2 - 4*x + 3' },
    { label: 'Bậc ba', expr: 'x^3 - 3*x' },
    { label: 'Lượng giác sin', expr: 'sin(x)' },
    { label: 'Lượng giác cos', expr: 'cos(x)' },
    { label: 'Phân thức', expr: '1/x' },
  ];

  const shapes3D = [
    {
      id: 'pyramid' as const,
      name: 'Hình Chóp Tứ Giác',
      code: 'S.ABCD',
      desc: 'Đáy hình bình hành, nét đứt ẩn SA, AB, AD',
    },
    {
      id: 'cube' as const,
      name: 'Hình Hộp / Lập Phương',
      code: 'ABCD.A\'B\'C\'D\'',
      desc: 'Hình hộp không gian 6 mặt chuẩn SGK',
    },
    {
      id: 'prism' as const,
      name: 'Hình Lăng Trụ Đứng',
      code: 'ABC.A\'B\'C\'',
      desc: 'Lăng trụ tam giác đều nét đứt AC và A\'C\'',
    },
    {
      id: 'cone' as const,
      name: 'Hình Nón Tròn Xoay',
      code: 'Đỉnh S, Đáy (O)',
      desc: 'Đường sinh, trục SO và đáy elip nửa nét đứt',
    },
    {
      id: 'cylinder' as const,
      name: 'Hình Trụ Tròn Xoay',
      code: 'Trục OO\'',
      desc: 'Hình trụ 2 đáy tròn elip chuẩn tỉ lệ',
    },
  ];

  const handleInsertGraph = () => {
    const newPlot: MathPlotItem = {
      id: 'plot-' + Date.now(),
      type: 'function',
      x: 100,
      y: currentScrollY + 80,
      width: graphWidth,
      height: graphHeight,
      expression: expression.trim(),
      color: graphColor,
    };
    onInsertPlot(newPlot);
    onClose();
  };

  const handleInsertShape = () => {
    const newPlot: MathPlotItem = {
      id: 'plot-' + Date.now(),
      type: 'shape3d',
      x: 120,
      y: currentScrollY + 80,
      width: shapeWidth,
      height: shapeHeight,
      shape3DType: selectedShape,
      title: shapes3D.find(s => s.id === selectedShape)?.name,
    };
    onInsertPlot(newPlot);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 flex flex-col text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Toán Học Tương Tác: Oxy &amp; Hình Học 3D
              </h3>
              <p className="text-[11px] text-slate-500">
                Lấy cảm hứng từ D3 Visualization &amp; Algorithmic Art chuẩn SGK
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mt-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'graph'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Hệ Trục Oxy &amp; Đồ Thị Hàm Số</span>
          </button>
          <button
            onClick={() => setActiveTab('shape3d')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'shape3d'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Hình Học Không Gian 3D</span>
          </button>
        </div>

        {/* Tab 1: Graph */}
        {activeTab === 'graph' && (
          <div className="py-4 space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Biểu thức hàm số: <span className="font-mono text-indigo-600">y = f(x)</span>
              </label>
              <input
                type="text"
                value={expression}
                onChange={e => setExpression(e.target.value)}
                placeholder="VD: 2*x + 1, x^2 - 4*x + 3, sin(x)..."
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Quick samples */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">
                Gợi ý đồ thị thông dụng:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleFunctions.map(s => (
                  <button
                    key={s.expr}
                    onClick={() => setExpression(s.expr)}
                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-lg text-[10px] font-mono transition-colors"
                  >
                    {s.label}: {s.expr}
                  </button>
                ))}
              </div>
            </div>

            {/* Color & Size */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Màu đường đồ thị:
                </label>
                <div className="flex gap-1.5">
                  {['#2563eb', '#dc2626', '#16a34a', '#9333ea', '#ea580c'].map(c => (
                    <button
                      key={c}
                      onClick={() => setGraphColor(c)}
                      className={`w-6 h-6 rounded-lg transition-transform ${
                        graphColor === c ? 'scale-110 ring-2 ring-offset-1 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Kích thước khung:
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-700">
                    {graphWidth} x {graphHeight} px
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleInsertGraph}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Chèn Hệ Trục Oxy &amp; Đồ Thị Lên Bảng</span>
            </button>
          </div>
        )}

        {/* Tab 2: 3D Shapes */}
        {activeTab === 'shape3d' && (
          <div className="py-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-700 block">
              Chọn khối hình học không gian (có nét đứt ẩn):
            </span>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {shapes3D.map(shape => (
                <div
                  key={shape.id}
                  onClick={() => setSelectedShape(shape.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedShape === shape.id
                      ? 'bg-indigo-50 border-indigo-400 shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{shape.name}</span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold">
                        {shape.code}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{shape.desc}</p>
                  </div>
                  {selectedShape === shape.id && (
                    <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={handleInsertShape}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all active:scale-95 mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Chèn Khối Hình 3D Lên Bảng</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
