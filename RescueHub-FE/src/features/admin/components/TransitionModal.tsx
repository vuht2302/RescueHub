import React, { useState } from "react";

const TransitionModal = ({ states, onClose, onSubmit }) => {
  const [from, setFrom] = useState(states[0]?.code);
  const [to, setTo] = useState(states[1]?.code);
  const [action, setAction] = useState("");

  const handleSubmit = () => {
    if (!action) return alert("Nhập action");

    onSubmit({ from, to, action });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-[400px] space-y-4">
        <h2 className="font-bold text-lg">Thêm transition</h2>

        <select value={from} onChange={(e) => setFrom(e.target.value)}>
          {states.map((s) => (
            <option key={s.code}>{s.code}</option>
          ))}
        </select>

        <select value={to} onChange={(e) => setTo(e.target.value)}>
          {states.map((s) => (
            <option key={s.code}>{s.code}</option>
          ))}
        </select>

        <input
          placeholder="Action code"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="w-full border p-2 rounded"
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

export default TransitionModal;