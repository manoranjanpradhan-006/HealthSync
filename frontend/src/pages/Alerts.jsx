import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import firestore from "../firebase/firestore";
import { 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal,
  Plus
} from "lucide-react";
import confetti from "canvas-confetti";

export const Alerts = () => {
  const { alerts, stock, centers, currentUser, t } = useApp();
  const [filter, setFilter] = useState("active"); // active | resolved | all

  const handleResolve = async (alert) => {
    // 1. Resolve alert in Firestore
    await firestore.updateDoc("alerts", alert.id, { resolved: true });

    // 2. Perform automated corrective action in simulation to wow the user!
    if (alert.title === "Low Medicine Stock") {
      // Find the low stock medicine matching this center and refill it
      const lowStockMed = stock.find(s => s.centerId === alert.centerId && alert.message.includes(s.medicineName));
      if (lowStockMed) {
        await firestore.updateDoc("stock", lowStockMed.id, { quantity: 950 });
      }
    } else if (alert.title === "Doctor Shortage") {
      // Set all doctors at this center to present
      const centerDocs = await firestore.getDocs("attendance");
      const matched = centerDocs.filter(d => d.centerId === alert.centerId);
      for (const doc of matched) {
        if (doc.status === "Absent") {
          await firestore.updateDoc("attendance", doc.id, { status: "Present" });
        }
      }
    } else if (alert.title === "Overcrowding Alert") {
      // Redirect patients / empty beds
      const center = centers.find(c => c.id === alert.centerId);
      if (center) {
        await firestore.updateDoc("centers", center.id, {
          bedsOccupied: Math.round(center.capacity * 0.5),
          bedsAvailable: Math.round(center.capacity * 0.5)
        });
      }
    }

    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0 }
    });
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case "danger":
        return "bg-red-50/50 border-red-200 text-red-700";
      case "warning":
        return "bg-amber-50/50 border-amber-200 text-amber-700";
      default:
        return "bg-emerald-50/50 border-emerald-200 text-emerald-700";
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === "active") return !alert.resolved;
    if (filter === "resolved") return alert.resolved;
    return true;
  });

  const canResolve = currentUser?.role === "Admin" || currentUser?.role === "District Officer" || currentUser?.role === "Staff";

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            <span>Incident Command & System Alerts</span>
          </h2>
          <p className="text-2xs text-slate-400 font-semibold uppercase">Real-Time telemetry tracking and critical issues registry</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              filter === "active" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Active ({alerts.filter(a => !a.resolved).length})
          </button>
          <button
            onClick={() => setFilter("resolved")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              filter === "resolved" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Resolved ({alerts.filter(a => a.resolved).length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
              filter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Logs ({alerts.length})
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              <th className="py-3 px-6">Incident / Title</th>
              <th className="py-3 px-4">Log Message</th>
              <th className="py-3 px-4">Node Center</th>
              <th className="py-3 px-4">Logged Time</th>
              <th className="py-3 px-4 text-center">Status</th>
              {canResolve && <th className="py-3 px-6 text-right">Corrective Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredAlerts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                  No incident logs found matching filter selection.
                </td>
              </tr>
            ) : (
              filteredAlerts.map(alert => {
                const centerName = centers.find(c => c.id === alert.centerId)?.centerName || "All Districts";
                return (
                  <tr key={alert.id} className="hover:bg-slate-55/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2.5">
                        <span className={`w-2 h-2 rounded-full ${
                          alert.resolved ? "bg-emerald-500" : alert.severity === "danger" ? "bg-red-500 animate-ping" : "bg-amber-500"
                        }`}></span>
                        <span className="font-extrabold text-slate-700">{alert.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-2xs leading-relaxed max-w-xs">{alert.message}</td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
                        {centerName}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-3xs font-semibold flex items-center space-x-1 mt-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase border ${
                        alert.resolved 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                          : alert.severity === "danger" 
                            ? "bg-red-50 border-red-100 text-red-600" 
                            : "bg-amber-50 border-amber-100 text-amber-600"
                      }`}>
                        {alert.resolved ? "Resolved" : "Active"}
                      </span>
                    </td>
                    {canResolve && (
                      <td className="py-4 px-6 text-right">
                        {!alert.resolved ? (
                          <button
                            onClick={() => handleResolve(alert)}
                            className="inline-flex items-center space-x-1 text-2xs font-extrabold uppercase text-teal-700 hover:text-white border border-teal-600 hover:bg-teal-700 px-3 py-1 rounded-lg transition-all shadow-sm cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Trigger Auto-Correction</span>
                          </button>
                        ) : (
                          <span className="text-3xs font-bold text-slate-400 uppercase italic">
                            Mitigated
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Alerts;
