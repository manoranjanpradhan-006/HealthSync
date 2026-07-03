import React, { createContext, useContext, useState, useEffect } from "react";
import auth from "../firebase/auth";
import firestore from "../firebase/firestore";
import { startSimulation, stopSimulation } from "../utils/dummySimulator";
import { generateRedistributionSuggestions, calculateCenterHealthScore } from "../ai/recommendations";

const AppContext = createContext();

const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    alerts: "Alerts",
    reports: "Reports",
    centers: "Centers",
    settings: "Settings",
    adminPanel: "Admin Panel",
    welcome: "Welcome",
    login: "Log In",
    logout: "Log Out",
    signup: "Sign Up",
    role: "Role",
    district: "District",
    status: "Status",
    healthScore: "Health Score",
    medicineStock: "Medicine Stock",
    patientFootfall: "Patient Footfall",
    bedAvailability: "Bed Availability",
    doctorAttendance: "Doctor Attendance",
    testAvailability: "Test/Lab Availability",
    aiInsights: "AI Insights",
    recentAlerts: "Recent Alerts",
    critical: "Critical",
    resolved: "Resolved",
    active: "Active",
    paracetamol: "Paracetamol",
    ibuprofen: "Ibuprofen",
    ors: "ORS",
    available: "Available",
    occupied: "Occupied",
    present: "Present",
    absent: "Absent",
    medicineUsage: "Medicine Usage",
    bedsOccupied: "Beds Occupied",
    attendanceTrends: "Attendance Trends",
    predictionDemand: "Predicted Next Week Demand",
    redistributionRecs: "AI Redistribution Recommendations",
    totalCenters: "Centers (PHC/CHC)",
    totalDoctors: "Total Doctors",
    totalBeds: "Total Beds",
    districtOverview: "District Overview",
    voiceListening: "Listening for commands...",
    voiceInstruction: "Try saying: 'Show low stock medicines', 'Open reports', or 'Translate to Hindi'"
  },
  hi: {
    dashboard: "डैशबोर्ड",
    alerts: "अलर्ट",
    reports: "रिपोर्ट",
    centers: "केंद्र",
    settings: "सेटिंग्स",
    adminPanel: "प्रशासनिक पैनल",
    welcome: "स्वागत है",
    login: "लॉग इन करें",
    logout: "लॉग आउट",
    signup: "साइन अप करें",
    role: "भूमिका",
    district: "जिला",
    status: "स्थिति",
    healthScore: "स्वास्थ्य स्कोर",
    medicineStock: "दवा स्टॉक",
    patientFootfall: "मरीज आगमन",
    bedAvailability: "बिस्तरों की उपलब्धता",
    doctorAttendance: "डॉक्टर उपस्थिति",
    testAvailability: "प्रयोगशाला परीक्षण उपलब्धता",
    aiInsights: "एआई अंतर्दृष्टि",
    recentAlerts: "हालिया अलर्ट",
    critical: "गंभीर",
    resolved: "सुलझाया गया",
    active: "सक्रिय",
    paracetamol: "पैरासिटामोल",
    ibuprofen: "इबुप्रोफेन",
    ors: "ओआरएस",
    available: "उपलब्ध",
    occupied: "भरे हुए",
    present: "उपस्थित",
    absent: "अनुपस्थित",
    medicineUsage: "दवा का उपयोग",
    bedsOccupied: "कब्जे वाले बिस्तर",
    attendanceTrends: "उपस्थिति रुझान",
    predictionDemand: "अगले सप्ताह की अनुमानित मांग",
    redistributionRecs: "एआई पुनर्वितरण सिफारिशें",
    totalCenters: "केंद्र (PHC/CHC)",
    totalDoctors: "कुल डॉक्टर",
    totalBeds: "कुल बिस्तर",
    districtOverview: "जिला अवलोकन",
    voiceListening: "आदेशों के लिए सुन रहे हैं...",
    voiceInstruction: "बोलने का प्रयास करें: 'दवाओं का कम स्टॉक दिखाएं', 'रिपोर्ट खोलें', या 'हिंदी में अनुवाद करें'"
  },
  ta: {
    dashboard: "கட்டுப்பாட்டகம்",
    alerts: "எச்சரிக்கைகள்",
    reports: "அறிக்கைகள்",
    centers: "மையங்கள்",
    settings: "அமைப்புகள்",
    adminPanel: "நிர்வாகக் குழு",
    welcome: "வரவேற்கிறோம்",
    login: "உள்நுழைக",
    logout: "வெளியேறு",
    signup: "பதிவு செய்க",
    role: "பங்கு",
    district: "மாவட்டம்",
    status: "நிலை",
    healthScore: "சுகாதார மதிப்பீடு",
    medicineStock: "மருந்து இருப்பு",
    patientFootfall: "நோயாளி வருகை",
    bedAvailability: "படுக்கை வசதி",
    doctorAttendance: "மருத்துவர் வருகை",
    testAvailability: "ஆய்வக சோதனை வசதி",
    aiInsights: "செயற்கை நுண்ணறிவு பகுப்பாய்வு",
    recentAlerts: "சமீபத்திய எச்சரிக்கைகள்",
    critical: "மிக முக்கியமானது",
    resolved: "தீர்க்கப்பட்டது",
    active: "செயலில் உள்ளது",
    paracetamol: "பாராசிட்டமால்",
    ibuprofen: "இப்யூபுரூஃபன்",
    ors: "ஓஆர்எஸ்",
    available: "கிடைக்கக்கூடியவை",
    occupied: "நிரப்பப்பட்டவை",
    present: "வருகை",
    absent: "விடுப்பு",
    medicineUsage: "மருந்து பயன்பாடு",
    bedsOccupied: "பயன்பாட்டில் உள்ள படுக்கைகள்",
    attendanceTrends: "வருகை விகிதங்கள்",
    predictionDemand: "அடுத்த வார உத்தேச தேவை",
    redistributionRecs: "ஏஐ மருந்து பகிர்வு பரிந்துரைகள்",
    totalCenters: "சுகாதார நிலையங்கள்",
    totalDoctors: "மொத்த மருத்துவர்கள்",
    totalBeds: "மொத்த படுக்கைகள்",
    districtOverview: "மாவட்ட சுருக்கம்",
    voiceListening: "குரல் கட்டளைக்காக காத்திருக்கிறது...",
    voiceInstruction: "முயற்சிக்கவும்: 'குறைந்த இருப்பு மருந்துகளைக் காட்டு', 'அறிக்கைகளைத் திற', அல்லது 'தமிழில் மொழிபெயர்க்கவும்'"
  }
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Real-time collections
  const [centers, setCenters] = useState([]);
  const [stock, setStock] = useState([]);
  const [patients, setPatients] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Custom router state: dashboard | alerts | reports | centers | settings | admin
  const [activeTab, setActiveTab] = useState("dashboard");
  const [language, setLanguage] = useState("en");
  const [isSimulating, setIsSimulating] = useState(true);
  
  // Audio Alert sound effects (synthesized via Web Audio API)
  const playAlertSound = (severity) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (severity === "danger") {
        oscillator.type = "sawtooth";
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Standard A4
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
      }
    } catch (e) {
      console.warn("Audio Context blocked or unsupported:", e);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setAuthLoading(false);
      // If user is a Doctor/Pharmacist/Lab Technician, default tab to Dashboard
      if (user && user.role !== "Admin" && user.role !== "District Officer") {
        setActiveTab("dashboard");
      }
    });
    return unsub;
  }, []);

  // Firestore DB Snapshot Listeners
  useEffect(() => {
    const unsubCenters = firestore.onSnapshot("centers", data => setCenters(data));
    const unsubStock = firestore.onSnapshot("stock", data => setStock(data));
    const unsubPatients = firestore.onSnapshot("patients", data => setPatients(data));
    const unsubAttendance = firestore.onSnapshot("attendance", data => setAttendance(data));
    
    // Listen to alerts and play alert sound for new danger alerts
    let previousAlertCount = 0;
    const unsubAlerts = firestore.onSnapshot("alerts", data => {
      const sorted = [...data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAlerts(sorted);
      
      // If alert count increases, check if there's a new critical alert to beep
      if (previousAlertCount > 0 && data.length > previousAlertCount) {
        const latest = sorted[0];
        if (latest && !latest.resolved) {
          playAlertSound(latest.severity);
        }
      }
      previousAlertCount = data.length;
    });

    return () => {
      unsubCenters();
      unsubStock();
      unsubPatients();
      unsubAttendance();
      unsubAlerts();
    };
  }, []);

  // Simulator Controller
  useEffect(() => {
    if (isSimulating) {
      startSimulation((msg) => console.log(`[SIMULATOR] ${msg}`));
    } else {
      stopSimulation();
    }
    return () => stopSimulation();
  }, [isSimulating]);

  // AI suggestions list calculated reactively
  const redistributionRecommendations = generateRedistributionSuggestions(stock, centers);

  // Update Center Health Scores reactively whenever stock or attendance changes
  useEffect(() => {
    centers.forEach(c => {
      const freshScore = calculateCenterHealthScore(c.id, stock, attendance, c);
      if (freshScore !== c.healthScore) {
        firestore.updateDoc("centers", c.id, { healthScore: freshScore });
      }
    });
  }, [stock, attendance]);

  // Multilingual Translator
  const t = (key) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langDict[key] || key;
  };

  // Voice command processor
  const processVoiceCommand = (text) => {
    const cmd = text.toLowerCase().trim();
    if (cmd.includes("stock") || cmd.includes("medicine") || cmd.includes("दवा") || cmd.includes("மருந்து")) {
      setActiveTab("dashboard");
      setTimeout(() => {
        const elem = document.getElementById("medicine-stock-card");
        if (elem) elem.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return "Navigating to medicine stocks...";
    } else if (cmd.includes("report") || cmd.includes("रिपोर्ट") || cmd.includes("அறிக்கை")) {
      setActiveTab("reports");
      return "Opening reports section...";
    } else if (cmd.includes("center") || cmd.includes("map") || cmd.includes("नक्शा") || cmd.includes("வரைபடம்")) {
      setActiveTab("centers");
      return "Opening center map view...";
    } else if (cmd.includes("admin") || cmd.includes("officer") || cmd.includes("अधिकारी")) {
      setActiveTab("admin");
      return "Navigating to Admin Command Center...";
    } else if (cmd.includes("hindi") || cmd.includes("हिंदी")) {
      setLanguage("hi");
      return "अनुवाद किया जा रहा है...";
    } else if (cmd.includes("tamil") || cmd.includes("தமிழ்")) {
      setLanguage("ta");
      return "தமிழில் மாற்றப்படுகிறது...";
    } else if (cmd.includes("english") || cmd.includes("अंग्रेजी")) {
      setLanguage("en");
      return "Switching to English...";
    }
    return "Command unrecognized. Try saying: 'Open reports' or 'Translate to Hindi'";
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      authLoading,
      centers,
      stock,
      patients,
      attendance,
      alerts,
      activeTab,
      setActiveTab,
      language,
      setLanguage,
      isSimulating,
      setIsSimulating,
      redistributionRecommendations,
      t,
      processVoiceCommand
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;
