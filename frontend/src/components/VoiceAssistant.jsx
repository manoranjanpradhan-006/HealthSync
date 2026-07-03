import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { Mic, X, Send, Sparkles, Volume2 } from "lucide-react";

export const VoiceAssistant = ({ onClose }) => {
  const { processVoiceCommand, t } = useApp();
  const [inputText, setInputText] = useState("");
  const [responseMsg, setResponseMsg] = useState("");
  const [isListening, setIsListening] = useState(true);

  // Auto close speech effect or simulate command capture
  useEffect(() => {
    if (isListening) {
      const timer = setTimeout(() => {
        setIsListening(false);
        setResponseMsg("Microphone active. Type or speak a command below to trigger navigation or action.");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isListening]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const feedback = processVoiceCommand(inputText);
    setResponseMsg(`AI: "${feedback}"`);
    setInputText("");
    
    // Auto-close modal after successful navigation action
    if (feedback.toLowerCase().includes("navigating") || feedback.toLowerCase().includes("opening") || feedback.toLowerCase().includes("switching") || feedback.toLowerCase().includes("अनुवाद") || feedback.toLowerCase().includes("மாற்றப்படுகிறது")) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  const handleVoiceTrigger = (phrase) => {
    setInputText(phrase);
    const feedback = processVoiceCommand(phrase);
    setResponseMsg(`AI: "${feedback}"`);
    setInputText("");
    if (feedback.toLowerCase().includes("navigating") || feedback.toLowerCase().includes("opening") || feedback.toLowerCase().includes("switching") || feedback.toLowerCase().includes("अनुवाद") || feedback.toLowerCase().includes("மாற்றப்படுகிறது")) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col justify-between">
        
        {/* Header */}
        <div className="bg-teal-950 p-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
            <span className="font-extrabold tracking-wide uppercase text-xs">Smart Command Gateway</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Listening wave visual */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="relative mb-6">
            {isListening ? (
              <>
                <span className="absolute -inset-4 bg-teal-100 rounded-full animate-ping opacity-60"></span>
                <span className="absolute -inset-8 bg-teal-50 rounded-full animate-pulse opacity-45"></span>
              </>
            ) : null}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border shadow-lg ${
              isListening ? "bg-teal-600 text-white border-teal-500" : "bg-slate-50 text-slate-400 border-slate-200"
            }`}>
              <Mic className={`w-6 h-6 ${isListening ? "animate-pulse" : ""}`} />
            </div>
          </div>

          <h3 className="font-bold text-slate-800 text-sm">{isListening ? t("voiceListening") : "Voice Assistant Standby"}</h3>
          <p className="text-[10px] text-slate-400 mt-1 max-w-xs">{t("voiceInstruction")}</p>

          {/* Quick Command Suggestions */}
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button 
              onClick={() => handleVoiceTrigger("Show low stock")}
              className="text-[9px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg px-2.5 py-1"
            >
              "Show low stock"
            </button>
            <button 
              onClick={() => handleVoiceTrigger("Open reports")}
              className="text-[9px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg px-2.5 py-1"
            >
              "Open reports"
            </button>
            <button 
              onClick={() => handleVoiceTrigger("Translate to Hindi")}
              className="text-[9px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-100 rounded-lg px-2.5 py-1"
            >
              "Translate to Hindi"
            </button>
          </div>

          {/* Response log message */}
          {responseMsg && (
            <div className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl mt-5 text-2xs text-left font-bold text-teal-800 flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{responseMsg}</span>
            </div>
          )}
        </div>

        {/* Text fallback input */}
        <form onSubmit={handleSubmit} className="border-t border-slate-100 p-4 bg-slate-50 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Type your system command (e.g. 'open reports')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-teal-500 font-medium"
          />
          <button type="submit" className="p-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 shadow transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
};

export default VoiceAssistant;
