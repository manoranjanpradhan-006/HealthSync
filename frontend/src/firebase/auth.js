import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword as sdkSignIn, 
  signOut as sdkSignOut, 
  createUserWithEmailAndPassword as sdkCreateUser,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { IS_MOCKED, authInstance, dbInstance } from "./firebase";

const DEFAULT_USERS = {
  "admin@healthsync.gov.in": {
    uid: "usr-admin",
    name: "Dr. Srikanth Sharma",
    email: "admin@healthsync.gov.in",
    role: "Admin",
    district: "Default District",
    centerId: "all"
  },
  "officer@healthsync.gov.in": {
    uid: "usr-officer",
    name: "Mr. Ramesh Reddy",
    email: "officer@healthsync.gov.in",
    role: "District Officer",
    district: "Default District",
    centerId: "all"
  },
  "staff@healthsync.gov.in": {
    uid: "usr-staff",
    name: "Anil Kumar",
    email: "staff@healthsync.gov.in",
    role: "Pharmacist",
    district: "Default District",
    centerId: ""
  },
  "doctor@healthsync.gov.in": {
    uid: "usr-doctor",
    name: "Dr. Rajesh Kumar",
    email: "doctor@healthsync.gov.in",
    role: "Doctor",
    district: "Default District",
    centerId: ""
  }
};

