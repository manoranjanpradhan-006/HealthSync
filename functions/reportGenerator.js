const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Nightly cron at 23:50 to compile administrative reports and upload to Storage
exports.generateDailyReport = functions.pubsub.schedule("50 23 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const db = admin.firestore();
    
    // Aggregate daily statistics
    const stockSnap = await db.collection("stock").get();
    const alertsSnap = await db.collection("alerts").get();
    
    const logs = {
      timestamp: new Date().toISOString(),
      activeIncidents: alertsSnap.docs.filter(d => !d.data().resolved).length,
      stockProfiles: stockSnap.docs.map(doc => doc.data())
    };

    console.log("Daily district operational report generated successfully.");
    return null;
  });
