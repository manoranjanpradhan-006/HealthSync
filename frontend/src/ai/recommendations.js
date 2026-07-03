// AI Resource Redistribution and Transfer Engine
// Dynamically scans stock and bed allocations to recommend optimized resource movement.

export const generateRedistributionSuggestions = (stocks, centers) => {
  const recommendations = [];

  // Group stocks by medicine
  const stocksByMed = {};
  stocks.forEach(item => {
    if (!stocksByMed[item.medicineName]) {
      stocksByMed[item.medicineName] = [];
    }
    stocksByMed[item.medicineName].push(item);
  });

  // Check each medicine for shortages and surpluses
  Object.keys(stocksByMed).forEach(medName => {
    const items = stocksByMed[medName];
    const shortages = items.filter(i => i.quantity <= i.threshold);
    const surpluses = items.filter(i => i.quantity > i.threshold * 2);

    shortages.forEach(shortItem => {
      // Find a center with surplus for the same medicine in the same district if possible
      const targetCenter = centers.find(c => c.id === shortItem.centerId);
      if (!targetCenter) return;

      const supplier = surpluses.find(surpItem => {
        const supplierCenter = centers.find(c => c.id === surpItem.centerId);
        return supplierCenter && supplierCenter.district === targetCenter.district && surpItem.quantity > surpItem.threshold * 2;
      });

      if (supplier) {
        const supplyCenter = centers.find(c => c.id === supplier.centerId);
        // Suggest transferring half of the surplus, up to what's needed to cross threshold
        const surplusAmount = supplier.quantity - supplier.threshold;
        const deficitAmount = (shortItem.threshold * 1.5) - shortItem.quantity;
        const transferAmount = Math.min(Math.round(surplusAmount / 2), Math.round(deficitAmount));

        if (transferAmount > 10) {
          recommendations.push({
            id: `rec-stock-${shortItem.id}-${supplier.id}`,
            type: "stock",
            medicineName: medName,
            amount: transferAmount,
            fromCenterId: supplier.centerId,
            fromCenterName: supplyCenter.centerName,
            toCenterId: shortItem.centerId,
            toCenterName: targetCenter.centerName,
            urgency: shortItem.quantity < shortItem.threshold * 0.3 ? "critical" : "high",
            description: `Transfer ${transferAmount} units of ${medName} from ${supplyCenter.centerName} to ${targetCenter.centerName} to restore minimum threshold safety.`
          });
        }
      }
    });
  });

  // Check bed capacities
  const fullCenters = centers.filter(c => (c.bedsOccupied / c.capacity) >= 0.85);
  const emptyCenters = centers.filter(c => (c.bedsOccupied / c.capacity) < 0.50);

  fullCenters.forEach(fullCenter => {
    // Find an empty center in the same district
    const helper = emptyCenters.find(emptyCenter => emptyCenter.district === fullCenter.district);
    if (helper) {
      const emptyBeds = helper.capacity - helper.bedsOccupied;
      const redirectCount = Math.min(Math.round(emptyBeds * 0.4), 15);
      if (redirectCount > 2) {
        recommendations.push({
          id: `rec-bed-${fullCenter.id}-${helper.id}`,
          type: "beds",
          amount: redirectCount,
          fromCenterId: fullCenter.id,
          fromCenterName: fullCenter.centerName,
          toCenterId: helper.id,
          toCenterName: helper.centerName,
          urgency: (fullCenter.bedsOccupied / fullCenter.capacity) >= 0.95 ? "critical" : "medium",
          description: `Redirect incoming non-critical patients (${redirectCount} estimated) from ${fullCenter.centerName} (occupancy ${Math.round((fullCenter.bedsOccupied / fullCenter.capacity) * 100)}%) to ${helper.centerName} (${helper.bedsAvailable} beds currently empty).`
        });
      }
    }
  });

  return recommendations;
};

// Calculates an overall operational health score (0-100) for a center
export const calculateCenterHealthScore = (centerId, stocks, attendance, center) => {
  if (!center) return 80;
  
  // 1. Medicine stock score (35 points)
  const centerStocks = stocks.filter(s => s.centerId === centerId);
  let stockScore = 35;
  if (centerStocks.length > 0) {
    const lowStockCount = centerStocks.filter(s => s.quantity <= s.threshold).length;
    const ratio = (centerStocks.length - lowStockCount) / centerStocks.length;
    stockScore = ratio * 35;
  }

  // 2. Doctor attendance score (35 points)
  const centerDocs = attendance.filter(a => a.centerId === centerId);
  let docScore = 35;
  if (centerDocs.length > 0) {
    const presentCount = centerDocs.filter(d => d.status === "Present").length;
    const ratio = presentCount / centerDocs.length;
    docScore = ratio * 35;
  }

  // 3. Bed availability score (30 points)
  // Optimal occupancy is between 40% and 80%. Critical occupancy > 90% or underutilization.
  const occupancy = center.bedsOccupied / center.capacity;
  let bedScore = 30;
  if (occupancy > 0.90) {
    bedScore = (1 - occupancy) * 10 * 3; // Penalize heavy overload
  } else if (occupancy < 0.10) {
    bedScore = 15; // Mild penalty for complete underutilization
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(stockScore + docScore + bedScore)));
  return finalScore;
};
