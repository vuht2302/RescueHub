import React from "react";
import { motion } from "motion/react";
import {
  CloudLightning,
  Package,
  CheckCircle2,
  Info,
  Radio,
  AlertCircle,
} from "lucide-react";
import { Alert, View } from "../../../shared/types";

interface AlertCenterProps {
  onViewChange: (view: View) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ onViewChange }) => {
  const alerts: Alert[] = [
    {
      id: "1",
      title: "Canh bao thoi tiet nguy hiem",
      description:
        "Canh bao lu quet tai khu 7-B. Di chuyen len noi cao trong 45 phut toi. Tranh xa bo song.",
      time: "10:42",
      type: "weather",
      priority: "high",
    },
    {
      id: "2",
      title: "Goi tiep te da duoc dieu dong",
      description:
        "Vat tu y te va chan giu nhiet dang toi khu C. Du kien giao luc 09:30.",
      time: "08:15",
      type: "supply",
      priority: "medium",
    },
    {
      id: "3",
      title: "Yeu cau da xu ly xong",
      description:
        "Yeu cau dua nguoi o khu 4-A da hoan tat. Tat ca thanh vien da duoc diem danh day du.",
      time: "Hom qua, 18:20",
      type: "resolved",
      priority: "low",
    },
    {
      id: "4",
      title: "Bao tri mang lien lac",
      description:
        "Bao tri tram tiep song ve tinh da hoan tat. Duong truyen toc do cao da khoi phuc toan khu.",
      time: "Hom qua, 14:00",
      type: "maintenance",
      priority: "low",
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "weather":
        return <CloudLightning className="text-amber-600" />;
      case "supply":
        return <Package className="text-sky-600" />;
      case "resolved":
        return <CheckCircle2 className="text-emerald-600" />;
      case "maintenance":
        return <Info className="text-slate-500" />;
      default:
        return <Info className="text-slate-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "weather":
        return "bg-amber-100 dark:bg-amber-900/30";
      case "supply":
        return "bg-sky-100 dark:bg-sky-900/30";
      case "resolved":
        return "bg-emerald-100 dark:bg-emerald-900/30";
      case "maintenance":
        return "bg-slate-200 dark:bg-slate-800";
      default:
        return "bg-slate-100";
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-5xl font-black font-headline tracking-tighter text-on-surface mb-2">
          Trung tam canh bao
        </h1>
        <p className="text-on-surface-variant font-medium text-lg">
          Cap nhat dieu phoi cuu ho va he thong theo thoi gian thuc.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-error animate-pulse status-glow"></span>
          Uu tien: Hanh dong ngay
        </h2>
        <div className="bg-error-container/30 border border-error/20 rounded-2xl p-6 relative overflow-hidden flex items-center gap-6 shadow-sm">
          <div className="bg-error text-on-error w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
            <AlertCircle size={36} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-2xl font-black font-headline tracking-tight text-on-error-container">
                Doi cuu ho se den trong 2 phut
              </h3>
              <span className="text-sm font-bold text-error">NGHIEM TRONG</span>
            </div>
            <p className="text-on-surface-variant leading-relaxed mb-4">
              Don vi truc thang "Vanguard-1" da xac dinh tin hieu cua ban. Hay
              tao vung ha canh rong 10m va bat den bao hieu.
            </p>
            <div className="flex gap-3">
              <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold text-sm shadow-sm hover:brightness-110 transition-all">
                Da nhan thong tin
              </button>
              <button className="bg-surface-container-lowest text-on-surface px-6 py-3 rounded-lg font-bold text-sm shadow-sm">
                Chia se vi tri
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-10">
        <section>
          <h2 className="text-xl font-bold font-headline mb-6 text-on-surface">
            Hom nay
          </h2>
          <div className="space-y-4">
            {alerts.slice(0, 2).map((alert) => (
              <motion.div
                key={alert.id}
                whileHover={{ x: 4 }}
                className="group bg-surface-container-lowest hover:bg-surface-container-low transition-all p-5 rounded-2xl flex gap-5 items-start cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getBgColor(alert.type)}`}
                >
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-lg text-on-surface">
                      {alert.title}
                    </h4>
                    <span className="text-xs font-semibold text-on-surface-variant">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-snug">
                    {alert.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold font-headline text-on-surface">
              Hom qua
            </h2>
            <div className="flex-1 h-[1px] bg-outline-variant/20"></div>
          </div>
          <div className="space-y-4 opacity-80">
            {alerts.slice(2).map((alert) => (
              <div
                key={alert.id}
                className="bg-surface-container-low/50 p-5 rounded-2xl flex gap-5 items-start"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getBgColor(alert.type)}`}
                >
                  {getIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="font-bold text-lg text-on-surface">
                      {alert.title}
                    </h4>
                    <span className="text-xs font-semibold text-on-surface-variant">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-on-surface-variant text-sm leading-snug">
                    {alert.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-12 bg-primary text-on-primary p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
        <div className="relative z-10 max-w-md">
          <h3 className="font-headline font-black text-2xl mb-2">
            Can ket noi truc tiep?
          </h3>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">
            Ket noi ngay voi chi huy dieu phoi tai khu vuc hien tai cua ban.
          </p>
          <button className="bg-on-primary text-primary px-8 py-4 rounded-xl font-bold hover:scale-[1.02] transition-transform flex items-center gap-2">
            <Radio size={20} />
            Bat kenh vo tuyen bao mat
          </button>
        </div>
        <Radio
          className="absolute -right-8 -bottom-8 text-white opacity-10 rotate-12"
          size={240}
        />
      </div>
    </div>
  );
};
