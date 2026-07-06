import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc
} from "firebase/firestore";
import readline from "readline";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1YDP5rdP9jEQoHMg0h9pYxJiUJeR5zfo",
  authDomain: "hospital-management-syst-3bdbc.firebaseapp.com",
  projectId: "hospital-management-syst-3bdbc",
  storageBucket: "hospital-management-syst-3bdbc.firebasestorage.app",
  messagingSenderId: "784410643245",
  appId: "1:784410643245:web:07236f43746ea86e1461a4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log("=== Health Sync Firestore Cleanup Utility ===");
  console.log("This script will log in and remove references to 'Anantapur' from your Firestore data.");
  
  const email = await question("Enter Email [default: admin@healthsync.gov.in]: ");
  const targetEmail = email.trim() || "admin@healthsync.gov.in";
  
  const password = await question("Enter Password: ");
  if (!password) {
    console.error("Password is required.");
    rl.close();
    return;
  }

  console.log("\nLogging in...");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
    const userId = userCredential.user.uid;
    console.log(`Successfully logged in. User UID: ${userId}`);

    // 1. Update user profile document at /users/{userId}
    console.log("\nChecking user profile...");
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.district === "Anantapur") {
        await updateDoc(userDocRef, { district: "Default District" });
        console.log("Updated user profile district to 'Default District'.");
      } else {
        console.log(`User profile district is already '${userData.district || "none"}'.`);
      }
    }

    const collections = [
      "centers",
      "stock",
      "stock_transactions",
      "consumption_log",
      "patients",
      "attendance",
      "alerts"
    ];

    for (const colName of collections) {
      console.log(`\nScanning collection: ${colName}...`);
      const colRef = collection(db, "users", userId, colName);
      const snapshot = await getDocs(colRef);
      
      let deletedCount = 0;
      let updatedCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const docId = docSnap.id;

        // Check if any field value contains 'anantapur' (case-insensitive)
        let hasAnantapur = false;
        let isCenterNameMatch = false;

        for (const [key, val] of Object.entries(data)) {
          if (typeof val === "string" && val.toLowerCase().includes("anantapur")) {
            hasAnantapur = true;
            if (key === "centerName" || key === "name") {
              isCenterNameMatch = true;
            }
          }
        }

        if (hasAnantapur) {
          // If it is a center document or critical relation, we delete it
          if (colName === "centers" || colName === "alerts" || colName === "stock" || colName === "stock_transactions" || colName === "consumption_log") {
            await deleteDoc(doc(db, "users", userId, colName, docId));
            console.log(`[-] Deleted doc ${docId} in '${colName}' (contained Anantapur)`);
            deletedCount++;
          } else {
            // For other docs, we can try to clean the field or delete
            await deleteDoc(doc(db, "users", userId, colName, docId));
            console.log(`[-] Deleted doc ${docId} in '${colName}'`);
            deletedCount++;
          }
        }
      }

      console.log(`Finished ${colName}: Deleted ${deletedCount}, Updated ${updatedCount}`);
    }

    console.log("\nDatabase cleanup complete.");
  } catch (error) {
    console.error("Error during cleanup:", error.message);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
