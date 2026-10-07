import React, { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import { reportService } from "../services/reportService.js";
import { BarChart3, Download, Filter, Calendar } from "lucide-react";

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
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Centre Intelligence & Audit Reports"
        subtitle="Operational metrics, clinical goal outcomes, stock movement, and financial statements"
        actions={
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        }
      />

      <div className="p-8 space-y-6 flex-1">
        {/* Report Category Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "revenue", label: "Financial Revenue" },
            { id: "appointments", label: "Appointments & Visits" },
            { id: "goals", label: "Goal Progress & Outcomes" },
            { id: "inventory", label: "Inventory Stock Valuation" },
            { id: "outstanding", label: "Outstanding Dues Ledger" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setReportType(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                reportType === tab.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Report Output Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Report Dataset: <strong className="text-slate-900 capitalize">{reportType} Report</strong></span>
            <span>Total Records: <strong className="text-slate-900">{count}</strong></span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2" />
              Generating report ledger...
            </div>
          ) : reportData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No data records match the selected report scope.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 font-bold uppercase text-slate-500">
                    {Object.keys(reportData[0]).map((col) => (
                      <th key={col} className="py-3 px-6 whitespace-nowrap">{col.replace(/_/g, " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx} className="py-3 px-6 whitespace-nowrap font-medium text-slate-700">
                          {String(val || "N/A")}
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
