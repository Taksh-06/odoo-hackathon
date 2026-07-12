/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Gauge, 
  ShieldCheck, 
  AlertTriangle, 
  Fuel, 
  Navigation, 
  ArrowRight,
  User,
  Wrench,
  CheckCircle,
  Clock,
  Compass
} from "lucide-react";
import { 
  Vehicle, 
  Driver, 
  Trip, 
  FuelLog, 
  MaintenanceLog, 
  playSound 
} from "../types";

interface DriverDashboardProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  activeTrips: Trip[];
  setActiveTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  fuelLogs: FuelLog[];
  setFuelLogs: React.Dispatch<React.SetStateAction<FuelLog[]>>;
  maintenanceLogs: MaintenanceLog[];
  setMaintenanceLogs: React.Dispatch<React.SetStateAction<MaintenanceLog[]>>;
  addToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
  currentTime: string;
}

export default function DriverDashboard({
  vehicles,
  setVehicles,
  drivers,
  setDrivers,
  activeTrips,
  setActiveTrips,
  fuelLogs,
  setFuelLogs,
  maintenanceLogs,
  setMaintenanceLogs,
  addToast,
  currentTime
}: DriverDashboardProps) {

  // Default to first driver, or let driver choose which CDL seat they are sitting in
  const [activeDriverId, setActiveDriverId] = useState<string>("D-202"); // Default to Sarah Jenkins (who has active trip)

  // --- LOCAL DRIVER STATES ---
  const [issueVehicle, setIssueVehicle] = useState<string>("");
  const [issueCategory, setIssueCategory] = useState<string>("Brakes");
  const [issueSeverity, setIssueSeverity] = useState<string>("low");
  const [issueDesc, setIssueDesc] = useState<string>("");

  const [newLogCost, setNewLogCost] = useState<string>("");
  const [newLogAmount, setNewLogAmount] = useState<string>("");
  const [newLogVehicle, setNewLogVehicle] = useState<string>("V-101");

  // Get active driver's details
  const activeDriver = drivers.find((d) => d.id === activeDriverId) || drivers[0];

  // Get trip assigned to this driver
  const activeTrip = activeTrips.find((t) => t.driverId === activeDriver.id);

  // --- SUBMIT COMPLIANCE ISSUES ---
  const handleReportIssue = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");

    if (!issueVehicle) {
      playSound("error");
      addToast("VALIDATION DENIED: Please assign an active vehicle registration key.", "warning");
      return;
    }
    if (!issueDesc.trim()) {
      playSound("error");
      addToast("VALIDATION DENIED: Please describe the vehicle issue details.", "warning");
      return;
    }

    const v = vehicles.find((item) => item.id === issueVehicle);
    if (!v) return;

    const mId = `M-${Math.floor(600 + Math.random() * 400)}`;
    const cost = issueSeverity === "high" ? 1850.00 : issueSeverity === "medium" ? 750.00 : 250.00;
    const description = `[Driver Report: ${activeDriver.name}] ${issueCategory.toUpperCase()} (${issueSeverity.toUpperCase()} urgency): ${issueDesc}`;

    fetch("/api/maintenance-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: mId,
        vehicleId: issueVehicle,
        date: "Just Now",
        description,
        cost,
        status: "In-Shop"
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to submit maintenance log");
        addToast(`COMPLIANCE DISPATCHED: Issue registered. ${v.name} redirected to Repair Hub.`, "success");
        playSound("success");
        setIssueVehicle("");
        setIssueDesc("");
      })
      .catch((err) => {
        playSound("error");
        addToast(err.message || "Failed to submit issue", "error");
      });
  };

  // --- SUBMIT FUEL/CHARGING RECEIPT ---
  const handleLogFuel = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");

    const costNum = parseFloat(newLogCost);
    if (isNaN(costNum) || costNum <= 0) {
      addToast("INPUT VALIDATION: Please enter a valid decimal cost amount.", "warning");
      return;
    }

    const targetVehicle = vehicles.find((v) => v.id === newLogVehicle);
    if (!targetVehicle) return;

    const logId = `F-${Math.floor(500 + Math.random() * 500)}`;
    const amountAdded = newLogAmount || (targetVehicle.fuelType === "Electric" ? "80 kWh" : "50 Gal");

    fetch("/api/fuel-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: logId,
        vehicleId: newLogVehicle,
        date: "Just Now",
        amountAdded,
        cost: costNum,
        location: "Active Field Charging"
      })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to submit fuel log");
        addToast(`LOG REGISTERED: Charging/Refuel receipt logged for ${targetVehicle.name}. Cost: $${costNum.toFixed(2)}.`, "success");
        setNewLogCost("");
        setNewLogAmount("");
      })
      .catch((err) => {
        playSound("error");
        addToast(err.message || "Failed to log fuel/charge receipt", "error");
      });
  };

  // Switcher of Driver accounts for demo
  const handleDriverChange = (id: string) => {
    setActiveDriverId(id);
    playSound("click");
    addToast(`Switched active Driver view to ${drivers.find(d => d.id === id)?.name}`, "info");
  };

  return (
    <>
      {/* 1. TOP SELECTOR AND PERSONAL TELEMETRY */}
      <div className="lg:col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-[#090b1c]/80 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">DRIVER ACTIVE CONSOLE LINK</h3>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Operator ID credentials loading dynamically</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">ACTIVE DRIVER ID:</span>
          <select
            value={activeDriverId}
            onChange={(e) => handleDriverChange(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.id}) - {d.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: My Odometer */}
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-6 rounded-2xl border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" />
              MY ODOMETER & DISTANCE TRACED
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <h2 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                {activeDriverId === "D-201" ? "12,410 km" : activeDriverId === "D-202" ? "14,280 km" : activeDriverId === "D-203" ? "8,100 km" : "11,940 km"}
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {activeDriver.status === "on-trip" ? "ACTIVE TRANSIT" : "ON SHIFT"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              Your estimated mileage on active routes. Next scheduled safety check: <span className="text-cyan-400 font-bold">15,000 km</span>.
            </p>
            <div className="h-1.5 w-full bg-white dark:bg-slate-900 rounded-full overflow-hidden mt-3">
              <div className="h-full rounded-full bg-cyan-400 animate-pulse" style={{ width: "95.2%" }} />
            </div>
          </div>
        </div>

        {/* Card 2: Safety Score */}
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-6 rounded-2xl border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-indigo-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              MY CDL COMPLIANCE & SAFETY SCORE
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <h2 className="text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                {activeDriver.rating >= 4.9 ? "99.2 / 100" : activeDriver.rating >= 4.7 ? "96.5 / 100" : "82.0 / 100"}
              </h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border ${
                activeDriver.status === "suspended" 
                  ? "bg-red-950/60 border-red-500/20 text-red-400" 
                  : "bg-emerald-950/60 border-emerald-500/20 text-emerald-400"
              }`}>
                {activeDriver.status === "suspended" ? "SUSPENDED" : "GRADE A+"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-300 dark:border-slate-900 mt-2">
              <div>
                <span className="block text-slate-600 dark:text-slate-400 text-[8px] uppercase">Speed limits</span>
                <span className={activeDriver.status === "suspended" ? "text-red-400" : "text-emerald-400"}>
                  {activeDriver.status === "suspended" ? "74% compliance" : "100% compliant"}
                </span>
              </div>
              <div>
                <span className="block text-slate-600 dark:text-slate-400 text-[8px] uppercase">Hard brakes</span>
                <span className="text-amber-400">
                  {activeDriver.status === "suspended" ? "4 Warnings" : "1 Warning"}
                </span>
              </div>
              <div>
                <span className="block text-slate-600 dark:text-slate-400 text-[8px] uppercase">Active hours</span>
                <span className="text-slate-700 dark:text-slate-300">{activeDriver.hoursRemaining} hrs / 14</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. IN-DEPTH ASSIGNED TRIP ROUTE CARD */}
      <div className="lg:col-span-12">
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
              NEXT ASSIGNED TRIP ROUTE CARD
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase">
              {activeDriver.status === "on-trip" ? "DISPATCHED" : "WAITING IN QUEUE"}
            </span>
          </div>

          {activeTrip ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Trip Metadata (Cols 4) */}
              <div className="md:col-span-4 space-y-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between items-center bg-slate-50/60 dark:bg-slate-950/60 p-2.5 border border-slate-300 dark:border-slate-900 rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400">TRIP ID:</span>
                  <span className="text-cyan-400 font-bold">{activeTrip.id}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50/60 dark:bg-slate-950/60 p-2.5 border border-slate-300 dark:border-slate-900 rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400">CARGO VALUE:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeTrip.cargo}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50/60 dark:bg-slate-950/60 p-2.5 border border-slate-300 dark:border-slate-900 rounded-xl">
                  <span className="text-slate-600 dark:text-slate-400">CARGO WEIGHT:</span>
                  <span className="text-amber-500 font-bold">{activeTrip.weight.toLocaleString()} kg</span>
                </div>
              </div>

              {/* Graphical Route Pipeline (Cols 8) */}
              <div className="md:col-span-8 p-5 bg-slate-50/60 dark:bg-slate-950/60 rounded-2xl border border-slate-300 dark:border-slate-900 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 dark:text-slate-400">FROM</span>
                    <span className="text-slate-900 dark:text-white font-black bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">{activeTrip.source}</span>
                  </div>
                  <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-800 mx-4 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] text-cyan-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/10 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {activeTrip.speed} mph
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-600 dark:text-slate-400">TO</span>
                    <span className="text-slate-900 dark:text-white font-black bg-white dark:bg-slate-900 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800">{activeTrip.destination}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-600 dark:text-slate-400">
                    <span>TRANSIT PIPELINE PROGRESS</span>
                    <span>{Math.round(activeTrip.progress)}% COMPLETED</span>
                  </div>
                  <div className="h-2 w-full bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 animate-pulse" 
                      style={{ width: `${activeTrip.progress}%` }} 
                    />
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-600 dark:text-slate-400">
              <Navigation className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-xs font-mono font-medium">No active transit route pipelines currently dispatched.</span>
              <p className="text-[10px] text-slate-600 mt-1">Status: Standby // Standby at terminal until fleet managers authorize cargo manifests.</p>
            </div>
          )}
        </div>
      </div>

      {/* 3. REPORT ISSUE & REFUEL/RECEIPT LOGS */}
      <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 3: Report Vehicle Issue Form */}
        <div className="bg-white/85 dark:bg-[#090b1c]/85 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              REPORT VEHICLE ISSUE
            </span>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-0.5">Submit immediate maintenance tickets to fleet coordinators.</p>
          </div>

          <form onSubmit={handleReportIssue} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider block">ASSIGNED FLEET VEHICLE</label>
              <select 
                value={issueVehicle}
                onChange={(e) => setIssueVehicle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/20 px-3 py-2.5 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.status === "in-shop"}>
                    {v.name} ({v.id}) - [{v.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider block">ISSUE CATEGORY</label>
                <select 
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="Brakes">Brake Rotor / Wear Noise</option>
                  <option value="Tire">Tire Pressure / Treads</option>
                  <option value="Sensor">Radar / LIDAR Sensor Failure</option>
                  <option value="Powertrain">Electric Motor / Battery Pack</option>
                  <option value="Fluid">Cabin Climate Management</option>
                  <option value="Other">Other Mechanical / Software Bug</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider block">SEVERITY LEVEL</label>
                <select 
                  value={issueSeverity}
                  onChange={(e) => setIssueSeverity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="low">Low (Next Regular Maintenance)</option>
                  <option value="medium">Medium (Requires Inspection Soon)</option>
                  <option value="high">Critical (Ground Vehicle Immediately)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider block">DETAILED ISSUE DESCRIPTION</label>
              <textarea 
                rows={3}
                placeholder="Describe sensory outputs or error codes observed..."
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-600 resize-none"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer"
            >
              TRANSMIT COMPLIANCE TICKET
            </button>
          </form>
        </div>

        {/* Card 4: Charging logs and receipts */}
        <div className="bg-white/85 dark:bg-[#090b1c]/85 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-emerald-500" />
              CHARGING & FUEL RECEIPT LOGS
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              Driver Wallet
            </span>
          </div>

          {/* Log Receipt Inline Form */}
          <form onSubmit={handleLogFuel} className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-xl space-y-2 flex flex-col">
            <span className="text-[9px] font-mono text-emerald-400 font-bold block">
              DRIVERS CONSOLE: FILE RECHARGE RECEIPT
            </span>
            
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-1">
                <span className="font-mono text-slate-600 dark:text-slate-400 block">VEHICLE</span>
                <select 
                  value={newLogVehicle} 
                  onChange={(e) => setNewLogVehicle(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded w-full text-slate-800 dark:text-slate-200 text-xs font-mono cursor-pointer"
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.id} ({v.name.split(" ")[0]})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-slate-600 dark:text-slate-400 block">TOTAL COST ($)</span>
                <input 
                  type="text" 
                  placeholder="e.g. 45.50" 
                  value={newLogCost}
                  onChange={(e) => setNewLogCost(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded w-full text-slate-800 dark:text-slate-200 placeholder:text-slate-600 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[10px] pt-1">
              <input 
                type="text" 
                placeholder="e.g. 85 kWh or 45 Gal" 
                value={newLogAmount}
                onChange={(e) => setNewLogAmount(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded flex-1 text-slate-800 dark:text-slate-200 placeholder:text-slate-600 text-xs font-mono"
              />
              <button 
                type="submit"
                className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold font-mono rounded text-[9px] hover:bg-emerald-400 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              >
                LOG RECEIPT
              </button>
            </div>
          </form>

          {/* Scrolling history */}
          <div className="flex-1 max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-2.5 mt-1">
            {fuelLogs.map((log) => {
              const targetV = vehicles.find((v) => v.id === log.vehicleId);
              return (
                <div 
                  key={log.id} 
                  className="p-2.5 bg-slate-50/40 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 text-xs font-mono flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                        {targetV ? targetV.name.split(" ")[0] : log.vehicleId}
                      </span>
                      <span className="text-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1 py-0.2 rounded text-slate-600 dark:text-slate-400">
                        {log.id}
                      </span>
                    </div>
                    <p className="text-[9px] text-slate-600 dark:text-slate-400">{log.location} // {log.date}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 block font-bold">${log.cost.toFixed(2)}</span>
                    <span className="text-[8.5px] text-slate-600 dark:text-slate-400 block">{log.amountAdded}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </>
  );
}
