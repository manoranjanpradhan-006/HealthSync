const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Watches for stock adjustments and issues warning logs if levels cross safety thresholds
exports.monitorStockThresholds = functions.firestore.document("stock/{stockId}")
  .onUpdate(async (change, context) => {
    const afterData = change.after.data();
    const beforeData = change.before.data();

    // Check if it newly crossed threshold
    if (afterData.quantity <= afterData.threshold && beforeData.quantity > afterData.threshold) {
      const db = admin.firestore();
      
      const centerSnap = await db.collection("centers").doc(afterData.centerId).get();
      const cName = centerSnap.exists ? centerSnap.data().centerName : afterData.centerId;

      await db.collection("alerts").add({
        title: "Low Medicine Stock",
        message: `${afterData.medicineName} stock is critical (${afterData.quantity} Units left) at ${cName}`,
        severity: "danger",
        centerId: afterData.centerId,
        resolved: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    return null;
  });
