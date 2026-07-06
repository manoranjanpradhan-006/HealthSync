import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Settings as SettingsIcon, Sliders, ShieldAlert, Cpu, Check, AlertCircle, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { doc, updateDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { dbInstance } from "../firebase/firebase";

export const Settings = () => {
  const { 
    isSimulating, 
    setIsSimulating, 
    language, 
    setLanguage, 
    t,
    currentUser
  } = useApp();

  const [simSpeed, setSimSpeed] = useState("5"); // 5s, 10s, 30s
  const [stockThreshold, setStockThreshold] = useState("20"); // 20%
  const [docThreshold, setDocThreshold] = useState("70"); // 70%
  const [bedThreshold, setBedThreshold] = useState("90"); // 90%
  
  // API Tokens
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem("healthsync_openai_key") || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Database Cleanup State
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState("");

  const handleCleanDemoData = async () => {
    if (!currentUser) return;
    setIsCleaning(true);
    setCleanMessage("Initializing database cleanup...");

    try {
      const collectionsToScan = [
        "centers",
        "stock",
        "stock_transactions",
        "consumption_log",
        "patients",
        "attendance",
        "alerts"
      ];

      let deletedCount = 0;

      // 1. Update User Profile District
      const userDocRef = doc(dbInstance, "users", currentUser.uid);
      await updateDoc(userDocRef, { district: "Default District" });
      setCleanMessage("User profile district updated.");

      // 2. Loop through sandboxed subcollections
      for (const colName of collectionsToScan) {
        setCleanMessage(`Scanning ${colName}...`);
        const colRef = collection(dbInstance, "users", currentUser.uid, colName);
        const snapshot = await getDocs(colRef);

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          let hasAnantapur = false;

          for (const val of Object.values(data)) {
            if (typeof val === "string" && val.toLowerCase().includes("anantapur")) {
              hasAnantapur = true;
              break;
            }
          }

          if (hasAnantapur) {
            const docRef = doc(dbInstance, "users", currentUser.uid, colName, docSnap.id);
            await deleteDoc(docRef);
            deletedCount++;
          }
        }
      }

      setCleanMessage(`Cleanup successful! Deleted ${deletedCount} records.`);
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ["#10b981", "#3b82f6"]
      });
    } catch (err) {
      console.error(err);
      setCleanMessage("Cleanup failed: " + err.message);
    } finally {
      setIsCleaning(false);
      setTimeout(() => setCleanMessage(""), 5000);
    }
  };

  const handleSaveAPIKeys = (e) => {
    e.preventDefault();
    localStorage.setItem("healthsync_openai_key", openaiKey);
    setSavedSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ["#0f766e", "#10b981"]
    });
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-teal-700" />
          <span>System Settings & Node Toggles</span>
        </h2>
        <p className="text-2xs text-slate-400 font-semibold uppercase">Manage global system settings, alarm triggers, and API nodes</p>
      </div>

      {/* Grid Settings Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Panel 1: Simulator Controls */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-1">
            <Cpu className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Simulation Rhythms</h3>
          </div>

          <div className="space-y-3 text-xs font-semibold">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-slate-700">Telemetry Data Simulation</p>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Generates real-time patient influx & stock depletion events</p>
              </div>
              <button 
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-3 py-1.5 rounded-lg text-2xs font-extrabold uppercase transition-all cursor-pointer ${
                  isSimulating 
                    ? "bg-teal-700 hover:bg-teal-800 text-white" 
                    : "bg-red-500 hover:bg-red-600 text-white"
                }`}
              >
                {isSimulating ? "Running" : "Paused"}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-slate-700">Telemetry Pulse Interval</p>
                <p className="text-[10px] text-slate-400 font-medium">Controls speed of simulated clinic updates</p>
              </div>
              <select
                value={simSpeed}
                onChange={(e) => setSimSpeed(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700"
              >
                <option value="5">5 Seconds (Demo Speed)</option>
                <option value="10">10 Seconds (Standard)</option>
                <option value="30">30 Seconds (Slower)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Panel 2: Alarm Limits */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-1">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Alert Threshold Rules</h3>
          </div>

          <div className="space-y-3 text-xs font-semibold text-slate-700">
            <div className="flex justify-between items-center">
              <span>Low Stock Trigger Point:</span>
              <div className="flex items-center space-x-1.5">
                <input 
                  type="number" 
                  value={stockThreshold} 
                  onChange={(e) => setStockThreshold(e.target.value)}
                  className="w-12 border border-slate-350 rounded px-1.5 py-0.5 text-center font-bold"
                />
                <span className="text-slate-400">%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span>Doctor Shortage Trigger:</span>
              <div className="flex items-center space-x-1.5">
                <input 
                  type="number" 
                  value={docThreshold} 
                  onChange={(e) => setDocThreshold(e.target.value)}
                  className="w-12 border border-slate-350 rounded px-1.5 py-0.5 text-center font-bold"
                />
                <span className="text-slate-400">% presence</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span>Overcapacity Overload Trigger:</span>
              <div className="flex items-center space-x-1.5">
                <input 
                  type="number" 
                  value={bedThreshold} 
                  onChange={(e) => setBedThreshold(e.target.value)}
                  className="w-12 border border-slate-350 rounded px-1.5 py-0.5 text-center font-bold"
                />
                <span className="text-slate-400">% occupancy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: API Integration Tokens */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-1">
            <Sliders className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Pluggable API Tokens</h3>
          </div>

          <form onSubmit={handleSaveAPIKeys} className="space-y-4">
            {savedSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-2xs font-semibold p-3 rounded-xl flex items-center space-x-2">
                <Check className="w-4 h-4" />
                <span>API integration configurations updated successfully!</span>
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                OpenAI API Credentials (Optional)
              </label>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-55 focus:outline-none focus:border-teal-500 font-medium"
              />
              <span className="text-[9px] text-slate-400 mt-1 block font-medium">
                Allows the demand prediction models to call live OpenAI endpoints instead of the simulated model.
              </span>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl text-2xs uppercase tracking-wider shadow cursor-pointer"
            >
              Save Credentials
            </button>
          </form>
        </div>

        {/* Panel 4: Database Maintenance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-1">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">Database Maintenance</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-700">Purge Demo Data ("Anantapur")</p>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                Deletes all healthcare centers, medicine inventory logs, and system alerts under your sandbox containing references to the "Anantapur" demo data. It also updates your user profile district to a generic "Default District".
              </p>
            </div>

            {cleanMessage && (
              <div className={`p-3 rounded-xl text-2xs font-semibold ${
                cleanMessage.includes("failed") 
                  ? "bg-red-50 border border-red-100 text-red-700" 
                  : cleanMessage.includes("successful") 
                    ? "bg-emerald-50 border border-emerald-100 text-emerald-700" 
                    : "bg-slate-50 border border-slate-100 text-slate-605"
              }`}>
                {cleanMessage}
              </div>
            )}

            <button
              type="button"
              disabled={isCleaning}
              onClick={handleCleanDemoData}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-2xs uppercase tracking-wider shadow cursor-pointer disabled:opacity-50"
            >
              {isCleaning ? "Purging Data..." : "Purge Demo Data"}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
