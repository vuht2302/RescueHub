import React from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  MapPin,
  ArrowLeft,
  ShieldCheck,
  SmartphoneNfc,
} from "lucide-react";
import { View } from "../../../shared/types";

interface SupportConfirmedProps {
  onViewChange: (view: View) => void;
}

export const SupportConfirmed: React.FC<SupportConfirmedProps> = ({
  onViewChange,
}) => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <img
          className="w-full h-full object-cover"
          src="https://picsum.photos/seed/abstract/1920/1080"
          alt="Nen truu tuong"
          referrerPolicy="no-referrer"
        />
      </div>

      <motion.main
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-2xl px-6"
      >
        <div className="bg-surface-container-lowest rounded-xl shadow-[0_12px_32px_rgba(0,31,42,0.08)] p-12 flex flex-col items-center text-center">
          <div className="mb-8 relative">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2
                className="text-primary"
                size={64}
                fill="currentColor"
              />
            </div>
          </div>

          <h1 className="font-headline font-extrabold text-4xl text-on-surface mb-3 tracking-tight">
            Da xac nhan ho tro
          </h1>
          <p className="text-on-surface-variant text-lg max-w-md mb-10 leading-relaxed">
            Trung tam dieu phoi da nhan tin hieu cua ban. Don vi gan nhat dang
            di chuyen den vi tri hien tai.
          </p>

          <div className="w-full bg-surface-container-low rounded-lg p-6 mb-10 flex items-center justify-between text-left">
            <div className="flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-[#4CAF50] status-glow"></div>
              <div>
                <span className="block font-headline font-bold text-on-surface leading-none">
                  Don vi phan ung dang hoat dong
                </span>
                <span className="text-sm text-on-surface-variant">
                  ETA: Duoi 12 phut
                </span>
              </div>
            </div>
            <MapPin className="text-primary-container" size={24} />
          </div>

          <div className="w-full mb-10 text-left">
            <label className="block font-sans text-sm font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">
              Ghi chu bo sung (tuy chon)
            </label>
            <textarea
              className="w-full bg-surface-container-high border-none rounded-lg p-4 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Them thong tin cho doi cuu ho (tam nhin, dia hinh, moi nguy hiem)..."
              rows={3}
            />
          </div>

          <div className="w-full space-y-4">
            <button
              onClick={() => onViewChange("home")}
              className="w-full hero-gradient h-16 rounded-lg text-on-primary font-headline font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
            >
              TOI DA AN TOAN
            </button>
            <button
              onClick={() => onViewChange("home")}
              className="inline-flex items-center gap-2 text-primary font-headline font-bold hover:text-primary-container transition-colors py-2 px-4 group"
            >
              <ArrowLeft
                className="transition-transform group-hover:-translate-x-1"
                size={20}
              />
              Quay lai trang chu
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-12 text-on-surface-variant/60">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Ma hoa dau cuoi
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SmartphoneNfc size={16} />
            <span className="text-xs font-bold uppercase tracking-widest">
              Da bat canh bao rung
            </span>
          </div>
        </div>
      </motion.main>
    </div>
  );
};
