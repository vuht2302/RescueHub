import React, { useState } from "react";

const MasterDataModal = ({ type, onClose, onSubmit, priorities }) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(
    priorities?.[0]?.code || "HIGH"
  );

  const handleSubmit = () => {
    if (!code || !name) {
      alert("Nhập đầy đủ thông tin");
      return;
    }

    const data =
      type === "incident"
        ? { code, name, priority }
        : { code, name };

    onSubmit(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
        <h2 className="text-xl font-bold">Thêm danh mục</h2>

        <input
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          placeholder="Tên"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {type === "incident" && (
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border p-2 rounded"
          >
            {priorities?.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="border px-3 py-1 rounded">
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            className="bg-blue-950 text-white px-3 py-1 rounded"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterDataModal;