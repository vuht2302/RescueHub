import React from "react";
import { motion } from "motion/react";
import {
  CheckCircle,
  BadgeCheck,
  UserCheck,
  Navigation,
  Route,
  LocateFixed,
  Layers,
  Phone,
  MessageCircle,
  Dog,
  AlertTriangle,
  ArrowRight,
  BriefcaseMedical as FirstAid,
} from "lucide-react";
import { View } from "../../../shared/types";

interface RescueTrackProps {
  onViewChange: (view: View) => void;
}

export const RescueTrack: React.FC<RescueTrackProps> = ({ onViewChange }) => {
  const steps = [
    { label: "Tiep nhan", time: "10:04", icon: CheckCircle, completed: true },
    { label: "Xac minh", time: "10:12", icon: BadgeCheck, completed: true },
    { label: "Phan cong", time: "10:15", icon: UserCheck, completed: true },
    {
      label: "Dang di chuyen",
      time: "Dang hoat dong",
      icon: Navigation,
      active: true,
    },
    {
      label: "Hoan tat",
      time: "Du kien 11:20",
      icon: CheckCircle,
      future: true,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-primary font-bold text-sm tracking-widest uppercase">
            Ma theo doi: #RG-88241
          </span>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface mt-2 tracking-tight">
            Tien trinh cuu ho dang dien ra
          </h1>
        </div>
        <div className="flex items-center gap-3 text-on-surface-variant bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/20">
          <div className="w-2.5 h-2.5 rounded-full bg-primary relative">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping absolute inset-0"></div>
          </div>
          <span className="text-sm font-semibold">
            Dang nhan cap nhat truc tiep
          </span>
        </div>
      </div>

      <section className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-8 md:p-12">
        <div className="relative flex justify-between items-start">
          <div className="absolute top-6 left-0 w-full h-[2px] bg-surface-container-highest z-0">
            <div className="h-full bg-primary w-3/4"></div>
          </div>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative z-10 flex flex-col items-center gap-4"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  step.completed
                    ? "bg-primary text-white"
                    : step.active
                      ? "bg-primary-container text-white ring-4 ring-primary/20"
                      : "bg-surface-container-highest text-on-surface-variant"
                }`}
              >
                <step.icon size={24} />
              </div>
              <div className="text-center">
                <p
                  className={`font-bold text-sm ${step.active ? "text-primary" : "text-on-surface"}`}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-on-surface-variant/70 uppercase tracking-tighter">
                  {step.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 rounded-3xl overflow-hidden bg-surface-container-low shadow-sm aspect-video lg:aspect-auto lg:h-[500px] relative">
          <img
            className="w-full h-full object-cover opacity-80 grayscale-[30%]"
            src="https://picsum.photos/seed/trackmap/1200/800"
            alt="Ban do cuu ho"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <div className="bg-surface-container-lowest/90 backdrop-blur-md p-4 rounded-2xl shadow-xl flex items-center gap-4 max-w-xs border border-outline-variant/10">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Route className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant">
                  Thoi gian den du kien
                </p>
                <p className="text-xl font-black text-on-surface font-headline">
                  4.2 phut
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button className="bg-surface-container-lowest p-3 rounded-full shadow-lg text-primary hover:bg-primary hover:text-white transition-all">
                <LocateFixed size={20} />
              </button>
              <button className="bg-surface-container-lowest p-3 rounded-full shadow-lg text-primary hover:bg-primary hover:text-white transition-all">
                <Layers size={20} />
              </button>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="relative mb-4">
                <img
                  className="w-24 h-24 rounded-2xl object-cover shadow-md"
                  src="https://picsum.photos/seed/sarah/200/200"
                  alt="Dieu phoi vien"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-surface-container-lowest flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>
              <h3 className="text-2xl font-headline font-extrabold text-on-surface">
                Sarah Chen
              </h3>
              <p className="text-primary font-bold text-sm">
                Chi huy dieu phoi | Don vi K-9 Alpha
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
                <Phone className="text-primary" fill="currentColor" size={20} />
                <span className="text-xs font-bold text-on-surface">
                  Goi doi cuu ho
                </span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
                <MessageCircle
                  className="text-primary"
                  fill="currentColor"
                  size={20}
                />
                <span className="text-xs font-bold text-on-surface">
                  Nhan tin
                </span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-3">
                  <FirstAid className="text-on-surface-variant" size={18} />
                  <span className="text-sm font-medium text-on-surface-variant">
                    Ho tro y te
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">San sang</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-3">
                  <Dog className="text-on-surface-variant" size={18} />
                  <span className="text-sm font-medium text-on-surface-variant">
                    Ho tro K-9
                  </span>
                </div>
                <span className="text-sm font-bold text-primary">
                  Da kich hoat
                </span>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-error-container text-error p-6 rounded-3xl font-bold flex flex-col items-center gap-2 border border-error/20 pulse-glow group"
          >
            <AlertTriangle
              className="group-hover:scale-110 transition-transform"
              size={36}
            />
            <div className="text-center">
              <span className="block text-lg">Cap nhat SOS</span>
              <span className="text-xs opacity-70 font-medium">
                Thong bao dieu kien xau di cho doi cuu ho
              </span>
            </div>
          </motion.button>

          <div className="p-6 bg-primary rounded-3xl text-on-primary">
            <h4 className="font-headline font-bold text-lg mb-2">
              Can ho tro ngay?
            </h4>
            <p className="text-sm opacity-90 mb-4">
              Trung tam chi huy san sang phoi hop bo sung cho ban.
            </p>
            <button className="inline-flex items-center gap-2 text-sm font-bold hover:underline">
              Lien he trung tam chi huy
              <ArrowRight size={16} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
