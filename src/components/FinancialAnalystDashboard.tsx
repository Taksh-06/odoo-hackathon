/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wrench, 
  Fuel, 
  Activity, 
  FileText,
  Clock,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Plus
} from "lucide-react";
import { Vehicle, FuelLog, MaintenanceLog, playSound } from "../types";

interface FinancialAnalystDashboardProps {
  vehicles: Vehicle[];
  fuelLogs: FuelLog[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLog[]>>;
  maintenanceLogs: MaintenanceLog[];
  setMaintenanceLogs: React.Dispatch<React.SetStateAction<MaintenanceLog[]>>;
  addToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function FinancialAnalystDashboard({
  vehicles,
  fuelLogs,
  setFuelLogs,
  maintenanceLogs,
  setMaintenanceLogs,
  addToast
}: FinancialAnalystDashboardProps) {

  // --- LOCAL FINANCE STATES ---
  const [selectedVehId, setSelectedVehId] = useState<string>("V-101");
  const [logType, setLogType] = useState<"fuel" | "maintenance">("fuel");
  const [expenseCost, setExpenseCost] = useState<string>("");
  const [expenseDesc, setExpenseDesc] = useState<string>("");
  const [expenseQty, setExpenseQty] = useState<string>("");

  const [activeChartBar, setActiveChartBar] = useState<number | null>(null);

  // --- METRIC ENGINE ---
  const totalMaintCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalFleetCost = totalMaintCost + totalFuelCost;

  // Percentage changes (simulated for high-fidelity)
  const maintDiffPct = -2.4;
  const fuelDiffPct = 12.8;
  const totalDiffPct = 4.6;

  // --- INTERACTIVE CHART DATA (Aggregate Monthly Expenditures) ---
  const monthlyData = [
    { month: "Jan", fuel: 4500, maint: 3200 },
    { month: "Feb", fuel: 5100, maint: 2800 },
    { month: "Mar", fuel: 4800, maint: 4100 },
    { month: "Apr", fuel: 6200, maint: 3500 },
    { month: "May", fuel: 5800, maint: 3900 },
    { month: "Jun", fuel: totalFuelCost, maint: totalMaintCost } // Real-time monthly sync
  ];

  const maxVal = Math.max(...monthlyData.map(d => d.fuel + d.maint)) * 1.15;

  // --- FORM EXPENSE LOGGER ---
  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");

    const costNum = parseFloat(expenseCost);
    if (isNaN(costNum) || costNum <= 0) {
      addToast("VALIDATION ERROR: Please enter a positive decimal cost value.", "warning");
      return;
    }

    if (!expenseDesc.trim()) {
      addToast("VALIDATION ERROR: Please specify expense description details.", "warning");
      return;
    }

    const targetV = vehicles.find(v => v.id === selectedVehId);
    if (!targetV) return;

    if (logType === "fuel") {
      const logId = `F-${Math.floor(500 + Math.random() * 500)}`;
      const newLog: FuelLog = {
        id: logId,
        vehicleId: selectedVehId,
        date: "Just Now",
        amountAdded: expenseQty || "50 Gal",
        cost: costNum,
        location: "Analyst Audit Log"
      };
      setFuelLogs(prev => [newLog, ...prev]);
      addToast(`EXPENSE AUDIT: Logged fuel charge of $${costNum.toFixed(2)} to ${targetV.name}`, "success");
    } else {
      const logId = `M-${Math.floor(500 + Math.random() * 500)}`;
      const newMaint: MaintenanceLog = {
        id: logId,
        vehicleId: selectedVehId,
        date: "Just Now",
        description: `[Finance Audit] ${expenseDesc}`,
        cost: costNum,
        status: "Completed"
      };
      setMaintenanceLogs(prev => [newMaint, ...prev]);
      addToast(`EXPENSE AUDIT: Logged maintenance bill of $${costNum.toFixed(2)} to ${targetV.name}`, "success");
    }

    playSound("success");
    setExpenseCost("");
    setExpenseDesc("");
    setExpenseQty("");
  };

  return (
    <>
      {/* 1. TOP EXPENDITURE CARDS WITH MATHEMATICAL FORMULA */}
      <section id="expenditure_cards" className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Fuel Expenditures */}
        <div className="bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5" />
              TOTAL FUEL & CHARGING COST
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-black text-white tracking-tight">
                ${totalFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-red-400 font-mono flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{fuelDiffPct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Aggregated electricity and petroleum invoices.</p>
          </div>
        </div>

        {/* Card 2: Maintenance Expenditures */}
        <div className="bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400 tracking-wider flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              TOTAL MAINTENANCE COST
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-black text-white tracking-tight">
                ${totalMaintCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" /> {maintDiffPct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Total vehicle repair bills and dock sign-offs.</p>
          </div>
        </div>

        {/* Card 3: Total Fleet Cost (Grand Aggregate) */}
        <div className="bg-[#090b1c]/85 backdrop-blur-xl p-5 rounded-2xl border border-cyan-500/25 shadow-[0_0_25px_rgba(34,211,238,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              GRAND TOTAL OPERATIONAL COST
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-black text-white tracking-tight">
                ${totalFleetCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <span className="text-[10px] text-red-400 font-mono flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +{totalDiffPct}%
              </span>
            </div>
            <p className="text-[11px] text-cyan-300 font-mono">
              Formula: [Total] = [Fuel] + [Maint]
            </p>
          </div>
        </div>

      </section>

      {/* FORMULA MATHEMATICAL DISPLAY BAR */}
      <div className="lg:col-span-12">
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-950/50 border border-cyan-500/10 text-cyan-400 font-mono text-xs font-bold">
              ∑
            </div>
            <div>
              <span className="text-[9.5px] font-mono text-slate-500 tracking-wider uppercase block">LEDGER MATH EQUATION ENGINE</span>
              <span className="text-xs font-mono font-bold text-slate-300">Total Operational Cost Formula</span>
            </div>
          </div>

          {/* Graphical Equation Layout */}
          <div className="flex items-center gap-2.5 font-mono text-xs sm:text-sm text-slate-400 flex-wrap justify-center">
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-emerald-400 font-bold flex flex-col items-center">
              <span className="text-[8px] text-slate-500">FUEL & CHARGING</span>
              <span>${totalFuelCost.toLocaleString()}</span>
            </div>
            <span className="text-xl text-slate-600">+</span>
            <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-amber-500 font-bold flex flex-col items-center">
              <span className="text-[8px] text-slate-500">MAINTENANCE BILLS</span>
              <span>${totalMaintCost.toLocaleString()}</span>
            </div>
            <span className="text-xl text-slate-600">=</span>
            <div className="bg-cyan-950/40 border border-cyan-500/20 px-3.5 py-1.5 rounded-xl text-cyan-400 font-black flex flex-col items-center shadow-[0_0_15px_rgba(34,211,238,0.1)]">
              <span className="text-[8px] text-slate-500">TOTAL COMBINED</span>
              <span>${totalFleetCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE COST CHARTS (Cols: 6) */}
      <section id="interactive_charts" className="lg:col-span-6 h-full">
        <div className="bg-[#090b1c]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-800 flex flex-col gap-4 h-full min-h-[480px]">
          
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200">INTERACTIVE MONTHLY EXPENDITURES</h3>
              <p className="text-[10px] text-slate-500 font-mono">Dynamic historical SVG chart tracking Fuel vs Maintenance costs</p>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              JAN - JUN SUMMARY
            </span>
          </div>

          {/* SVG Multi-Series Bar Chart */}
          <div className="flex-1 flex flex-col justify-center py-4 relative">
            <div className="h-[240px] w-full relative flex items-end justify-between px-6 border-b border-l border-slate-800/80">
              
              {/* Y Axis Grid Lines */}
              <div className="absolute left-0 right-0 border-t border-slate-900/50" style={{ bottom: "25%" }} />
              <div className="absolute left-0 right-0 border-t border-slate-900/50" style={{ bottom: "50%" }} />
              <div className="absolute left-0 right-0 border-t border-slate-900/50" style={{ bottom: "75%" }} />

              {/* Loop bars */}
              {monthlyData.map((d, idx) => {
                const totalHeightPct = ((d.fuel + d.maint) / maxVal) * 100;
                const fuelHeightPct = (d.fuel / (d.fuel + d.maint)) * totalHeightPct;
                const maintHeightPct = (d.maint / (d.fuel + d.maint)) * totalHeightPct;

                const isHovered = activeChartBar === idx;

                return (
                  <div 
                    key={d.month} 
                    className="flex flex-col items-center w-12 group cursor-pointer"
                    onMouseEnter={() => {
                      setActiveChartBar(idx);
                      playSound("click");
                    }}
                    onMouseLeave={() => setActiveChartBar(null)}
                  >
                    
                    {/* Floating Info Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-950 border border-cyan-500/40 px-3 py-2 rounded-xl text-[10px] font-mono w-44 z-10 text-center shadow-xl animate-fade-in">
                        <span className="text-cyan-400 font-bold block">{d.month} Expenditures</span>
                        <div className="flex justify-between text-slate-400 mt-1">
                          <span>Fuel:</span>
                          <span className="text-emerald-400">${d.fuel.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Maint:</span>
                          <span className="text-amber-500">${d.maint.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-slate-900 mt-1.5 pt-1 flex justify-between font-bold text-white">
                          <span>Total:</span>
                          <span>${(d.fuel + d.maint).toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Bar segments container */}
                    <div className="w-6 rounded-t-md overflow-hidden relative transition-all duration-300 group-hover:scale-105" style={{ height: `${totalHeightPct}%` }}>
                      {/* Fuel segment */}
                      <div 
                        className="bg-emerald-500/90 hover:bg-emerald-400 transition-colors" 
                        style={{ height: `${fuelHeightPct}%` }} 
                        title={`Fuel: $${d.fuel}`}
                      />
                      {/* Maint segment */}
                      <div 
                        className="bg-amber-500/90 hover:bg-amber-400 transition-colors" 
                        style={{ height: `${maintHeightPct}%` }} 
                        title={`Maintenance: $${d.maint}`}
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 mt-2">{d.month}</span>
                  </div>
                );
              })}

            </div>

            {/* Chart Legend */}
            <div className="flex justify-center gap-6 text-[10px] font-mono text-slate-400 pt-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span>Fuel Logs & Recharges (USD)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded" />
                <span>Maintenance & Service Bills (USD)</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. FUEL & MAINT LEDGERS + INLINE EXPANSE LOGGER (Cols: 6) */}
      <section id="ledger_controls" className="lg:col-span-6 h-full flex flex-col gap-6">
        
        {/* Card 3: Inline Audit Logger */}
        <div className="bg-[#090b1c]/85 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 flex flex-col gap-4">
          <div className="border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              LEDGER INLINE EXPENSE RECORDER
            </span>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Authorize and file official fleet expense vouchers into databases.</p>
          </div>

          <form onSubmit={handleLogExpense} className="space-y-4 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block">SELECT VEHICLE</label>
                <select 
                  value={selectedVehId}
                  onChange={(e) => setSelectedVehId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-white focus:outline-none cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.id} ({v.name})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block">EXPENSE CLASSIFICATION</label>
                <div className="flex gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setLogType("fuel");
                      playSound("click");
                    }}
                    className={`flex-1 py-1 text-center rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      logType === "fuel" 
                        ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Fuel/Charge
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogType("maintenance");
                      playSound("click");
                    }}
                    className={`flex-1 py-1 text-center rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      logType === "maintenance" 
                        ? "bg-amber-950/60 text-amber-500 border border-amber-500/20" 
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    Maintenance
                  </button>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block">TOTAL USD CHARGE ($)</label>
                <input 
                  type="text"
                  placeholder="e.g. 520.00"
                  value={expenseCost}
                  onChange={(e) => setExpenseCost(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-white focus:outline-none placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 block">QUANTITY (Only if Fuel Type)</label>
                <input 
                  type="text"
                  placeholder="e.g. 90 kWh or 45 Gal"
                  value={expenseQty}
                  onChange={(e) => setExpenseQty(e.target.value)}
                  disabled={logType !== "fuel"}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-white focus:outline-none placeholder:text-slate-600 disabled:opacity-40"
                />
              </div>

            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 block">DETAILED DESCRIPTION</label>
              <input 
                type="text"
                placeholder="e.g. Electric charger connection at Salt Lake Terminal"
                value={expenseDesc}
                onChange={(e) => setExpenseDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-3 py-2.5 rounded-xl text-white focus:outline-none placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-xl font-black text-slate-950 font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                logType === "fuel" ? "bg-emerald-500 hover:bg-emerald-400" : "bg-amber-500 hover:bg-amber-400"
              }`}
            >
              FILE COMPLIANCE VOUCHER
            </button>

          </form>
        </div>

        {/* Card 4: Historical Ledger Entries */}
        <div className="bg-[#090b1c]/85 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 flex flex-col gap-4 flex-1 max-h-[300px]">
          <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              COMBINED EXPENDITURE TIMELINE
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {fuelLogs.length + maintenanceLogs.length} Records
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
            {/* Merge and sort fuel & maintenance logs for timeline */}
            {[
              ...fuelLogs.map(f => ({ ...f, logCategory: "Fuel" as const })),
              ...maintenanceLogs.map(m => ({ ...m, logCategory: "Maint" as const }))
            ]
              .slice(0, 15)
              .map((log, index) => {
                const targetV = vehicles.find(v => v.id === log.vehicleId);
                const isFuel = log.logCategory === "Fuel";
                return (
                  <div 
                    key={`${log.id}-${index}`}
                    className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isFuel ? "bg-emerald-500" : "bg-amber-500"}`} />
                        <span className="font-bold text-slate-200 text-[10px]">
                          {targetV ? targetV.name : log.vehicleId}
                        </span>
                        <span className={`text-[8px] px-1 py-0.2 rounded border uppercase font-bold ${
                          isFuel 
                            ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400" 
                            : "bg-amber-950/30 border-amber-500/20 text-amber-400"
                        }`}>
                          {log.logCategory}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 mt-0.5">
                        {isFuel ? (log as any).location : (log as any).description.split(":")[1]?.trim() || (log as any).description} // {log.date}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-bold block ${isFuel ? "text-emerald-400" : "text-amber-500"}`}>
                        ${log.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      {isFuel && <span className="text-[8.5px] text-slate-400 block">{(log as any).amountAdded}</span>}
                    </div>
                  </div>
                );
              })}
          </div>

        </div>

      </section>
    </>
  );
}
