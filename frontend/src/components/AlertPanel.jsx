import React from "react";
import { useApp } from "../context/AppContext";
import firestore from "../firebase/firestore";
import { AlertCircle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

export const AlertPanel = () => {
  const { alerts, currentUser, t } = useApp();

  // Filter out resolved alerts or show them as styled differently
  const activeAlerts = alerts.filter(a => !a.resolved);

  const handleResolve = async (alertId) => {
    // Resolve alert in Firestore
    await firestore.updateDoc("alerts", alertId, { resolved: true });
  };

  // Convert ISO string to relative time (simplified for demonstration)
  const getRelativeTime = (isoString) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  const getAlertStyles = (severity) => {
    switch (severity) {
      case "danger":
        return {
          bg: "bg-red-50/50 hover:bg-red-50 border-red-200",
          iconColor: "text-red-600",
          tagBg: "bg-red-100 text-red-700",
          dot: "bg-red-500 animate-ping",
          glow: "glow-red"
        };
      case "warning":
        return {
          bg: "bg-amber-50/50 hover:bg-amber-50 border-amber-200",
          iconColor: "text-amber-600",
          tagBg: "bg-amber-100 text-amber-700",
          dot: "bg-amber-500 animate-pulse",
          glow: "glow-amber"
        };
      default:
        return {
          bg: "bg-emerald-50/50 hover:bg-emerald-50 border-emerald-200",
          iconColor: "text-emerald-600",
          tagBg: "bg-emerald-100 text-emerald-700",
          dot: "bg-emerald-500",
          glow: "glow-green"
        };
    }
  };

  const canResolve = currentUser?.role === "Admin" || currentUser?.role === "District Officer" || currentUser?.role === "Staff";

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm tracking-wide">{t("recentAlerts")}</h3>
          </div>
          <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 font-bold px-2.5 py-0.5 rounded-full uppercase">
            {activeAlerts.length} Active
          </span>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-500 font-bold uppercase">All Systems Nominal</p>
              <p className="text-[10px] text-slate-400 mt-0.5">No critical alerts detected in the district.</p>
            </div>
          ) : (
            activeAlerts.map(alert => {
              const styles = getAlertStyles(alert.severity);
              return (
                <div 
                  key={alert.id} 
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all duration-200 ${styles.bg} ${styles.glow}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex space-x-2.5">
                      <div className="relative mt-0.5">
                        <span className={`absolute top-0.5 left-0.5 w-2 h-2 rounded-full ${styles.dot}`}></span>
                        <span className={`block w-2.5 h-2.5 rounded-full ${alert.severity === "danger" ? "bg-red-500" : "bg-amber-500"}`}></span>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800">{alert.title}</h4>
                        <p className="text-2xs text-slate-500 font-semibold mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase whitespace-nowrap pl-2">
                      {getRelativeTime(alert.timestamp)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                    <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded ${styles.tagBg}`}>
                      {alert.severity === "danger" ? t("critical") : "Warning"}
                    </span>

                    {canResolve && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="flex items-center space-x-1 text-2xs font-extrabold uppercase text-teal-700 hover:text-teal-800 hover:underline transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t("resolved")}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;
