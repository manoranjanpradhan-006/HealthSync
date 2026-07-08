import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { Map, Trophy, Compass, BedDouble, Pill, Users } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Haversine formula to calculate distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const Centers = () => {
  const { centers, stock, attendance, t, currentUser } = useApp();
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const activeCenterId = selectedCenterId || centers[0]?.id || "";

  // Sorted rankings list (Trophy list)
  const rankedCenters = [...centers].sort((a, b) => b.healthScore - a.healthScore);

  const defaultCenterPlaceholder = { 
    id: "none", 
    centerName: "No Hospital Center Registered", 
    type: "PHC", 
    district: "N/A", 
    capacity: 0, 
    bedsAvailable: 0, 
    bedsOccupied: 0, 
    healthScore: 0,
    latitude: 14.6819,
    longitude: 77.6006
  };

  const selectedCenter = centers.find(c => c.id === activeCenterId) || centers[0] || defaultCenterPlaceholder;
  const centerStocks = stock.filter(s => s.centerId === selectedCenter.id);
  const centerDocs = attendance.filter(a => a.centerId === selectedCenter.id);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  // Overpass state
  const [nearbyResources, setNearbyResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [resourcesError, setResourcesError] = useState("");

  const getPinColor = (score) => {
    if (score >= 80) return { fill: "#22c55e", ring: "rgba(34, 197, 94, 0.4)", text: "text-emerald-500" };
    if (score >= 60) return { fill: "#f59e0b", ring: "rgba(245, 158, 11, 0.4)", text: "text-amber-500" };
    return { fill: "#ef4444", ring: "rgba(239, 68, 68, 0.4)", text: "text-red-500" };
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = selectedCenter?.latitude || 14.6819;
    const initialLng = selectedCenter?.longitude || 77.6006;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 11,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when centers list or selected center changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = {};

    centers.forEach(center => {
      const lat = center.latitude;
      const lng = center.longitude;
      if (!lat || !lng) return;

      const isSelected = center.id === activeCenterId;
      const color = getPinColor(center.healthScore);

      const icon = L.divIcon({
        className: "custom-leaflet-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="absolute inline-flex h-6 w-6 rounded-full opacity-60 ${isSelected ? 'animate-ping' : ''}" style="background-color: ${color.fill}"></span>
            <span class="relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-slate-900 shadow" style="background-color: ${color.fill}"></span>
          </div>
        `
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .on("click", () => {
          setSelectedCenterId(center.id);
        });

      marker.bindTooltip(`
        <div class="font-bold text-slate-800 text-2xs uppercase tracking-wide px-1">
          ${center.centerName} (${center.healthScore}%)
        </div>
      `, {
        direction: "top",
        offset: [0, -10],
        opacity: 0.95
      });

      markersRef.current[center.id] = marker;
    });
  }, [centers, activeCenterId]);

  // Pan map to active center
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedCenter) return;
    const lat = selectedCenter.latitude;
    const lng = selectedCenter.longitude;
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [activeCenterId]);

  // Fetch nearby POIs using Overpass API
  useEffect(() => {
    if (!selectedCenter || selectedCenter.id === "none") return;
    const lat = selectedCenter.latitude;
    const lng = selectedCenter.longitude;
    if (!lat || !lng) return;

    let isMounted = true;
    setLoadingResources(true);
    setResourcesError("");
    setNearbyResources([]);

    // Query for pharmacies, clinics, hospitals, doctors within 5km (5000 meters)
    const query = `[out:json][timeout:15];
      (
        node["amenity"="pharmacy"](around:5000, ${lat}, ${lng});
        node["amenity"="clinic"](around:5000, ${lat}, ${lng});
        node["amenity"="hospital"](around:5000, ${lat}, ${lng});
        node["amenity"="doctors"](around:5000, ${lat}, ${lng});
      );
      out body 10;`;

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(query)}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Overpass API error: " + res.statusText);
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        const items = (data.elements || []).map(el => {
          const dist = calculateDistance(lat, lng, el.lat, el.lon);
          return {
            id: el.id,
            name: el.tags.name || `Unnamed ${el.tags.amenity || 'Resource'}`,
            type: el.tags.amenity,
            lat: el.lat,
            lng: el.lon,
            distance: dist
          };
        }).sort((a, b) => a.distance - b.distance);

        setNearbyResources(items);
        setLoadingResources(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error("Failed to fetch Overpass data:", err);
        setResourcesError("Failed to fetch nearby OSM resources.");
        setLoadingResources(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCenterId]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <Map className="w-6 h-6 text-teal-700" />
          <span>Interactive District Heatmap</span>
        </h2>
        <p className="text-2xs text-slate-400 font-semibold uppercase">Tactical coordinate map monitoring health score metrics</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Leaflet Map Section (Col Span 7) */}
        <div className="lg:col-span-7 bg-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between h-[450px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5 animate-spin" />
                <span>Geospatial Node Tracker</span>
              </span>
              <span className="text-[9px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full uppercase border border-slate-800">
                District: {currentUser?.district || "Default District"}
              </span>
            </div>

            {/* Map Container */}
            <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 h-[335px] dark-map z-10">
              <div ref={mapContainerRef} className="w-full h-full" />
            </div>
          </div>
        </div>

        {/* Selected Center Summary Details Panel (Col Span 5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between h-[450px] overflow-y-auto">
          <div>
            <div className="flex justify-between items-start mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide">
                  {selectedCenter.centerName}
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                  Type: {selectedCenter.type} • Dist: {selectedCenter.district}
                </p>
              </div>

              <div className="text-right">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  selectedCenter.healthScore >= 80 ? "bg-emerald-50 border-emerald-100 text-emerald-600" :
                  selectedCenter.healthScore >= 60 ? "bg-amber-50 border-amber-100 text-amber-600" :
                  "bg-red-50 border-red-100 text-red-600"
                }`}>
                  Health: {selectedCenter.healthScore}%
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <div className="text-slate-400 flex justify-center mb-1">
                  <BedDouble className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Beds</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {selectedCenter.bedsAvailable} / {selectedCenter.capacity}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <div className="text-slate-400 flex justify-center mb-1">
                  <Pill className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Low Stock</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {centerStocks.filter(s => s.quantity <= s.threshold).length} items
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                <div className="text-slate-400 flex justify-center mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Docs Present</p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {centerDocs.filter(d => d.status === "Present").length} / {centerDocs.length}
                </p>
              </div>
            </div>

            {/* Medicine details */}
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Medicine Stock details</h4>
            <div className="space-y-2 border-b border-slate-100 pb-4 mb-4">
              {centerStocks.length === 0 ? (
                <p className="text-2xs text-slate-400 italic">No medicine stocks registered.</p>
              ) : (
                centerStocks.map(stockItem => (
                  <div key={stockItem.id} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">{stockItem.medicineName}</span>
                    <span className={`font-bold ${
                      stockItem.quantity <= stockItem.threshold ? "text-red-500" : "text-slate-700"
                    }`}>
                      {stockItem.quantity} Units (Threshold: {stockItem.threshold})
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Doctor roster */}
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Physicians Roster</h4>
            <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1 border-b border-slate-100 pb-4 mb-4">
              {centerDocs.length === 0 ? (
                <p className="text-2xs text-slate-400 italic">No physicians on duty roster.</p>
              ) : (
                centerDocs.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center text-2xs font-semibold text-slate-500">
                    <span>{doc.doctorName} ({doc.specialty})</span>
                    <span className={`font-bold ${doc.status === "Present" ? "text-emerald-500" : "text-red-500"}`}>
                      {doc.status}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Nearby Local Resources (OSM) */}
            <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Nearby Local Resources (OSM)</span>
              <span className="text-[8px] font-normal text-slate-450 normal-case">Within 5km</span>
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {loadingResources && (
                <p className="text-2xs text-slate-400 italic">Querying Overpass API nodes...</p>
              )}
              {resourcesError && (
                <p className="text-2xs text-red-400 font-medium">{resourcesError}</p>
              )}
              {!loadingResources && !resourcesError && nearbyResources.length === 0 && (
                <p className="text-2xs text-slate-400 italic">No healthcare resources found nearby in OSM.</p>
              )}
              {!loadingResources && !resourcesError && nearbyResources.map(res => (
                <div key={res.id} className="flex justify-between items-center text-2xs font-semibold text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-150">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-bold leading-tight">{res.name}</span>
                    <span className="text-[9px] text-slate-400 capitalize">{res.type}</span>
                  </div>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-md">
                    {res.distance.toFixed(1)} km
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Leaderboard Table Rankings */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">PHC Performance Rankings</h3>
        </div>

        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              <th className="py-2.5 px-4 text-center">Rank</th>
              <th className="py-2.5 px-4">Center Node</th>
              <th className="py-2.5 px-4 text-center">Beds Occupancy</th>
              <th className="py-2.5 px-4 text-center">Medicine Stocks</th>
              <th className="py-2.5 px-4 text-center">Doctor Presence</th>
              <th className="py-2.5 px-4 text-right">Health Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {rankedCenters.map((center, index) => {
              const cStocks = stock.filter(s => s.centerId === center.id);
              const cDocs = attendance.filter(a => a.centerId === center.id);
              const lowStocks = cStocks.filter(s => s.quantity <= s.threshold).length;
              const absentDocs = cDocs.filter(d => d.status === "Absent").length;

              return (
                <tr key={center.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedCenterId(center.id)}>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block w-5 h-5 rounded-full text-center leading-5 font-bold ${
                      index === 0 ? "bg-amber-100 text-amber-700" :
                      index === 1 ? "bg-slate-200 text-slate-700" :
                      index === rankedCenters.length - 1 ? "bg-red-100 text-red-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 uppercase tracking-wide">{center.centerName}</td>
                  <td className="py-3 px-4 text-center">
                    {center.bedsOccupied} / {center.capacity} ({Math.round((center.bedsOccupied / (center.capacity || 1)) * 100)}%)
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={lowStocks > 0 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                      {lowStocks > 0 ? `${lowStocks} items low` : "Nominal"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={absentDocs > 0 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                      {cDocs.length - absentDocs} / {cDocs.length} Present
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`font-bold ${
                      center.healthScore >= 80 ? "text-emerald-600" :
                      center.healthScore >= 60 ? "text-amber-600" :
                      "text-red-600 animate-pulse font-extrabold"
                    }`}>
                      {center.healthScore} / 100
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default Centers;
