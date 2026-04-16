import React, { useEffect, useState } from "react";
import { getWorkflow } from "@/src/shared/services/workflow.service";

const WorkflowPage = () => {
  const [entityType, setEntityType] = useState<"INCIDENT" | "MISSION">(
    "INCIDENT"
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const res = await getWorkflow(entityType);
      setData(res);
    } catch (err) {
      console.error(err);
      alert("Load workflow thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [entityType]);

  if (loading || !data) return <div>Loading...</div>;

  const normalize = (t: any) => ({
    from: t.fromStateCode || "START",
    to: t.toStateCode,
    action: t.actionCode,
    count: t.usedCount,
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black">Workflow hệ thống</h1>
        <p className="text-gray-600 text-sm">
          Luồng xử lý trạng thái Incident / Mission
        </p>
      </div>

      {/* SWITCH */}
      <div className="flex gap-4">
        {["INCIDENT", "MISSION"].map((type) => (
          <button
            key={type}
            onClick={() => setEntityType(type as any)}
            className={`px-4 py-2 rounded-lg font-semibold ${
              entityType === type
                ? "bg-blue-950 text-white"
                : "bg-gray-100"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* STATES */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-3">States</h2>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-green-100 rounded">START</span>

          {data.states.map((s: string) => (
            <span
              key={s}
              className="px-3 py-1 bg-blue-100 rounded"
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* FLOW TABLE */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-3">Transitions</h2>

        <table className="w-full text-sm">
          <thead className="border-b text-gray-600">
            <tr>
              <th className="text-left py-2">From</th>
              <th className="text-left py-2">Action</th>
              <th className="text-left py-2">To</th>
              <th className="text-left py-2">Used</th>
            </tr>
          </thead>

          <tbody>
            {data.transitions.map((t: any, index: number) => {
              const row = normalize(t);

              return (
                <tr key={index} className="border-t">
                  <td className="py-2">
                    <span className="font-semibold text-green-600">
                      {row.from}
                    </span>
                  </td>

                  <td>
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {row.action}
                    </span>
                  </td>

                  <td>
                    <span className="font-semibold text-blue-600">
                      {row.to}
                    </span>
                  </td>

                  <td>{row.count}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FLOW VISUAL (simple) */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-bold mb-3">Flow Preview</h2>

        <div className="space-y-2 text-sm">
          {data.transitions.map((t: any, index: number) => {
            const row = normalize(t);

            return (
              <div
                key={index}
                className="flex items-center gap-2"
              >
                <span className="text-green-600 font-semibold">
                  {row.from}
                </span>

                <span>→</span>

                <span className="bg-gray-200 px-2 rounded">
                  {row.action}
                </span>

                <span>→</span>

                <span className="text-blue-600 font-semibold">
                  {row.to}
                </span>

                <span className="text-gray-400 text-xs">
                  ({row.count})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;