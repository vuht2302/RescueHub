import React, { useState } from "react";
import { X, AlertTriangle, Wrench, Truck } from "lucide-react";

const typeLabels: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number }> }
> = {
  incident: { label: "Loại sự cố", icon: AlertTriangle },
  skill: { label: "Kỹ năng", icon: Wrench },
  vehicle: { label: "Phương tiện", icon: Truck },
};

const MasterDataModal = ({ type, onClose, onSubmit, priorities }) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(priorities?.[0]?.code || "HIGH");

  const handleSubmit = () => {
    if (!code || !name) {
      alert("Nhập đầy đủ thông tin");
      return;
    }

    const data =
      type === "incident" ? { code, name, priority } : { code, name };

    onSubmit(data);
    onClose();
  };

  const typeInfo = typeLabels[type] || {
    label: "Danh mục",
    icon: AlertTriangle,
  };
  const Icon = typeInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/40 z-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <span className="text-blue-700">
              <Icon size={18} />
            </span>
            <h2 className="text-lg font-bold">
              Thêm {typeInfo.label.toLowerCase()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-4">
          {/* CODE & NAME */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Mã *
              </label>
              <input
                placeholder="Nhập mã"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Tên *
              </label>
              <input
                placeholder="Nhập tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* PRIORITY (only for incident) */}
          {type === "incident" && (
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1">
                Độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {priorities?.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm"
            style={{ background: "linear-gradient(135deg,#1e3a5f,#1e40af)" }}
          >
            Thêm mới
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterDataModal;
