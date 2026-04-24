import React, { useEffect, useState, useCallback } from "react";
import { getWorkflow } from "@/src/shared/services/workflow.service";
import { GitBranch, AlertCircle, ArrowRight } from "lucide-react";

const WorkflowPage = () => {
  const [entityType, setEntityType] = useState<"INCIDENT" | "MISSION">(
    "INCIDENT",
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getWorkflow(entityType);
      setData(res);
    } catch (err) {
      console.error(err);
      setError("Load workflow thất bại");
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  const normalize = (t: any) => ({
    from: t.fromStateCode || "START",
    to: t.toStateCode,
    action: t.actionCode,
    count: t.usedCount,
  });

  // 🔥 group theo FROM
  const grouped =
    data?.transitions?.reduce((acc: any, t: any) => {
      const row = normalize(t);
      if (!acc[row.from]) acc[row.from] = [];
      acc[row.from].push(row);
      return acc;
    }, {}) || {};

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Workflow hệ thống
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Luồng xử lý trạng thái Incident / Mission
          </p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2
            className="text-2xl font-black text-gray-900"
            style={{ fontFamily: "var(--font-primary)" }}
          >
            Workflow hệ thống
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Luồng xử lý trạng thái Incident / Mission
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2
          className="text-2xl font-black text-gray-900"
          style={{ fontFamily: "var(--font-primary)" }}
        >
          Workflow hệ thống
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Luồng xử lý trạng thái Incident / Mission
        </p>
      </div>

      {/* SWITCH */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex">
          {["INCIDENT", "MISSION"].map((type) => {
            const isActive = entityType === type;
            return (
              <button
                key={type}
                onClick={() => setEntityType(type as any)}
                className={`
                  relative flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap
                  transition-all flex-1 border-b-2
                  ${
                    isActive
                      ? "border-blue-700 text-blue-800 bg-blue-50/60"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }
                `}
                style={isActive ? { color: "var(--color-blue-950)" } : {}}
              >
                <GitBranch
                  size={15}
                  className={isActive ? "text-blue-700" : "text-gray-400"}
                />
                {type === "INCIDENT" ? "Sự cố" : "Nhiệm vụ"}
              </button>
            );
          })}
        </div>
      </div>

      {/* STATES */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">
          Trạng thái
        </h2>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            START
          </span>

          {data.states.map((s: string) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* FLOW VISUAL */}
      <div className="space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-12 text-center">
            <div className="flex flex-col items-center gap-2">
              <GitBranch size={32} className="text-gray-300" />
              <p className="text-gray-400 text-sm">Chưa có chuyển tiếp nào</p>
            </div>
          </div>
        ) : (
          Object.keys(grouped).map((from) => (
            <div
              key={from}
              className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm"
            >
              {/* FROM */}
              <div className="mb-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {from}
                </span>
              </div>

              {/* TRANSITIONS */}
              <div className="space-y-3">
                {grouped[from].map((row: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-blue-50/30 transition-colors"
                  >
                    {/* ACTION */}
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                      {row.action}
                    </span>

                    <ArrowRight size={16} className="text-gray-400" />

                    {/* TO */}
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {row.to}
                    </span>

                    {/* COUNT */}
                    <span className="ml-auto text-xs text-gray-400 font-mono">
                      Đã dùng: {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-gray-400 text-right">
        {Object.keys(grouped).length} nhóm trạng thái ·{" "}
        {data.transitions?.length || 0} chuyển tiếp
      </p>
    </div>
  );
};

export default WorkflowPage;
