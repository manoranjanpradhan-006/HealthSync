import React from "react";
import { useApp } from "../context/AppContext";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

export const MedicineChart = () => {
  const { t } = useApp();

  // Usage trends data for Paracetamol, Ibuprofen, ORS
  const data = [
    { name: "Mon", Paracetamol: 120, Ibuprofen: 45, ORS: 80 },
    { name: "Tue", Paracetamol: 135, Ibuprofen: 50, ORS: 95 },
    { name: "Wed", Paracetamol: 150, Ibuprofen: 38, ORS: 110 },
    { name: "Thu", Paracetamol: 140, Ibuprofen: 48, ORS: 70 },
    { name: "Fri", Paracetamol: 165, Ibuprofen: 55, ORS: 120 },
    { name: "Sat", Paracetamol: 130, Ibuprofen: 40, ORS: 140 },
    { name: "Sun", Paracetamol: 110, Ibuprofen: 34, ORS: 155 }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t("medicineUsage")}</h3>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Daily Consumption trends (past 7 days)</p>
        </div>
        <div className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-2.5 py-0.5 rounded-full uppercase">
          Recharts Engine
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "600" }} />
            <Bar dataKey="Paracetamol" fill="#0f766e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Ibuprofen" fill="#2563eb" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ORS" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MedicineChart;
