import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { FileDown, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";

export const Reports = () => {
  const { stock, alerts, attendance, t } = useApp();
  const [downloadingId, setDownloadingId] = useState(null);

  // Function to download a text file as CSV
  const triggerCSVDownload = (filename, dataHeaders, rowsArray) => {
    const csvContent = [
      dataHeaders.join(","),
      ...rowsArray.map(row => row.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = async (reportType) => {
    setDownloadingId(reportType);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate generation lag

    if (reportType === "medicine-stock") {
      const headers = ["Medicine Name", "Quantity Left", "Safety Threshold", "Node Assignment"];
      const rows = stock.map(s => [s.medicineName, s.quantity, s.threshold, s.centerId]);
      triggerCSVDownload("HealthSync_Medicine_Stock_Report.csv", headers, rows);
    } 
    else if (reportType === "alerts-log") {
      const headers = ["Title", "Log Message", "Severity", "Timestamp", "Resolved Status"];
      const rows = alerts.map(a => [a.title, a.message, a.severity, a.timestamp, a.resolved ? "Resolved" : "Active"]);
      triggerCSVDownload("HealthSync_Critical_Incident_Logs.csv", headers, rows);
    } 
    else if (reportType === "attendance") {
      const headers = ["Physician Name", "Specialty", "Current Shift Status", "Log Date"];
      const rows = attendance.map(a => [a.doctorName, a.specialty, a.status, a.date]);
      triggerCSVDownload("HealthSync_Medical_Staff_Attendance.csv", headers, rows);
    }

    setDownloadingId(null);
  };

  const reportCards = [
    {
      id: "medicine-stock",
      title: "Daily Medicine Inventory Ledger",
      desc: "Aggregate stock balances, threshold deficits, and pending logistics requests across all PHCs.",
      format: "CSV / Spreadsheet",
      icon: FileSpreadsheet,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100"
    },
    {
      id: "alerts-log",
      title: "District Critical Incidents Audit Log",
      desc: "Historical incident records, severity markers, mitigation rates, and auto-correction logs.",
      format: "CSV / Excel Log",
      icon: FileText,
      color: "text-red-600 bg-red-50 border-red-100"
    },
    {
      id: "attendance",
      title: "Weekly Medical Staff Attendance Ledger",
      desc: "Physician roster records, check-in timelines, absent warnings, and specialty allocations.",
      format: "CSV / Spreadsheet",
      icon: FileDown,
      color: "text-teal-600 bg-teal-50 border-teal-100"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center space-x-2">
          <FileText className="w-6 h-6 text-teal-700" />
          <span>Government Reports Generator</span>
        </h2>
        <p className="text-2xs text-slate-400 font-semibold uppercase">Export audit ledgers and AI statistics datasets instantly</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map(rep => {
          const Icon = rep.icon;
          const isDownloading = downloadingId === rep.id;
          return (
            <div 
              key={rep.id} 
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className={`p-2.5 rounded-xl border w-fit ${rep.color} mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-1.5">{rep.title}</h3>
                <p className="text-2xs text-slate-400 font-semibold leading-relaxed mb-4">{rep.desc}</p>
              </div>

              <div>
                <div className="flex justify-between items-center text-3xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  <span>Export Format:</span>
                  <span className="text-slate-500">{rep.format}</span>
                </div>

                <button
                  onClick={() => handleDownload(rep.id)}
                  disabled={downloadingId !== null}
                  className={`w-full py-2 rounded-xl text-2xs font-extrabold uppercase tracking-wider border shadow-sm transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    isDownloading 
                      ? "bg-slate-50 text-slate-400 border-slate-200" 
                      : "bg-teal-700 hover:bg-teal-800 text-white border-teal-600 hover:border-teal-700"
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isDownloading ? "Generating CSV Report..." : "Download Export File"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Background Task summary */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl max-w-2xl mt-8">
        <h4 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Automated Daily Cron Exporter</span>
        </h4>
        <p className="text-2xs text-slate-500 font-medium leading-relaxed">
          The Health Sync platform schedules an automated nightly export routine at 23:59:00. This compiles and backs up complete district database structures to regional government cloud buckets for administrative auditing.
        </p>
      </div>

    </div>
  );
};

export default Reports;
