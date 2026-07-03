import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { 
  Bell, 
  Languages, 
  Mic, 
  Heart,
  Volume2,
  AlertTriangle
} from "lucide-react";
import VoiceAssistant from "./VoiceAssistant";

export const Navbar = () => {
  const { 
    currentUser, 
    centers, 
    stock, 
    attendance, 
    alerts, 
    language, 
    setLanguage, 
    t 
  } = useApp();

  const [showVoice, setShowVoice] = useState(false);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current active center and calculate health score
  const isDistrictScoped = currentUser?.role === "Admin" || currentUser?.role === "District Officer";
  const activeCenterId = isDistrictScoped ? "phc-a" : currentUser?.centerId; // Admin looks at phc-a as main default
  const activeCenter = centers.find(c => c.id === activeCenterId);
  const healthScore = activeCenter ? activeCenter.healthScore : 87;

  // Active unhandled critical alerts
  const unhandledAlerts = alerts.filter(a => !a.resolved);
  const criticalCount = unhandledAlerts.filter(a => a.severity === "danger").length;

  const scoreColor = healthScore >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                     healthScore >= 60 ? "text-amber-600 bg-amber-50 border-amber-100" :
                     "text-red-600 bg-red-50 border-red-100";

  return (
    <header className="h-16 bg-white border-b border-slate-200 fixed top-0 right-0 left-64 z-10 px-8 flex items-center justify-between shadow-sm">
      {/* Center Details or District Officer aggregated dashboard indicator */}
      <div className="flex items-center space-x-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wide">
            {isDistrictScoped 
              ? `District HQ - ${currentUser?.district || "Anantapur"} Command` 
              : activeCenter?.centerName || "Health Center Node"
            }
          </h2>
          <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
            Government Intelligence Dashboard
          </p>
        </div>

        {/* Global/PHC Health Score */}
        <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center space-x-1.5 shadow-sm ${scoreColor}`}>
          <Heart className="w-3.5 h-3.5 fill-current animate-heartbeat" />
          <span>Health Score: {healthScore}/100</span>
        </div>
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-6">
        {/* Live clock */}
        <div className="hidden lg:block text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 uppercase tracking-wider">
          {timeStr}
        </div>

        {/* Voice Command trigger */}
        <button
          onClick={() => setShowVoice(true)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 transition-colors shadow-sm"
          title="Open Voice Assistant Command Palette"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Voice</span>
        </button>

        {/* Language switcher */}
        <div className="flex items-center space-x-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100">
          <button
            onClick={() => setLanguage("en")}
            className={`px-2 py-0.5 text-xs font-bold rounded ${language === "en" ? "bg-white text-slate-800 shadow" : "text-slate-500"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`px-2 py-0.5 text-xs font-bold rounded ${language === "hi" ? "bg-white text-slate-800 shadow" : "text-slate-500"}`}
          >
            हिं
          </button>
          <button
            onClick={() => setLanguage("ta")}
            className={`px-2 py-0.5 text-xs font-bold rounded ${language === "ta" ? "bg-white text-slate-800 shadow" : "text-slate-500"}`}
          >
            தமி
          </button>
        </div>

        {/* Notifications Icon with Badge */}
        <div className="relative group cursor-pointer" title={`${unhandledAlerts.length} Active Alerts`}>
          <div className="p-2 text-slate-500 bg-slate-50 rounded-lg border border-slate-100 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <Bell className="w-4 h-4" />
          </div>
          {unhandledAlerts.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center ${
              criticalCount > 0 ? "bg-red-500 animate-pulse" : "bg-amber-500"
            }`}>
              {unhandledAlerts.length}
            </span>
          )}
        </div>
      </div>

      {/* Floating Voice Assistant Modal */}
      {showVoice && (
        <VoiceAssistant onClose={() => setShowVoice(false)} />
      )}
    </header>
  );
};

export default Navbar;
