import React from "react";

export const Loader = ({ message = "Loading Secure Interface..." }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm border border-slate-100">
        {/* Heartbeat Pulse SVG */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-60"></div>
          <svg className="w-12 h-12 text-teal-600 animate-heartbeat relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <p className="text-slate-700 font-semibold tracking-wide mt-4 text-center">{message}</p>
        <span className="text-xs text-slate-400 mt-1">Health Sync Government Cloud Gateway</span>
      </div>
    </div>
  );
};

export default Loader;