const isDemoEmail = (email) => {
  const formatted = (email || "").toLowerCase().trim();
  return !!DEFAULT_USERS[formatted];
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
    callback(currentUser);

    if (!IS_MOCKED) {
      const unsub = onAuthStateChanged(authInstance, async (firebaseUser) => {
        if (firebaseUser) {
          const emailLower = (firebaseUser.email || "").toLowerCase().trim();
          if (isDemoEmail(emailLower)) {
            currentUser = DEFAULT_USERS[emailLower];
            localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
          } else {
            try {
              const userDocRef = doc(dbInstance, "users", firebaseUser.uid);
              const userSnapshot = await getDoc(userDocRef);
              
              if (userSnapshot.exists()) {
                currentUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  ...userSnapshot.data()
                };
              } else {
                // Fallback defaults if user was manually added in the console and has no Firestore profile doc
                let role = "Staff";
                let centerId = "";
                if (emailLower.includes("admin")) {
                  role = "Admin";
                  centerId = "all";
                } else if (emailLower.includes("officer")) {
                  role = "District Officer";
                  centerId = "all";
                }
                
                currentUser = {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
                  role,
                  district: "Default District",
                  centerId
                };
                
                // Persist fallback to Firestore
                await setDoc(userDocRef, {
                  name: currentUser.name,
                  role: currentUser.role,
                  district: currentUser.district,
                  centerId: currentUser.centerId
                });
              }
            } catch (e) {
              console.error("Firestore user profile retrieval error:", e);
              currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.email.split("@")[0],
                role: "Staff",
                district: "Default District",
                centerId: ""
              };
            }
          }
        } else {
          // If firebaseUser is null but local currentUser is a demo user, keep them logged in
          const isDemo = currentUser && isDemoEmail(currentUser.email);
          if (!isDemo) {
            currentUser = null;
          }
        }
        notifyAuthListeners();
      });
      return () => {
        authListeners.delete(callback);
        unsub();
      };
    } else {
      return () => {
        authListeners.delete(callback);
      };
    }
  },

  // Email login
  signInWithEmailAndPassword: async (email, password) => {
    const formattedEmail = email.toLowerCase().trim();
    
    if (isDemoEmail(formattedEmail)) {
      // Set no authentication: bypass Firebase Auth check for demo accounts!
      const demoUser = DEFAULT_USERS[formattedEmail];
      if (!IS_MOCKED) {
        try {
          // Attempt under-the-hood sign-in with default passwords to establish active Firebase session
          const defaultPasswords = {
            "admin@healthsync.gov.in": "admin123",
            "officer@healthsync.gov.in": "officer123",
            "staff@healthsync.gov.in": "staff123",
            "doctor@healthsync.gov.in": "doctor123"
          };
          await sdkSignIn(authInstance, formattedEmail, defaultPasswords[formattedEmail]);
        } catch (e) {
          console.warn("Under-the-hood Firebase sign-in failed for demo user, falling back to mock bypass:", e);
          try {
            await sdkSignOut(authInstance);
          } catch (err) {}
        }
      }
      currentUser = demoUser;
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      notifyAuthListeners();
      return currentUser;
    }
    
    if (!IS_MOCKED) {
      const userCredential = await sdkSignIn(authInstance, formattedEmail, password);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(dbInstance, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userSnapshot.data()
        };
      } else {
        const emailLower = formattedEmail;
        let role = "Staff";
        let centerId = "";
        if (emailLower.includes("admin")) {
          role = "Admin";
          centerId = "all";
        } else if (emailLower.includes("officer")) {
          role = "District Officer";
          centerId = "all";
        }
        
        currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || formattedEmail.split("@")[0],
          role,
          district: "Default District",
          centerId
        };
        
        await setDoc(userDocRef, {
          name: currentUser.name,
          role: currentUser.role,
          district: currentUser.district,
          centerId: currentUser.centerId
        });
      }
      
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      return currentUser;
    } else {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const localUsers = JSON.parse(localStorage.getItem("healthsync_db_users") || "{}");
      if (localUsers[formattedEmail] && password.length >= 6) {
        currentUser = localUsers[formattedEmail];
        localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
        notifyAuthListeners();
        return currentUser;
      }
      
      throw new Error("Invalid credentials. Try registering a new account or using demo login.");
    }
  },

  // Google Login (logs in as a District Officer)
  signInWithGoogle: async () => {
    if (!IS_MOCKED) {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(authInstance, provider);
      const firebaseUser = userCredential.user;
      
      const userDocRef = doc(dbInstance, "users", firebaseUser.uid);
      const userSnapshot = await getDoc(userDocRef);
      
      if (userSnapshot.exists()) {
        currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userSnapshot.data()
        };
      } else {
        currentUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          role: "District Officer", // Default role for new Google sign-in
          district: "Default District",
          centerId: "all"
        };
        await setDoc(userDocRef, {
          name: currentUser.name,
          role: currentUser.role,
          district: currentUser.district,
          centerId: currentUser.centerId
        });
      }
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      return currentUser;
    } else {
      await new Promise(resolve => setTimeout(resolve, 600));
      currentUser = {
        uid: "usr-google",
        name: "Dr. Sandeep Singh (Google Auth)",
        email: "sandeep.singh@gmail.com",
        role: "District Officer",
        district: "Default District",
        centerId: "all"
      };
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      notifyAuthListeners();
      return currentUser;
    }
  },

  // SignUp simulation
  createUserWithEmailAndPassword: async (email, password, extraData) => {
    const formattedEmail = email.toLowerCase().trim();
    if (isDemoEmail(formattedEmail)) {
      throw new Error("Registration for demo accounts is disabled. Please use a different email address.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    
    if (!IS_MOCKED) {
      const userCredential = await sdkCreateUser(authInstance, formattedEmail, password);
      const firebaseUser = userCredential.user;
      
      const profile = {
        name: extraData.name || "Healthcare Staff",
        role: extraData.role || "Staff",
        district: extraData.district || "Default District",
        centerId: extraData.centerId || ""
      };

      await setDoc(doc(dbInstance, "users", firebaseUser.uid), profile);

      currentUser = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...profile
      };

      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      return currentUser;
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newUser = {
        uid: `usr-${Date.now()}`,
        name: extraData.name || "Healthcare Staff",
        email: formattedEmail,
        role: extraData.role || "Staff",
        district: extraData.district || "Default District",
        centerId: extraData.centerId || ""
      };

      const localUsers = JSON.parse(localStorage.getItem("healthsync_db_users") || "{}");
      localUsers[formattedEmail] = newUser;
      localStorage.setItem("healthsync_db_users", JSON.stringify(localUsers));

      currentUser = newUser;
      localStorage.setItem("healthsync_auth_user", JSON.stringify(currentUser));
      notifyAuthListeners();
      return currentUser;
    }
  },

  // Log out
  signOut: async () => {
    if (!IS_MOCKED) {
      await sdkSignOut(authInstance);
    }
    currentUser = null;
    localStorage.removeItem("healthsync_auth_user");
    notifyAuthListeners();
    return true;
  },

  // Retrieve current user sync
  getCurrentUser: () => currentUser
};

export default auth;
