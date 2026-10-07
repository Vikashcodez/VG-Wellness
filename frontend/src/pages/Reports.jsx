import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import { reportService } from "../services/reportService.js";
import { Download } from "lucide-react";

export default function Reports() {
  const [reportType, setReportType] = useState("revenue");
  const [reportData, setReportData] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportService.getReport(reportType);
      if (res.success) {
        setReportData(res.data);
        setCount(res.count);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const handleExportCsv = () => {
    const url = reportService.getExportUrl(reportType);
    window.open(url, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#f4f6f8]">
      <Header
        title="Intelligence & Audit Reports"
        subtitle="Operational metrics, clinical outcomes, inventory movement, and ledger statements"
        actions={
          <button
            onClick={handleExportCsv}
            className="crm-btn-primary"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        }
      />

      <div className="p-3.5 sm:p-5 space-y-3 flex-1 max-w-full">
        {/* Report Category Switcher */}
        <div className="crm-card p-1.5 flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "revenue", label: "Financial Revenue" },
            { id: "appointments", label: "Appointments & Visits" },
            { id: "goals", label: "Goal Progress & Outcomes" },
            { id: "inventory", label: "Inventory Valuation" },
            { id: "outstanding", label: "Outstanding Dues" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                reportType === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Output Table */}
        <div className="crm-card overflow-hidden">
          <div className="p-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
            <span>
              Dataset: <strong className="text-slate-900 capitalize">{reportType} Report</strong>
            </span>
            <span>
              Total Records: <strong className="text-slate-900">{count}</strong>
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Generating report ledger...
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No data records match the selected report scope.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="crm-table">
                <thead>
                  <tr>
                    {Object.keys(reportData[0]).map((col) => (
                      <th key={col} className="whitespace-nowrap">
                        {col.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="whitespace-nowrap font-medium text-slate-700">
                          {String(val || "—")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
