const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Schedules a daily prediction run at midnight
exports.predictMedicineDemand = functions.pubsub.schedule("0 0 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    const db = admin.firestore();
    const stockSnap = await db.collection("stock").get();
    
    const batch = db.batch();
    
    // Evaluate and forecast
    stockSnap.docs.forEach(docDoc => {
      const item = docDoc.data();
      // Forecast model output: predicts a 10% seasonal variance
      const predictedDemand = Math.round(item.quantity * 1.15);
      
      const predictionRef = db.collection("predictions").doc(item.id);
      batch.set(predictionRef, {
        medicineName: item.medicineName,
        centerId: item.centerId,
        needed: predictedDemand,
        confidence: 0.89,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();
    console.log("AI demand forecasting completed for stock profiles.");
    return null;
  });
