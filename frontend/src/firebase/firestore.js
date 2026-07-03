// Simulated real-time Firestore database layer using localStorage and observers
// This allows true multi-panel real-time reactivity without external database setup.

const INITIAL_CENTERS = {
  "phc-a": { id: "phc-a", centerName: "PHC Anantapur", type: "PHC", district: "Anantapur", capacity: 100, latitude: 14.6819, longitude: 77.6006, healthScore: 88, bedsAvailable: 45, bedsOccupied: 55, equipmentScore: 92 },
  "phc-b": { id: "phc-b", centerName: "PHC Dharmavaram", type: "PHC", district: "Anantapur", capacity: 80, latitude: 14.4137, longitude: 77.7126, healthScore: 74, bedsAvailable: 12, bedsOccupied: 68, equipmentScore: 78 },
  "chc-c": { id: "chc-c", centerName: "CHC Gooty", type: "CHC", district: "Anantapur", capacity: 150, latitude: 15.1187, longitude: 77.6322, healthScore: 91, bedsAvailable: 90, bedsOccupied: 60, equipmentScore: 88 },
  "phc-d": { id: "phc-d", centerName: "PHC Hindupur", type: "PHC", district: "Anantapur", capacity: 60, latitude: 13.8290, longitude: 77.4930, healthScore: 61, bedsAvailable: 4, bedsOccupied: 56, equipmentScore: 65 },
  "chc-e": { id: "chc-e", centerName: "CHC Kadiri", type: "CHC", district: "Anantapur", capacity: 120, latitude: 14.1166, longitude: 78.1583, healthScore: 82, bedsAvailable: 40, bedsOccupied: 80, equipmentScore: 84 }
};

const INITIAL_STOCK = {
  "stock-1": { id: "stock-1", medicineName: "Paracetamol", quantity: 950, threshold: 200, centerId: "phc-a", updatedAt: new Date().toISOString() },
  "stock-2": { id: "stock-2", medicineName: "Ibuprofen", quantity: 450, threshold: 150, centerId: "phc-a", updatedAt: new Date().toISOString() },
  "stock-3": { id: "stock-3", medicineName: "ORS", quantity: 20, threshold: 100, centerId: "phc-a", updatedAt: new Date().toISOString() },
  
  "stock-4": { id: "stock-4", medicineName: "Paracetamol", quantity: 120, threshold: 200, centerId: "phc-b", updatedAt: new Date().toISOString() },
  "stock-5": { id: "stock-5", medicineName: "Ibuprofen", quantity: 280, threshold: 150, centerId: "phc-b", updatedAt: new Date().toISOString() },
  "stock-6": { id: "stock-6", medicineName: "ORS", quantity: 340, threshold: 100, centerId: "phc-b", updatedAt: new Date().toISOString() },

  "stock-7": { id: "stock-7", medicineName: "Paracetamol", quantity: 600, threshold: 200, centerId: "chc-c", updatedAt: new Date().toISOString() },
  "stock-8": { id: "stock-8", medicineName: "Ibuprofen", quantity: 180, threshold: 150, centerId: "chc-c", updatedAt: new Date().toISOString() },
  "stock-9": { id: "stock-9", medicineName: "ORS", quantity: 220, threshold: 100, centerId: "chc-c", updatedAt: new Date().toISOString() }
};

const INITIAL_PATIENTS = {
  "pat-1": { id: "pat-1", date: "2026-06-27", count: 180, centerId: "phc-a" },
  "pat-2": { id: "pat-2", date: "2026-06-28", count: 210, centerId: "phc-a" },
  "pat-3": { id: "pat-3", date: "2026-06-29", count: 195, centerId: "phc-a" },
  "pat-4": { id: "pat-4", date: "2026-06-30", count: 240, centerId: "phc-a" },
  "pat-5": { id: "pat-5", date: "2026-07-01", count: 225, centerId: "phc-a" },
  "pat-6": { id: "pat-6", date: "2026-07-02", count: 270, centerId: "phc-a" },
  "pat-7": { id: "pat-7", date: "2026-07-03", count: 256, centerId: "phc-a" },

  "pat-8": { id: "pat-8", date: "2026-07-03", count: 110, centerId: "phc-b" },
  "pat-9": { id: "pat-9", date: "2026-07-03", count: 145, centerId: "chc-c" }
};

