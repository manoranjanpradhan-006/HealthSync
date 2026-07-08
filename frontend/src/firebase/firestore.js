// Simulated real-time Firestore database layer using localStorage and observers
// This allows true multi-panel real-time reactivity without external database setup.
import { 
  collection, 
  onSnapshot as sdkOnSnapshot, 
  addDoc as sdkAddDoc, 
  updateDoc as sdkUpdateDoc, 
  deleteDoc as sdkDeleteDoc,
  doc, 
  getDocs,
  setDoc
} from "firebase/firestore";
import { IS_MOCKED, dbInstance, authInstance } from "./firebase";

const INITIAL_CENTERS = {
  "phc-a": { id: "phc-a", centerName: "PHC Anantapur", type: "PHC", district: "Anantapur", capacity: 100, latitude: 14.6819, longitude: 77.6006, healthScore: 88, bedsAvailable: 45, bedsOccupied: 55, equipmentScore: 92 },
  "phc-b": { id: "phc-b", centerName: "PHC Dharmavaram", type: "PHC", district: "Anantapur", capacity: 80, latitude: 14.4137, longitude: 77.7126, healthScore: 74, bedsAvailable: 12, bedsOccupied: 68, equipmentScore: 78 },
  "chc-c": { id: "chc-c", centerName: "CHC Gooty", type: "CHC", district: "Anantapur", capacity: 150, latitude: 15.1187, longitude: 77.6322, healthScore: 91, bedsAvailable: 90, bedsOccupied: 60, equipmentScore: 88 },
  "phc-d": { id: "phc-d", centerName: "PHC Hindupur", type: "PHC", district: "Anantapur", capacity: 60, latitude: 13.8290, longitude: 77.4930, healthScore: 61, bedsAvailable: 4, bedsOccupied: 56, equipmentScore: 65 },
  "chc-e": { id: "chc-e", centerName: "CHC Kadiri", type: "CHC", district: "Anantapur", capacity: 120, latitude: 14.1166, longitude: 78.1583, healthScore: 82, bedsAvailable: 40, bedsOccupied: 80, equipmentScore: 84 }
};

const INITIAL_STOCK = {
  "stock-1": { id: "stock-1", medicineName: "Paracetamol", quantity: 950, threshold: 200, centerId: "phc-a", last_updated: new Date().toISOString() },
  "stock-2": { id: "stock-2", medicineName: "Ibuprofen", quantity: 450, threshold: 150, centerId: "phc-a", last_updated: new Date().toISOString() },
  "stock-3": { id: "stock-3", medicineName: "ORS", quantity: 20, threshold: 100, centerId: "phc-a", last_updated: new Date().toISOString() },
  
  "stock-4": { id: "stock-4", medicineName: "Paracetamol", quantity: 120, threshold: 200, centerId: "phc-b", last_updated: new Date().toISOString() },
  "stock-5": { id: "stock-5", medicineName: "Ibuprofen", quantity: 280, threshold: 150, centerId: "phc-b", last_updated: new Date().toISOString() },
  "stock-6": { id: "stock-6", medicineName: "ORS", quantity: 340, threshold: 100, centerId: "phc-b", last_updated: new Date().toISOString() },

  "stock-7": { id: "stock-7", medicineName: "Paracetamol", quantity: 600, threshold: 200, centerId: "chc-c", last_updated: new Date().toISOString() },
  "stock-8": { id: "stock-8", medicineName: "Ibuprofen", quantity: 180, threshold: 150, centerId: "chc-c", last_updated: new Date().toISOString() },
  "stock-9": { id: "stock-9", medicineName: "ORS", quantity: 220, threshold: 100, centerId: "chc-c", last_updated: new Date().toISOString() }
};

