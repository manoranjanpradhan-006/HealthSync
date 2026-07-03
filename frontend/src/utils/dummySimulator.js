// Real-Time Demo Data Simulator
// Randomly updates Firestore stocks, patient counts, doctor attendance, and bed availability every 5 seconds.
// Triggers threshold checks to automatically generate low stock, doctor shortage, and overcrowding alerts.

import firestore from "../firebase/firestore";

let simulationInterval = null;

const MEDICINES = ["Paracetamol", "Ibuprofen", "ORS"];
const CENTERS = ["phc-a", "phc-b", "chc-c", "phc-d", "chc-e"];

export const startSimulation = (onUpdateNotification) => {
  if (simulationInterval) clearInterval(simulationInterval);

  simulationInterval = setInterval(async () => {
    try {
      // 1. Medicine Decreases
      const stocks = await firestore.getDocs("stock");
      const chosenStock = stocks[Math.floor(Math.random() * stocks.length)];
      if (chosenStock) {
        const decreaseAmount = Math.floor(Math.random() * 8) + 3; // Decrease by 3-10 units
        const newQuantity = Math.max(0, chosenStock.quantity - decreaseAmount);
        
        await firestore.updateDoc("stock", chosenStock.id, { quantity: newQuantity });

        // Trigger Alert if it crosses threshold and doesn't already have an active alert
        if (newQuantity <= chosenStock.threshold) {
          const activeAlerts = await firestore.getDocs("alerts");
          const hasAlert = activeAlerts.some(
            a => a.centerId === chosenStock.centerId && 
                 a.title === "Low Medicine Stock" && 
                 a.message.includes(chosenStock.medicineName) &&
                 !a.resolved
          );

          if (!hasAlert) {
            const centerList = await firestore.getDocs("centers");
            const cName = centerList.find(c => c.id === chosenStock.centerId)?.centerName || chosenStock.centerId;
            await firestore.addDoc("alerts", {
              title: "Low Medicine Stock",
              message: `${chosenStock.medicineName} stock is critical (${newQuantity} Units left) at ${cName}`,
              severity: "danger",
              centerId: chosenStock.centerId,
              resolved: false
            });
            if (onUpdateNotification) onUpdateNotification("Low Medicine Stock alert triggered!");
          }
        }
      }

      // 2. Patient Footfall Increases / Fluctuates
      const patients = await firestore.getDocs("patients");
      const todayStr = "2026-07-03"; // Hardcoded today date for consistent dashboard graphing
      const todayPatients = patients.filter(p => p.date === todayStr);
      
      if (todayPatients.length > 0) {
        const chosenPatientEntry = todayPatients[Math.floor(Math.random() * todayPatients.length)];
        const increaseAmount = Math.floor(Math.random() * 4) + 1; // Increase by 1-4 patients
        const newCount = chosenPatientEntry.count + increaseAmount;
        await firestore.updateDoc("patients", chosenPatientEntry.id, { count: newCount });

        // Check if overcrowding alert is needed
        const center = (await firestore.getDocs("centers")).find(c => c.id === chosenPatientEntry.centerId);
        if (center) {
          const occupancyRate = center.bedsOccupied / center.capacity;
          if (occupancyRate >= 0.90) {
            const activeAlerts = await firestore.getDocs("alerts");
            const hasAlert = activeAlerts.some(a => a.centerId === center.id && a.title === "Overcrowding Alert" && !a.resolved);
            
            if (!hasAlert) {
              await firestore.addDoc("alerts", {
                title: "Overcrowding Alert",
                message: `Patient count has exceeded 90% capacity at ${center.centerName}`,
                severity: "danger",
                centerId: center.id,
                resolved: false
              });
              if (onUpdateNotification) onUpdateNotification("Overcrowding Alert triggered!");
            }
          }
        }
      }

      // 3. Bed Occupancy Fluctuation
      const centers = await firestore.getDocs("centers");
      const chosenCenter = centers[Math.floor(Math.random() * centers.length)];
      if (chosenCenter) {
        const delta = Math.random() > 0.4 ? 1 : -1; // 60% chance of bed occupancy increasing
        const newOccupied = Math.min(chosenCenter.capacity, Math.max(0, chosenCenter.bedsOccupied + delta));
        const newAvailable = chosenCenter.capacity - newOccupied;
        
        await firestore.updateDoc("centers", chosenCenter.id, {
          bedsOccupied: newOccupied,
          bedsAvailable: newAvailable
        });
      }

      // 4. Doctor Absent / Present Fluctuation
      const doctors = await firestore.getDocs("attendance");
      const chosenDoc = doctors[Math.floor(Math.random() * doctors.length)];
      if (chosenDoc) {
        const newStatus = chosenDoc.status === "Present" ? "Absent" : "Present";
        await firestore.updateDoc("attendance", chosenDoc.id, { status: newStatus });

        // Check attendance rate for the center to trigger warnings
        const centerDocs = doctors.filter(d => d.centerId === chosenDoc.centerId);
        // Recalculate present rate based on local mock change
        const presentCount = centerDocs.reduce((sum, d) => sum + (d.id === chosenDoc.id ? (newStatus === "Present" ? 1 : 0) : (d.status === "Present" ? 1 : 0)), 0);
        const presentRate = presentCount / centerDocs.length;

        if (presentRate < 0.70) {
          const activeAlerts = await firestore.getDocs("alerts");
          const hasAlert = activeAlerts.some(a => a.centerId === chosenDoc.centerId && a.title === "Doctor Shortage" && !a.resolved);
          
          if (!hasAlert) {
            const centerList = await firestore.getDocs("centers");
            const cName = centerList.find(c => c.id === chosenDoc.centerId)?.centerName || chosenDoc.centerId;
            await firestore.addDoc("alerts", {
              title: "Doctor Shortage",
              message: `Medical staff presence rate is critical (${Math.round(presentRate * 100)}%) at ${cName}`,
              severity: "warning",
              centerId: chosenDoc.centerId,
              resolved: false
            });
            if (onUpdateNotification) onUpdateNotification("Doctor Shortage alert triggered!");
          }
        }
      }

    } catch (e) {
      console.error("Simulation tick error", e);
    }
  }, 5000);
};

export const stopSimulation = () => {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
};
