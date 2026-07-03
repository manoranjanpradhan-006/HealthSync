import React from "react";
import { useApp } from "../context/AppContext";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

export const FootfallChart = () => {
  const { patients, t } = useApp();

  // Graph data representing daily totals
  const data = [
    { name: "27 Jun", patients: 180 },
    { name: "28 Jun", patients: 210 },
    { name: "29 Jun", patients: 195 },
    { name: "30 Jun", patients: 240 },
    { name: "01 Jul", patients: 225 },
    { name: "02 Jul", patients: 270 },
    { name: "03 Jul", patients: 256 }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{t("patientFootfall")}</h3>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Weekly Patient Intake Trends</p>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: "#0f172a", borderRadius: "12px", border: "none", color: "#fff", fontSize: "12px" }}
              itemStyle={{ color: "#fff" }}
            />
            <Area type="monotone" dataKey="patients" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FootfallChart;