const INITIAL_PATIENTS = {
  "pat-1": { id: "pat-1", date: "2026-07-03", count: 180, centerId: "phc-a" },
  "pat-2": { id: "pat-2", date: "2026-07-03", count: 210, centerId: "phc-a" },
  "pat-3": { id: "pat-3", date: "2026-07-03", count: 195, centerId: "phc-a" },
  "pat-4": { id: "pat-4", date: "2026-07-03", count: 240, centerId: "phc-a" },
  "pat-5": { id: "pat-5", date: "2026-07-03", count: 225, centerId: "phc-a" },
  "pat-6": { id: "pat-6", date: "2026-07-03", count: 270, centerId: "phc-a" },
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

const FALLBACK_SEEDS = {
  centers: INITIAL_CENTERS,
  stock: INITIAL_STOCK,
  patients: INITIAL_PATIENTS,
  attendance: INITIAL_ATTENDANCE,
  alerts: INITIAL_ALERTS,
  stock_transactions: {},
  consumption_log: {}
};

const isLocalDemoMode = () => {
  if (IS_MOCKED) return true;
  try {
    const user = JSON.parse(localStorage.getItem("healthsync_auth_user"));
    const email = (user?.email || "").toLowerCase().trim();
    return email === "admin@healthsync.gov.in" ||
           email === "officer@healthsync.gov.in" ||
           email === "staff@healthsync.gov.in" ||
           email === "doctor@healthsync.gov.in";
  } catch (e) {
    return false;
  }
};

const getUserScope = () => {
  let localUserUid = null;
  try {
    const user = JSON.parse(localStorage.getItem("healthsync_auth_user"));
    localUserUid = user?.uid;
  } catch (e) {}

  if (!IS_MOCKED) {
    if (localUserUid && (localUserUid.startsWith("usr-") || localUserUid === "usr-admin" || localUserUid === "usr-officer" || localUserUid === "usr-staff" || localUserUid === "usr-doctor")) {
      return localUserUid;
    }
    return authInstance.currentUser?.uid || "anonymous";
  } else {
    return localUserUid || "anonymous";
  }
};

// Helper: Get mock state scoped to user from local storage
const getMockState = (collectionName) => {
  const userId = getUserScope();
  const storageKey = `healthsync_db_${userId}_${collectionName}`;
  const data = localStorage.getItem(storageKey);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(`Error parsing localStorage key ${storageKey}`, e);
    }
  }
  const fallback = FALLBACK_SEEDS[collectionName] || {};
  localStorage.setItem(storageKey, JSON.stringify(fallback));
  return fallback;
};

