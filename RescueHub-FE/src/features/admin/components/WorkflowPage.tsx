import React, { useState } from "react";
import { Plus } from "lucide-react";
import StateModal from "../components/StateModal";
import TransitionModal from "../components/TransitionModal";

const WorkflowPage = () => {
  const [states, setStates] = useState([
    { code: "ASSIGNED", name: "Đã phân công", color: "#3b82f6" },
    { code: "EN_ROUTE", name: "Đang di chuyển", color: "#f59e0b" },
    { code: "ON_SITE", name: "Đã tới hiện trường", color: "#10b981" },
  ]);

  const [transitions, setTransitions] = useState([
    {
      from: "ASSIGNED",
      to: "EN_ROUTE",
      action: "START_MOVING",
    },
  ]);

  const [showStateModal, setShowStateModal] = useState(false);
  const [showTransitionModal, setShowTransitionModal] = useState(false);

  // ===== ADD STATE =====
  const addState = (data) => {
    setStates((prev) => [...prev, data]);
  };

  // ===== ADD TRANSITION =====
  const addTransition = (data) => {
    setTransitions((prev) => [...prev, data]);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* ===== STATES ===== */}
      <div className="bg-white p-5 rounded-2xl shadow space-y-4">
        <div className="flex justify-between">
          <h2 className="font-bold">Trạng thái</h2>
          <button onClick={() => setShowStateModal(true)}>
            <Plus />
          </button>
        </div>

        {states.map((s) => (
          <div
            key={s.code}
            className="p-3 rounded-lg flex justify-between items-center"
            style={{ backgroundColor: s.color + "20" }}
          >
            <span className="font-semibold">{s.name}</span>
            <span className="text-xs text-gray-500">{s.code}</span>
          </div>
        ))}
      </div>

      {/* ===== TRANSITIONS ===== */}
      <div className="col-span-2 bg-white p-5 rounded-2xl shadow space-y-4">
        <div className="flex justify-between">
          <h2 className="font-bold">Luồng chuyển trạng thái</h2>
          <button onClick={() => setShowTransitionModal(true)}>
            <Plus />
          </button>
        </div>

        {transitions.map((t, index) => (
          <div
            key={index}
            className="border rounded-lg p-4 flex justify-between items-center"
          >
            <div className="flex items-center gap-4">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {t.from}
              </span>

              <span>➡️</span>

              <span className="bg-gray-100 px-2 py-1 rounded">
                {t.to}
              </span>
            </div>

            <span className="text-blue-600 font-semibold">
              {t.action}
            </span>
          </div>
        ))}
      </div>

      {/* ===== MODALS ===== */}
      {showStateModal && (
        <StateModal
          onClose={() => setShowStateModal(false)}
          onSubmit={addState}
        />
      )}

      {showTransitionModal && (
        <TransitionModal
          states={states}
          onClose={() => setShowTransitionModal(false)}
          onSubmit={addTransition}
        />
      )}
    </div>
  );
};

export default WorkflowPage;