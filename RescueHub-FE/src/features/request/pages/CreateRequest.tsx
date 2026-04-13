import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Stethoscope,
  Mountain,
  Camera,
  ImagePlus as CameraPlus,
  Trash2,
  Send,
  MapPin,
  LocateFixed,
  Plus,
  Minus,
  LayoutGrid,
} from "lucide-react";

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const [incidentType, setIncidentType] = useState<"medical" | "lost">(
    "medical",
  );
  const [urgency, setUrgency] = useState<"routine" | "high" | "critical">(
    "critical",
  );

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      <section className="w-1/2 relative bg-surface-container overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src="https://picsum.photos/seed/topo/1000/1000"
          alt="Ban do dia hinh"
          referrerPolicy="no-referrer"
        />

        <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
          <div className="glass-panel p-4 rounded-xl shadow-lg flex items-center gap-3 border border-outline-variant/20">
            <div className="w-3 h-3 bg-primary rounded-full status-glow"></div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">
                Ket noi GPS
              </p>
              <p className="text-sm font-bold text-primary">
                Dang hoat dong: 41.40338, 2.17403
              </p>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center animate-ping absolute"></div>
            <MapPin
              className="text-primary relative z-10"
              size={48}
              fill="currentColor"
            />
          </div>
        </div>

        <div className="absolute bottom-10 right-6 z-10 flex flex-col gap-2">
          <button className="w-12 h-12 bg-surface-container-lowest rounded-lg shadow-xl flex items-center justify-center hover:bg-surface-bright active:scale-90 transition-all">
            <Plus size={20} />
          </button>
          <button className="w-12 h-12 bg-surface-container-lowest rounded-lg shadow-xl flex items-center justify-center hover:bg-surface-bright active:scale-90 transition-all">
            <Minus size={20} />
          </button>
          <button className="w-12 h-12 bg-primary text-on-primary rounded-lg shadow-xl flex items-center justify-center hover:opacity-90 active:scale-90 transition-all mt-2">
            <LocateFixed size={20} />
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-10">
          <div className="glass-panel p-4 rounded-xl shadow-lg border border-outline-variant/20 flex justify-between items-center">
            <div>
              <p className="text-xs text-on-surface-variant font-medium">
                Vi tri duoc danh dau
              </p>
              <p className="text-base font-bold text-on-surface">
                Khu 7-G phia Bac, duong men vach da
              </p>
            </div>
            <button className="text-primary font-bold text-sm hover:underline">
              Can giua ban do
            </button>
          </div>
        </div>
      </section>

      <section className="w-1/2 bg-surface-container-lowest overflow-y-auto flex flex-col">
        <div className="px-12 pt-10 pb-32 max-w-2xl mx-auto w-full">
          <header className="mb-10">
            <h1 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight leading-none mb-2">
              Tạo yêu cầu cứu hộ
            </h1>
            <p className="text-on-surface-variant text-lg">
              Cung cấp thông tin chi tiết để đội điều phối xử lý nhanh hơn.
            </p>
          </header>

          <div className="space-y-12">
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <FileText className="text-primary" size={20} />
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface">
                  Mô tả tình huống
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-widest">
                    Loại sự cố
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setIncidentType("medical")}
                      className={`flex items-center gap-3 p-4 rounded-xl transition-all border-2 ${
                        incidentType === "medical"
                          ? "bg-primary-container text-on-primary border-primary"
                          : "bg-surface-container-high text-on-surface-variant border-transparent hover:bg-surface-container-highest"
                      }`}
                    >
                      <Stethoscope size={20} />
                      <span className="font-bold">Khan cap y te</span>
                    </button>
                    <button
                      onClick={() => setIncidentType("lost")}
                      className={`flex items-center gap-3 p-4 rounded-xl transition-all border-2 ${
                        incidentType === "lost"
                          ? "bg-primary-container text-on-primary border-primary"
                          : "bg-surface-container-high text-on-surface-variant border-transparent hover:bg-surface-container-highest"
                      }`}
                    >
                      <Mountain size={20} />
                      <span className="font-bold">Lac duong / mac ket</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant mb-2 ml-1 uppercase tracking-widest">
                    Chi tiet quan trong
                  </label>
                  <textarea
                    className="w-full bg-surface-container-high border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary placeholder:text-on-surface-variant/60"
                    placeholder="Mo ta dia hinh, so nguoi va moi nguy hiem truoc mat..."
                    rows={5}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/5 rounded-lg">
                  <Camera className="text-primary" size={20} />
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface">
                  Hinh anh hien truong
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square rounded-2xl bg-surface-container-high border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:border-primary/50 transition-colors">
                  <CameraPlus
                    className="text-on-surface-variant group-hover:text-primary transition-colors"
                    size={32}
                  />
                  <p className="text-xs font-bold text-on-surface-variant group-hover:text-primary">
                    TAI ANH LEN
                  </p>
                </div>
                <div className="relative aspect-square rounded-2xl overflow-hidden group">
                  <img
                    className="w-full h-full object-cover"
                    src="https://picsum.photos/seed/forest/400/400"
                    alt="Bang chung"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-error text-on-error p-2 rounded-full">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="absolute top-2 right-2 bg-primary/90 text-on-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    GAN GPS
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="sticky bottom-0 mt-auto px-12 py-8 bg-surface-container-lowest/90 backdrop-blur-md border-t border-outline-variant/10 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-20">
          <div className="max-w-2xl mx-auto flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                  Kiem tra an toan
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-tight">
                Gui di dong nghia vi tri da duoc xac nhan sai so nho hon 5 met.
              </p>
            </div>
            <button
              onClick={() => navigate("/confirmed")}
              className="h-16 px-10 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-bold text-lg shadow-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-3"
            >
              Gui yeu cau
              <Send size={20} />
            </button>
          </div>
        </div>
      </section>

      <div className="fixed top-24 left-6 z-50">
        <button
          onClick={() => navigate("/")}
          className="group relative flex items-center justify-center w-14 h-14 bg-surface-container-lowest rounded-full shadow-2xl border border-outline-variant/10 hover:bg-primary transition-all"
        >
          <LayoutGrid
            className="text-primary group-hover:text-on-primary transition-colors"
            size={24}
          />
          <span className="absolute left-16 bg-on-surface text-surface text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap">
            TRUNG TAM DIEU HANH
          </span>
        </button>
      </div>
    </div>
  );
};