// Helper: Save mock state scoped to user in local storage
const saveMockState = (collectionName, data) => {
  const userId = getUserScope();
  const storageKey = `healthsync_db_${userId}_${collectionName}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
};

// Observers mapping: collectionName -> Set of callback functions
const observers = {
  centers: new Set(),
  stock: new Set(),
  stock_transactions: new Set(),
  consumption_log: new Set(),
  patients: new Set(),
  attendance: new Set(),
  alerts: new Set()
};

const notifyObservers = (collectionName) => {
  if (observers[collectionName]) {
    const mockState = getMockState(collectionName);
    const dataList = Object.values(mockState);
    observers[collectionName].forEach(callback => {
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
    if (!isLocalDemoMode()) {
      const userId = getUserScope();
      // Sandbox collection under /users/{userId}/{collectionName}
      const colRef = collection(dbInstance, "users", userId, collectionName);
      
      return sdkOnSnapshot(colRef, (snapshot) => {
        const items = [];
        snapshot.forEach(docSnap => {
          items.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
        callback(items);
      });
    } else {
      if (!observers[collectionName]) return () => {};
      observers[collectionName].add(callback);
      
      // Immediate initial call
      const mockState = getMockState(collectionName);
      callback(Object.values(mockState));
      
      // Return unsubscribe function
      return () => {
        observers[collectionName].delete(callback);
      };
    }
  },

  // Read snapshot once
  getDocs: async (collectionName) => {
    if (!isLocalDemoMode()) {
      const userId = getUserScope();
      const colRef = collection(dbInstance, "users", userId, collectionName);
      const snapshot = await getDocs(colRef);
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      return items;
    } else {
      const mockState = getMockState(collectionName);
      return Object.values(mockState);
    }
  },

  // Update a document
  updateDoc: async (collectionName, docId, data) => {
    let mergedData = { ...data };
    if (collectionName === "stock") {
      if (data.name !== undefined) mergedData.medicineName = data.name;
      if (data.medicineName !== undefined) mergedData.name = data.medicineName;
      if (data.total_quantity !== undefined) mergedData.quantity = data.total_quantity;
      if (data.quantity !== undefined) mergedData.total_quantity = data.quantity;
      if (data.hospital_id !== undefined) mergedData.centerId = data.hospital_id;
      if (data.centerId !== undefined) mergedData.hospital_id = data.centerId;
      if (data.last_updated !== undefined) mergedData.updatedAt = data.last_updated;
      if (data.updatedAt !== undefined) mergedData.last_updated = data.updatedAt;
      if (data.expiry_date !== undefined) mergedData.expiryDate = data.expiry_date;
      if (data.expiryDate !== undefined) mergedData.expiry_date = data.expiryDate;
      if (mergedData.medicine_id === undefined) mergedData.medicine_id = docId;
    }

    const updatedAtStr = mergedData.updatedAt || new Date().toISOString();
    const lastUpdatedStr = mergedData.last_updated || new Date().toISOString();

    if (!isLocalDemoMode()) {
      const userId = getUserScope();
      const docRef = doc(dbInstance, "users", userId, collectionName, docId);
      await sdkUpdateDoc(docRef, {
        ...mergedData,
        updatedAt: updatedAtStr,
        last_updated: lastUpdatedStr
      });
      return true;
    } else {
      const mockState = getMockState(collectionName);
      if (mockState[docId]) {
        mockState[docId] = {
          ...mockState[docId],
          ...mergedData,
          updatedAt: updatedAtStr,
          last_updated: lastUpdatedStr
        };
        saveMockState(collectionName, mockState);
        notifyObservers(collectionName);
        return true;
      }
      return false;
    }
  },

  // Add a document
  addDoc: async (collectionName, data) => {
    let mergedData = { ...data };
    if (collectionName === "stock") {
      if (data.name !== undefined) mergedData.medicineName = data.name;
      if (data.medicineName !== undefined) mergedData.name = data.medicineName;
      if (data.total_quantity !== undefined) mergedData.quantity = data.total_quantity;
      if (data.quantity !== undefined) mergedData.total_quantity = data.quantity;
      if (data.hospital_id !== undefined) mergedData.centerId = data.hospital_id;
      if (data.centerId !== undefined) mergedData.hospital_id = data.centerId;
      if (data.last_updated !== undefined) mergedData.updatedAt = data.last_updated;
      if (data.updatedAt !== undefined) mergedData.last_updated = data.updatedAt;
      if (data.expiry_date !== undefined) mergedData.expiryDate = data.expiry_date;
      if (data.expiryDate !== undefined) mergedData.expiry_date = data.expiryDate;
    }

    const timestampStr = data.timestamp || new Date().toISOString();

    if (!isLocalDemoMode()) {
      const userId = getUserScope();
      if (data.id) {
        await setDoc(doc(dbInstance, "users", userId, collectionName, data.id), {
          ...mergedData,
          timestamp: timestampStr
        });
        return data.id;
      } else {
        const colRef = collection(dbInstance, "users", userId, collectionName);
        const docRef = await sdkAddDoc(colRef, {
          ...mergedData,
          timestamp: timestampStr
        });
        return docRef.id;
      }
    } else {
      const mockState = getMockState(collectionName);
      const newId = data.id || `${collectionName.slice(0, 3)}-${Date.now()}`;
      if (collectionName === "stock") {
        mergedData.medicine_id = newId;
      }
      const newDoc = {
        id: newId,
        ...mergedData,
        timestamp: timestampStr
      };
      mockState[newId] = newDoc;
      saveMockState(collectionName, mockState);
      notifyObservers(collectionName);
      return newId;
    }
  },

  // Delete a document
  deleteDoc: async (collectionName, docId) => {
    if (!isLocalDemoMode()) {
      const userId = getUserScope();
      const docRef = doc(dbInstance, "users", userId, collectionName, docId);
      await sdkDeleteDoc(docRef);
      return true;
    } else {
      const mockState = getMockState(collectionName);
      if (mockState[docId]) {
        delete mockState[docId];
        saveMockState(collectionName, mockState);
        notifyObservers(collectionName);
        return true;
      }
      return false;
    }
  }
};

export default firestore;
