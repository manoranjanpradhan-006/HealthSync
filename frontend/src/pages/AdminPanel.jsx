import React from "react";
import { useApp } from "../context/AppContext";
import { ShieldCheck, Users, BedDouble, ShieldAlert, Award, TrendingUp, Building } from "lucide-react";

export const AdminPanel = () => {
  const { centers, alerts, attendance, stock } = useApp();

  // Aggregate numbers
  const totalPHCs = 45; // static design targets
  const totalCHCs = 12;
  const activeAlerts = alerts.filter(a => !a.resolved).length;
  
  // Calculate average district metrics dynamically based on our 5 demo nodes
  const totalBeds = centers.reduce((sum, c) => sum + c.capacity, 0) * 14; // scale up to mock 1400 beds
  const bedsFilled = centers.reduce((sum, c) => sum + c.bedsOccupied, 0);
  const avgOccupancy = Math.round((bedsFilled / centers.reduce((sum, c) => sum + c.capacity, 0)) * 100);

  const stats = [
    { label: "Primary Health Centers (PHC)", count: totalPHCs, icon: Building, color: "text-teal-600 bg-teal-50 border-teal-100" },
    { label: "Community Health Centers (CHC)", count: totalCHCs, icon: Building, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Aggregated Doctors", count: 176, icon: Users, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { label: "Aggregated Beds", count: 1400, icon: BedDouble, color: "text-purple-600 bg-purple-50 border-purple-100" },
    { label: "Active Incidents", count: activeAlerts, icon: ShieldAlert, color: "text-red-600 bg-red-50 border-red-100 animate-pulse" }
  ];

  // Performance ranking (Dynamic ranking table)
  const sortedCenters = [...centers].sort((a, b) => b.healthScore - a.healthScore);

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <ShieldCheck className="w-6 h-6 text-teal-700 animate-pulse" />
          <span>District Commander Command Center</span>
        </h2>
        <p className="text-2xs text-slate-400 font-semibold uppercase">Aggregated regional analytics and healthcare operational ratings</p>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className={`p-2 w-fit rounded-lg border ${stat.color} mb-3`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-3xs font-extrabold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-extrabold text-slate-800 tracking-tight mt-1">{stat.count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranking and Performance Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaderboard panel (Span 2) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Center Nodes Performance Rankings</span>
            </h3>
            <span className="text-[10px] text-teal-600 bg-teal-50 border border-teal-100 font-bold px-2 py-0.5 rounded-full uppercase">
              District Rankings
            </span>
          </div>

          <div className="space-y-4">
            {sortedCenters.map((center, index) => {
              const rankColor = index === 0 ? "bg-amber-100 border-amber-200 text-amber-700" :
                                index === 1 ? "bg-slate-100 border-slate-200 text-slate-600" :
                                index === sortedCenters.length - 1 ? "bg-red-150 border-red-200 text-red-700" :
                                "bg-slate-50 border-slate-100 text-slate-500";

              return (
                <div key={center.id} className="p-3.5 border border-slate-150 rounded-xl flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center space-x-3.5">
                    <span className={`w-6 h-6 rounded-full text-center leading-6 font-bold border text-2xs ${rankColor}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{center.centerName}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        Capacity: {center.capacity} beds • Beds Filled: {center.bedsOccupied}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`font-bold text-xs ${
                      center.healthScore >= 80 ? "text-emerald-600" :
                      center.healthScore >= 60 ? "text-amber-600" :
                      "text-red-500 animate-pulse font-extrabold"
                    }`}>
                      Score: {center.healthScore} / 100
                    </span>
                    <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          center.healthScore >= 80 ? "bg-emerald-500" :
                          center.healthScore >= 60 ? "bg-amber-500" :
                          "bg-red-500"
                        }`}
                        style={{ width: `${center.healthScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aggregate overview summaries (Span 1) */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-teal-400 flex items-center space-x-1.5 mb-4">
              <TrendingUp className="w-4 h-4 animate-pulse" />
              <span>District Statistics Overview</span>
            </h3>

            <div className="space-y-4 text-2xs font-semibold">
              <div className="border-b border-slate-800 pb-3">
                <p className="text-slate-400 uppercase tracking-wide">Average Bed Occupancy</p>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-xl font-extrabold text-teal-400">{avgOccupancy}%</span>
                  <span className="text-slate-500 font-medium">(Optimized load is 60%)</span>
                </div>
              </div>

              <div className="border-b border-slate-800 pb-3">
                <p className="text-slate-400 uppercase tracking-wide">Pending Logistics Shortages</p>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-xl font-extrabold text-red-400">
                    {centers.filter(c => c.healthScore < 80).length} PHC Nodes
                  </span>
                  <span className="text-slate-500 font-medium">below safety limits</span>
                </div>
              </div>

              <div>
                <p className="text-slate-400 uppercase tracking-wide">Total Logged Incidents Today</p>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-xl font-extrabold text-amber-400">
                    {alerts.length} Incidents
                  </span>
                  <span className="text-slate-500 font-medium">registered in ledger</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">
              District Health Office System
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminPanel;
