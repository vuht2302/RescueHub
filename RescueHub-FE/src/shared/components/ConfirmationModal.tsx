import React from "react";
import { X, AlertCircle, Check } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận yêu cầu",
  message = "Bạn có chắc chắn cần hỗ trợ khẩn cấp không? Hành động này sẽ khiến đội cứu hộ được thông báo ngay lập tức.",
  confirmText = "Có, tôi cần hỗ trợ",
  cancelText = "Quay lại",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant/20">
        {/* Header */}
        <div className="bg-primary/10 px-6 py-6 flex justify-between items-center border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <AlertCircle className="text-primary" size={24} />
            </div>
            <h2 className="text-xl font-bold text-on-surface">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-on-surface-variant text-base leading-relaxed mb-8">
            {message}
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3 mb-8">
            <div className="pt-1">
              <AlertCircle className="text-primary flex-shrink-0" size={20} />
            </div>
            <p className="text-sm text-on-surface font-medium">
              Vị trí của bạn sẽ được chia sẻ với đội cứu hộ để xử lý nhanh nhất.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-6 bg-surface-container-lowest/50 border-t border-outline-variant/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold hover:bg-surface-container-highest transition-all active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check size={20} />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
