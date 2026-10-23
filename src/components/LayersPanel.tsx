import React from 'react';
import { Layer } from '../types/canvas';
import { Layers, Eye, EyeOff, Lock, Unlock, Plus, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';

interface LayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  activeLayerId: string;
  setActiveLayerId: (id: string) => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  isOpen,
  onClose,
  layers,
  setLayers,
  activeLayerId,
  setActiveLayerId,
}) => {
  if (!isOpen) return null;

  const handleAddLayer = () => {
    const newId = 'layer-' + Date.now();
    const newLayer: Layer = {
      id: newId,
      name: `Lớp ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
    };
    setLayers(prev => [newLayer, ...prev]);
    setActiveLayerId(newId);
  };

  const handleToggleVisible = (id: string) => {
    setLayers(prev =>
      prev.map(l => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const handleToggleLock = (id: string) => {
    setLayers(prev =>
      prev.map(l => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const handleOpacityChange = (id: string, opacity: number) => {
    setLayers(prev =>
      prev.map(l => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const handleDeleteLayer = (id: string) => {
    if (layers.length <= 1) {
      alert('Phải giữ lại ít nhất 1 lớp!');
      return;
    }
    const remaining = layers.filter(l => l.id !== id);
    setLayers(remaining);
    if (activeLayerId === id) {
      setActiveLayerId(remaining[0].id);
    }
  };

  const handleMoveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    const copy = [...layers];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setLayers(copy);
  };

  return (
    <div className="absolute top-16 right-4 w-72 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl z-40 p-4 flex flex-col text-xs select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Quản Lý Lớp (Layers)</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleAddLayer}
            className="p-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
            title="Thêm lớp mới"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Layer list */}
      <div className="my-3 space-y-2 max-h-72 overflow-y-auto pr-1">
        {layers.map((layer, idx) => {
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-semibold ${isActive ? 'text-indigo-950 font-bold' : 'text-slate-700'}`}>
                  {layer.name}
                </span>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  {/* Reorder */}
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMoveLayer(idx, 'up')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="Đưa lên trên"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={idx === layers.length - 1}
                    onClick={() => handleMoveLayer(idx, 'down')}
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                    title="Đưa xuống dưới"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Visibility */}
                  <button
                    onClick={() => handleToggleVisible(layer.id)}
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title={layer.visible ? 'Ẩn lớp' : 'Hiện lớp'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {/* Lock */}
                  <button
                    onClick={() => handleToggleLock(layer.id)}
                    className="p-1 text-slate-500 hover:text-slate-800"
                    title={layer.locked ? 'Mở khóa' : 'Khóa lớp'}
                  >
                    {layer.locked ? <Lock className="w-3.5 h-3.5 text-rose-500" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                    title="Xóa lớp"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Opacity slider */}
              <div className="flex items-center gap-2 pt-1" onClick={e => e.stopPropagation()}>
                <span className="text-[10px] text-slate-500 w-10">Độ mờ:</span>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={layer.opacity}
                  onChange={e => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] font-mono text-slate-600 w-8 text-right">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 text-center">
        Tách biệt lớp nội dung viết chữ và lớp hình học minh họa.
      </div>
    </div>
  );
};
