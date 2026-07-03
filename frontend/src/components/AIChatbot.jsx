import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { MessageSquare, X, Send, Bot, User, Sparkles } from "lucide-react";
import { predictMedicineDemand } from "../ai/prediction";

export const AIChatbot = () => {
  const { stock, centers, redistributionRecommendations, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I am your AI Healthcare Monitoring Assistant. Ask me about medicine shortages, overcrowding, or next week's predicted demand." }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setInputText("");
    setIsTyping(true);

    // AI thinking latency simulation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let botResponse = "";
    const lowerText = userText.toLowerCase();

    // 1. Context-aware question answers
    if (lowerText.includes("medicine") || lowerText.includes("shortage") || lowerText.includes("stock") || lowerText.includes("दवा")) {
      const lowStockMeds = stock.filter(s => s.quantity <= s.threshold);
      if (lowStockMeds.length === 0) {
        botResponse = "All medicine stock levels are currently above safe threshold parameters across the district.";
      } else {
        const medLines = lowStockMeds.map(m => {
          const centerName = centers.find(c => c.id === m.centerId)?.centerName || m.centerId;
          return `- **${m.medicineName}**: ${m.quantity} units left (threshold ${m.threshold}) at ${centerName}`;
        }).join("\n");
        botResponse = `The following critical medicine shortages are reported:\n${medLines}\n\n**Recommendation:** ${
          redistributionRecommendations.length > 0 
            ? redistributionRecommendations.filter(r => r.type === "stock")[0]?.description || "Initiate stock redistribution from nearby centers."
            : "Review nearby warehouses for immediate logistics dispatch."
        }`;
      }
    } 
    else if (lowerText.includes("overcrowd") || lowerText.includes("full") || lowerText.includes("bed") || lowerText.includes("मरीज")) {
      const busyCenters = [...centers].sort((a, b) => (b.bedsOccupied/b.capacity) - (a.bedsOccupied/a.capacity));
      const worst = busyCenters[0];
      const occupancy = Math.round((worst.bedsOccupied / worst.capacity) * 100);
      
      if (occupancy >= 80) {
        botResponse = `Warning: **${worst.centerName}** is experiencing high patient volume. Occupancy is currently at **${occupancy}%** (${worst.bedsOccupied}/${worst.capacity} beds filled).\n\n**AI Recommendation:** Redirect incoming ambulances and non-critical patient files to nearby centers (e.g. Gooty CHC has beds available).`;
      } else {
        botResponse = `All primary health centers are operating within safe occupancy parameters. The highest is currently **${worst.centerName}** at **${occupancy}%** occupancy.`;
      }
    } 
    else if (lowerText.includes("predict") || lowerText.includes("demand") || lowerText.includes("next week") || lowerText.includes("पूर्वानुमान")) {
      // Mock usage metrics of past week to feed the predictor
      const mockUsage = {
        "Paracetamol": [120, 135, 150, 140, 165, 130, 110],
        "Ibuprofen": [45, 50, 38, 48, 55, 40, 34],
        "ORS": [80, 95, 110, 70, 120, 140, 155]
      };
      
      botResponse = "Calling AI prediction engine...";
      setMessages(prev => [...prev, { sender: "bot", text: botResponse }]);
      
      try {
        const prediction = await predictMedicineDemand(mockUsage);
        const lines = Object.keys(prediction.predictions).map(med => {
          const val = prediction.predictions[med];
          return `- **${med}**: Predicted ${val.needed} units (Confidence ${Math.round(val.confidence * 100)}%, Trend: ${val.trend.toUpperCase()})`;
        }).join("\n");
        botResponse = `**AI Next Week Demand Forecast:**\n${lines}\n\n*Analysis:* ${prediction.explanation}`;
      } catch (e) {
        botResponse = "Error invoking AI demand prediction models. Please check settings / API connection tokens.";
      }
    } 
    else if (lowerText.includes("report") || lowerText.includes("csv") || lowerText.includes("pdf") || lowerText.includes("रिपोर्ट")) {
      botResponse = "You can generate and download comprehensive PDF, Excel, and CSV health metrics reports directly from the **Reports** tab in the sidebar menu. Operational summaries are built automatically every night.";
    } 
    else if (lowerText.includes("help") || lowerText.includes("hello") || lowerText.includes("hi")) {
      botResponse = "I can analyze district healthcare statistics. Try asking me:\n1. 'Which PHC needs medicines?'\n2. 'Which center is overcrowded?'\n3. 'Predict next week's demand'\n4. 'Generate monthly report'";
    } 
    else {
      botResponse = "I have captured your query. As an AI health monitor, I recommend reviewing the main **Dashboard cards** for real-time stock levels or using the **Admin Panel** to analyze centers rankings.";
    }

    setIsTyping(false);
    // Remove temporary calling prediction log if present
    setMessages(prev => {
      const filtered = prev.filter(m => m.text !== "Calling AI prediction engine...");
      return [...filtered, { sender: "bot", text: botResponse }];
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-teal-700 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-teal-800 transition-all duration-300 hover:scale-110 glow-teal border border-teal-600/30"
          title="Open AI Intelligence Assistant"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}

      {/* Expanded chat panel */}
      {isOpen && (
        <div className="bg-white rounded-2xl w-80 sm:w-96 h-[480px] shadow-2xl border border-slate-200 flex flex-col justify-between overflow-hidden transition-all duration-300 transform scale-100">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="bg-teal-700 p-1.5 rounded-lg text-teal-100">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider">Health Sync AI Assistant</h3>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[9px] text-teal-400 font-bold uppercase tracking-widest">Active Query Server</span>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat message logs */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {messages.map((m, idx) => {
              const isBot = m.sender === "bot";
              return (
                <div key={idx} className={`flex ${isBot ? "justify-start" : "justify-end"}`}>
                  <div className={`flex items-start space-x-2 max-w-[85%] ${isBot ? "" : "flex-row-reverse space-x-reverse"}`}>
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isBot ? "bg-teal-50 text-teal-700" : "bg-slate-200 text-slate-700"}`}>
                      {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-2xs font-semibold leading-relaxed shadow-sm whitespace-pre-line ${
                      isBot ? "bg-white text-slate-700 border border-slate-100" : "bg-teal-700 text-white"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-100 text-slate-400 p-3 rounded-2xl text-2xs font-bold flex space-x-1 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Form input controls */}
          <form onSubmit={handleSend} className="border-t border-slate-200 p-3 bg-white flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask about stocks, patients, predictions..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:border-teal-500 font-medium"
            />
            <button type="submit" className="p-2 bg-teal-700 text-white rounded-xl hover:bg-teal-800 transition-colors shadow">
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
};

export default AIChatbot;
