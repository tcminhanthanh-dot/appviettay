import React, { useState } from 'react';
import { CanvasPage } from '../types/canvas';
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Eye,
  BookMarked,
  FolderOpen,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface LessonShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: CanvasPage[];
  docTitle: string;
}

export const LessonShareModal: React.FC<LessonShareModalProps> = ({
  isOpen,
  onClose,
  pages,
  docTitle,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  if (!isOpen) return null;

  // Generate share link
  const currentUrl = window.location.origin + window.location.pathname;
  const shareLink = `${currentUrl}?view=student&title=${encodeURIComponent(docTitle || 'BaiGiang')}&t=${Date.now()}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 flex flex-col text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Chia Sẻ Bài Giảng Cho Học Sinh
              </h3>
              <p className="text-[11px] text-slate-500">
                Chế độ chỉ đọc (Read-only) xem trực tiếp trên điện thoại / máy tính
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

        {/* Info card */}
        <div className="my-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-emerald-900">
              <span className="font-bold block mb-0.5">
                Xem Bảng Trực Tuyến Thời Gian Thực
              </span>
              <span>
                Học sinh truy cập link này sẽ xem được đầy đủ {pages.length} trang bảng ghi chép bài học mà không sợ bị trôi mất kiến thức.
              </span>
            </div>
          </div>
        </div>

        {/* Share Link Input */}
        <div className="my-2">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Đường link bài giảng dành cho học sinh:
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono bg-slate-50 text-slate-700 select-all focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm transition-all active:scale-95 shrink-0"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* QR Code Toggle */}
        <div className="mt-2 pt-2 border-t border-slate-200 flex flex-col items-center">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold hover:underline py-1"
          >
            <QrCode className="w-4 h-4" />
            <span>{showQR ? 'Ẩn mã QR lớp học' : 'Hiển thị mã QR để học sinh quét điện thoại'}</span>
          </button>

          {showQR && (
            <div className="my-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-inner flex flex-col items-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  shareLink
                )}`}
                alt="Mã QR bài giảng"
                className="w-36 h-36 rounded-lg"
              />
              <span className="text-[10px] text-slate-500 mt-2 font-semibold">
                Quét mã camera trên Zalo hoặc điện thoại để mở bảng
              </span>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
