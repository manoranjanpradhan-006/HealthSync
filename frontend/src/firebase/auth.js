// Simulated Firebase Authentication layer

const DEFAULT_USERS = {
  "admin@healthsync.gov.in": {
    uid: "usr-admin",
    name: "Dr. Srikanth Sharma",
    email: "admin@healthsync.gov.in",
    role: "Admin",
    district: "Anantapur",
    centerId: "all"
  },
  "officer@healthsync.gov.in": {
    uid: "usr-officer",
    name: "Mr. Ramesh Reddy",
    email: "officer@healthsync.gov.in",
    role: "District Officer",
    district: "Anantapur",
    centerId: "all"
  },
  "staff@healthsync.gov.in": {
    uid: "usr-staff",
    name: "Anil Kumar",
    email: "staff@healthsync.gov.in",
    role: "Pharmacist",
    district: "Anantapur",
    centerId: "phc-a"
  },
  "doctor@healthsync.gov.in": {
    uid: "usr-doctor",
    name: "Dr. Rajesh Kumar",
    email: "doctor@healthsync.gov.in",
    role: "Doctor",
    district: "Anantapur",
    centerId: "phc-a"
  }
};

const authListeners = new Set();
let currentUser = null;

// Load current user from session/localStorage if exists
const savedSession = localStorage.getItem("healthsync_auth_user");
if (savedSession) {
  try {
    currentUser = JSON.parse(savedSession);
  } catch (e) {
    console.error("Auth session restore failed", e);
  }
}

const notifyAuthListeners = () => {
  authListeners.forEach(callback => callback(currentUser));
};

export const auth = {
  // Listen to auth state changes
  onAuthStateChanged: (callback) => {
    authListeners.add(callback);
    // Initial sync callback call
    callback(currentUser);
    return () => {
      authListeners.delete(callback);
    };
  },

  // Email login
  signInWithEmailAndPassword: async (email, password) => {
    // Artificial API network latency
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const formattedEmail = email.toLowerCase().trim();
    
    // Check default accounts
    if (DEFAULT_USERS[formattedEmail]) {
      // Basic mock check: password matches name prefix or is '123' suffix
      const passCheck = password.length >= 6; // accept any 6+ char password for hackathon ease
      if (passCheck) {
        currentUser = DEFAULT_USERS[formattedEmail];
        localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
        notifyAuthListeners();
        return currentUser;
      }
    }
    
    // Check registered accounts in localStorage
    const localUsers = JSON.parse(localStorage.getItem("healthsync_db_users") || "{}");
    if (localUsers[formattedEmail] && password.length >= 6) {
      currentUser = localUsers[formattedEmail];
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      notifyAuthListeners();
      return currentUser;
    }

    throw new Error("Invalid credentials. Enter any email from default list (e.g. officer@healthsync.gov.in) with any password >= 6 characters.");
  },

  // Google Login (logs in as a District Officer)
  signInWithGoogle: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    currentUser = {
      uid: "usr-google",
      name: "Dr. Sandeep Singh (Google Auth)",
      email: "sandeep.singh@gmail.com",
      role: "District Officer",
      district: "Anantapur",
      centerId: "all"
    };
    localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
    notifyAuthListeners();
    return currentUser;
  },

  // SignUp simulation
  createUserWithEmailAndPassword: async (email, password, extraData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const formattedEmail = email.toLowerCase().trim();
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    
    const newUser = {
      uid: `usr-${Date.now()}`,
      name: extraData.name || "Healthcare Staff",
      email: formattedEmail,
      role: extraData.role || "Staff",
      district: extraData.district || "Anantapur",
      centerId: extraData.centerId || "phc-a"
    };

    const localUsers = JSON.parse(localStorage.getItem("healthsync_db_users") || "{}");
    localUsers[formattedEmail] = newUser;
    localStorage.setItem("healthsync_db_users", JSON.stringify(localUsers));

    currentUser = newUser;
    localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
    notifyAuthListeners();
    return currentUser;
  },

  // Log out
  signOut: async () => {
    currentUser = null;
    localStorage.removeItem("healthsync_auth_user");
    notifyAuthListeners();
    return true;
  },

  // Retrieve current user sync
  getCurrentUser: () => currentUser
};

export default auth;