const INITIAL_ATTENDANCE = {
  "att-1": { id: "att-1", doctorId: "doc-1", doctorName: "Dr. Rajesh Kumar", specialty: "General Medicine", status: "Present", date: "2026-07-03", centerId: "phc-a" },
  "att-2": { id: "att-2", doctorId: "doc-2", doctorName: "Dr. Sneha Reddy", specialty: "Pediatrics", status: "Present", date: "2026-07-03", centerId: "phc-a" },
  "att-3": { id: "att-3", doctorId: "doc-3", doctorName: "Dr. Vikram Dev", specialty: "General Medicine", status: "Absent", date: "2026-07-03", centerId: "phc-a" },
  "att-4": { id: "att-4", doctorId: "doc-4", doctorName: "Dr. Anjali Sen", specialty: "Obstetrics", status: "Present", date: "2026-07-03", centerId: "phc-a" },
  
  "att-5": { id: "att-5", doctorId: "doc-5", doctorName: "Dr. Amit Verma", specialty: "General Medicine", status: "Absent", date: "2026-07-03", centerId: "phc-b" },
  "att-6": { id: "att-6", doctorId: "doc-6", doctorName: "Dr. Priya Das", specialty: "Gynecology", status: "Present", date: "2026-07-03", centerId: "phc-b" }
};

const INITIAL_ALERTS = {
  "alert-1": { id: "alert-1", title: "Low Medicine Stock", message: "ORS stock is critical (20 Units left) at PHC Anantapur", severity: "danger", timestamp: new Date(Date.now() - 120000).toISOString(), centerId: "phc-a", resolved: false },
  "alert-2": { id: "alert-2", title: "Doctor Shortage", message: "Attendance rate below 75% at PHC Hindupur", severity: "warning", timestamp: new Date(Date.now() - 300000).toISOString(), centerId: "phc-d", resolved: false },
  "alert-3": { id: "alert-3", title: "Overcrowding Alert", message: "Patient count is at 85% bed capacity at PHC Dharmavaram", severity: "danger", timestamp: new Date(Date.now() - 540000).toISOString(), centerId: "phc-b", resolved: false }
};

// Load or initialize DB state
const loadFromStorage = (key, fallback) => {
  const data = localStorage.getItem(`healthsync_db_${key}`);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing localStorage key ${key}`, e);
    }
  }
  localStorage.setItem(`healthsync_db_${key}`, JSON.stringify(fallback));
  return fallback;
};

const dbState = {
  centers: loadFromStorage("centers", INITIAL_CENTERS),
  stock: loadFromStorage("stock", INITIAL_STOCK),
  patients: loadFromStorage("patients", INITIAL_PATIENTS),
  attendance: loadFromStorage("attendance", INITIAL_ATTENDANCE),
  alerts: loadFromStorage("alerts", INITIAL_ALERTS)
};

const saveToStorage = (key) => {
  localStorage.setItem(`healthsync_db_${key}`, JSON.stringify(dbState[key]));
};

// Observers mapping: collectionName -> Set of callback functions
const observers = {
  centers: new Set(),
  stock: new Set(),
  patients: new Set(),
  attendance: new Set(),
  alerts: new Set()
};

const notifyObservers = (collection) => {
  if (observers[collection]) {
    const dataList = Object.values(dbState[collection]);
    observers[collection].forEach(callback => {
      try {
        callback(dataList);
      } catch (e) {
        console.error("Observer callback error", e);
      }
    });
  }
};

export const firestore = {
  // Real-time listener registration
  onSnapshot: (collectionName, callback) => {
    if (!observers[collectionName]) return () => {};
    observers[collectionName].add(callback);
    
    // Immediate initial call
    callback(Object.values(dbState[collectionName]));
    
    // Return unsubscribe function
    return () => {
      observers[collectionName].delete(callback);
    };
  },

  // Read snapshot once
  getDocs: async (collectionName) => {
    return Object.values(dbState[collectionName]);
  },

  // Update a document
  updateDoc: async (collectionName, docId, data) => {
    if (dbState[collectionName] && dbState[collectionName][docId]) {
      dbState[collectionName][docId] = {
        ...dbState[collectionName][docId],
        ...data,
        updatedAt: new Date().toISOString()
      };
      saveToStorage(collectionName);
      notifyObservers(collectionName);
      return true;
    }
    return false;
  },

  // Add a document
  addDoc: async (collectionName, data) => {
    if (dbState[collectionName]) {
      const newId = `${collectionName.slice(0, 3)}-${Date.now()}`;
      const newDoc = {
        id: newId,
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      };
      dbState[collectionName][newId] = newDoc;
      saveToStorage(collectionName);
      notifyObservers(collectionName);
      return newId;
    }
    throw new Error(`Collection ${collectionName} does not exist.`);
  },

  // Delete a document
  deleteDoc: async (collectionName, docId) => {
    if (dbState[collectionName] && dbState[collectionName][docId]) {
      delete dbState[collectionName][docId];
      saveToStorage(collectionName);
      notifyObservers(collectionName);
      return true;
    }
    return false;
  }
};

export default firestore;
