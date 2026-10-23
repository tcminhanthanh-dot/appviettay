import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Clock,
  RotateCw,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sparkles,
  Trophy,
  X,
  Users,
} from 'lucide-react';

interface ClassroomToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClassroomToolsModal: React.FC<ClassroomToolsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'wheel' | 'timer'>('wheel');

  // Lucky Wheel State
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [namesInput, setNamesInput] = useState(
    'An, Bình, Châu, Dũng, Giang, Hương, Hùng, Khánh, Linh, Mai, Nam, Phong, Quân, Sơn, Trang, Tuấn, Vy, Yến'
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const spinAngleRef = useRef(0);
  const spinSpeedRef = useRef(0);

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 mins
  const [initialSeconds, setInitialSeconds] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Lucky Wheel drawing
  const drawWheel = (angle: number) => {
    const canvas = wheelCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const names = namesInput
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = size * 0.45;
    const sliceAngle = (Math.PI * 2) / names.length;

    ctx.clearRect(0, 0, size, size);

    const colors = [
      '#4f46e5',
      '#06b6d4',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
    ];

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle);

    for (let i = 0; i < names.length; i++) {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(startA + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(names[i], radius - 18, 4);
      ctx.restore();
    }

    ctx.restore();

    // Center pin
    ctx.beginPath();
    ctx.arc(center, center, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Arrow pointer on top
    ctx.beginPath();
    ctx.moveTo(center - 10, 10);
    ctx.lineTo(center + 10, 10);
    ctx.lineTo(center, 30);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  useEffect(() => {
    if (activeTab === 'wheel' && isOpen) {
      drawWheel(spinAngleRef.current);
    }
  }, [activeTab, isOpen, namesInput]);

  const handleSpinWheel = () => {
    if (isSpinning) return;
    const names = namesInput
      .split(',')
      .map(n => n.trim())
      .filter(Boolean);

    if (names.length === 0) {
      alert('Vui lòng nhập ít nhất 1 tên học sinh!');
      return;
    }

    setSelectedWinner(null);
    setIsSpinning(true);
    spinSpeedRef.current = 0.35 + Math.random() * 0.25;

    const animate = () => {
      spinAngleRef.current += spinSpeedRef.current;
      spinSpeedRef.current *= 0.985; // friction

      drawWheel(spinAngleRef.current);

      if (spinSpeedRef.current > 0.002) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        // Calculate winner
        const total = names.length;
        const sliceAngle = (Math.PI * 2) / total;
        // Pointer is at top (-PI/2)
        const normalized = (Math.PI * 1.5 - (spinAngleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const winIndex = Math.floor(normalized / sliceAngle) % total;
        setSelectedWinner(names[winIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  // Timer Effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setIsTimeUp(true);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerProgress = initialSeconds > 0 ? (timerSeconds / initialSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 flex flex-col text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tiện Ích &amp; Minigame Lớp Học
              </h3>
              <p className="text-[11px] text-slate-500">
                Lấy cảm hứng từ Game Development trong SKILL EDUCATION
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
            onClick={() => setActiveTab('wheel')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'wheel'
                ? 'border-rose-600 text-rose-600 font-bold bg-rose-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vòng Quay May Mắn (Gọi Tên)</span>
          </button>
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex-1 py-2 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'timer'
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/40 rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Đồng Hồ Đếm Ngược Làm Bài</span>
          </button>
        </div>

        {/* Tab 1: Lucky Wheel */}
        {activeTab === 'wheel' && (
          <div className="py-3 flex flex-col items-center">
            {/* Canvas Wheel */}
            <div className="relative my-2">
              <canvas
                ref={wheelCanvasRef}
                width={280}
                height={280}
                className="rounded-full shadow-lg border-4 border-slate-100"
              />
            </div>

            {/* Winner Badge */}
            {selectedWinner && (
              <div className="my-2 p-2.5 bg-gradient-to-r from-amber-400 to-rose-500 text-white rounded-2xl flex items-center gap-2 shadow-lg animate-bounce">
                <Trophy className="w-5 h-5 text-amber-200" />
                <span className="font-bold text-sm">
                  Chúc mừng: {selectedWinner}! Mời lên bảng!
                </span>
              </div>
            )}

            <button
              onClick={handleSpinWheel}
              disabled={isSpinning}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition-all active:scale-95"
            >
              <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>{isSpinning ? 'Đang quay...' : 'QUAY NGAY!'}</span>
            </button>

            {/* Names Input */}
            <div className="w-full mt-3 pt-2 border-t border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Danh sách học sinh (ngăn cách bằng dấu phẩy):</span>
              </label>
              <textarea
                value={namesInput}
                onChange={e => setNamesInput(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded-xl p-2 text-[11px] font-medium text-slate-700 focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Countdown Timer */}
        {activeTab === 'timer' && (
          <div className="py-4 flex flex-col items-center">
            {/* Big Timer Display */}
            <div className="relative w-56 h-56 flex items-center justify-center my-2">
              <div
                className={`text-5xl font-mono font-extrabold tracking-wider ${
                  isTimeUp
                    ? 'text-rose-600 animate-ping'
                    : timerSeconds <= 30
                    ? 'text-amber-600 animate-pulse'
                    : 'text-indigo-900'
                }`}
              >
                {formatTimer(timerSeconds)}
              </div>
            </div>

            {isTimeUp && (
              <div className="mb-2 p-2 bg-rose-100 text-rose-800 rounded-xl font-bold text-center">
                🔔 HẾT GIỜ LÀM BÀI! Mời các em học sinh dừng bút!
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3 my-2">
              <button
                onClick={() => {
                  setIsTimeUp(false);
                  setIsTimerRunning(!isTimerRunning);
                }}
                className={`px-5 py-2.5 rounded-xl font-bold text-white flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                  isTimerRunning
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTimerRunning ? 'Tạm Dừng' : 'Bắt Đầu'}</span>
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setIsTimeUp(false);
                  setTimerSeconds(initialSeconds);
                }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                title="Đặt lại giờ"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Presets */}
            <div className="w-full mt-3 pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold">Chọn nhanh:</span>
              <div className="flex gap-1.5">
                {[
                  { label: '1 phút', sec: 60 },
                  { label: '3 phút', sec: 180 },
                  { label: '5 phút', sec: 300 },
                  { label: '10 phút', sec: 600 },
                  { label: '15 phút', sec: 900 },
                ].map(p => (
                  <button
                    key={p.sec}
                    onClick={() => {
                      setIsTimerRunning(false);
                      setIsTimeUp(false);
                      setInitialSeconds(p.sec);
                      setTimerSeconds(p.sec);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      initialSeconds === p.sec
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
