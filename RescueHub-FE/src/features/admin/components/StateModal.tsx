import React, { useState } from "react";

const StateModal = ({ onClose, onSubmit }) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const handleSubmit = () => {
    if (!code || !name) return alert("Nhập đủ");

    onSubmit({ code, name, color });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
        <h2 className="font-bold text-lg">Thêm trạng thái</h2>

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

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose}>Huỷ</button>
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

export default StateModal;