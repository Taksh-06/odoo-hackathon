/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Activity,
  Truck,
  DollarSign,
  TrendingUp,
  Plus,
  X,
  Wrench,
  User,
  Navigation,
  ArrowRight,
  Check,
  CheckCircle,
  AlertTriangle,
  Lock,
  BatteryCharging,
  Fuel,
  Compass
} from "lucide-react";
import {
  Vehicle,
  Driver,
  Trip,
  FuelLog,
  MaintenanceLog,
  Hub,
  HUBS,
  HUB_CONNECTIONS,
  playSound
} from "../types";

interface FleetManagerDashboardProps {
  vehicles: Vehicle[];
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  activeTrips: Trip[];
  setActiveTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  fuelLogs: FuelLog[];
  maintenanceLogs: MaintenanceLog[];
  setMaintenanceLogs: React.Dispatch<React.SetStateAction<MaintenanceLog[]>>;
  addToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
  triggerEmergencyRepair: (vehicleId: string) => void;
  resolveMaintenance: (maintId: string, vehicleId: string) => void;
}

export default function FleetManagerDashboard({
  vehicles,
  setVehicles,
  drivers,
  setDrivers,
  activeTrips,
  setActiveTrips,
  fuelLogs,
  maintenanceLogs,
  setMaintenanceLogs,
  addToast,
  triggerEmergencyRepair,
  resolveMaintenance
}: FleetManagerDashboardProps) {

  // --- LOCAL DISPATCH VIEW STATES ---
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const [sourceHub, setSourceHub] = useState<string>("LAX");
  const [destinationHub, setDestinationHub] = useState<string>("SEA");
  const [cargoDesc, setCargoDesc] = useState<string>("");
  const [cargoWeight, setCargoWeight] = useState<number>(5000);

  // --- MAP INTERACTION STATE ---
  const [activeMapHub, setActiveMapHub] = useState<Hub | null>(null);

  // --- STATS CALCULATIONS ---
  const totalMaintCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalFleetCost = totalMaintCost + totalFuelCost;
  const activeVehCount = vehicles.filter((v) => v.status === "on-trip").length;
  const inShopCount = vehicles.filter((v) => v.status === "in-shop").length;
  const utilizationRate = Math.round(
    ((vehicles.filter((v) => v.status === "on-trip").length +
      vehicles.filter((v) => v.status === "available").length * 0.4) /
      vehicles.length) * 100
  );

  // Auto-select first available driver/vehicle when opening dispatch form
  useEffect(() => {
    if (isDispatching) {
      const firstAvailDriver = drivers.find((d) => d.status === "available")?.id || "";
      const firstAvailVehicle = vehicles.find((v) => v.status === "available")?.id || "";
      setSelectedDriver(firstAvailDriver);
      setSelectedVehicle(firstAvailVehicle);
    }
  }, [isDispatching, drivers, vehicles]);

  useEffect(() => {
    if (activeTab === "dispatch") {
      setIsDispatching(true);
    }
  }, [activeTab]);

  // --- ACTION HANDLER FOR DISPATCH LAUNCH ---
  const handleLaunchDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");

    if (sourceHub === destinationHub) {
      playSound("error");
      addToast(`ROUTING FAILURE: Source and destination hubs cannot be identical (${sourceHub}).`, "error");
      return;
    }

    if (!selectedDriver) {
      playSound("error");
      addToast("DISPATCH DENIED: An active CDL driver must be assigned to this route.", "error");
      return;
    }
    if (!selectedVehicle) {
      playSound("error");
      addToast("DISPATCH DENIED: An active vehicle from the Vehicle Registry must be assigned.", "error");
      return;
    }

    const driver = drivers.find((d) => d.id === selectedDriver);
    const vehicle = vehicles.find((v) => v.id === selectedVehicle);

    if (!driver || !vehicle) {
      playSound("error");
      addToast("SYSTEM ERROR: Invalid driver or vehicle assignment reference.", "error");
      return;
    }

    if (driver.status === "suspended" || driver.licenseType.includes("Suspended")) {
      playSound("error");
      addToast(
        `COMPLIANCE LOCKOUT: Driver ${driver.name} has a suspended CDL license. Operations immediately terminated.`,
        "error"
      );
      return;
    }

    if (driver.hoursRemaining <= 0) {
      playSound("error");
      addToast(
        `SAFETY BREACH: Driver ${driver.name} has 0.0 hrs of remaining service time. Dispatch barred by safety limits.`,
        "error"
      );
      return;
    }

    if (cargoWeight > vehicle.capacityMax) {
      playSound("error");
      addToast("Cargo exceeds maximum vehicle capacity.", "error");
      return;
    }

    playSound("launch");
    const newTripId = `TRIP-${Math.floor(100 + Math.random() * 900)}`;

    const newTrip = {
      id: newTripId,
      source: sourceHub,
      destination: destinationHub,
      driverId: selectedDriver,
      vehicleId: selectedVehicle,
      cargo: cargoDesc || "General High-Value Freight",
      weight: cargoWeight,
      speed: vehicle.type.includes("Heavy") ? 55 : 65,
    };

    fetch("/api/trips", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrip),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to launch dispatch");
        addToast(`TRANSIT DISPATCH COMPLETED: ${newTripId} launched successfully. Cargo: ${newTrip.cargo}.`, "success");
        setIsDispatching(false);
        setCargoDesc("");
        setCargoWeight(5000);
      })
      .catch((err) => {
        playSound("error");
        addToast(err.message || "Failed to dispatch trip", "error");
      });
  };

  return (
    <div className="lg:col-span-12 flex flex-col gap-6 w-full">
      {/* STICKY TOP NAVBAR */}
      <nav className="sticky top-[73px] z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-slate-900 px-6 py-3 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(0,0,0,0.3)]">
        <div className="flex flex-wrap gap-2 md:gap-4 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab("overview");
              playSound("click");
            }}
            className={`px-4 py-2.5 text-[10px] font-mono font-bold tracking-widest rounded-xl border transition-all duration-300 cursor-pointer ${
              activeTab === "overview"
                ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            OVERVIEW
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("dispatch");
              playSound("click");
            }}
            className={`px-4 py-2.5 text-[10px] font-mono font-bold tracking-widest rounded-xl border transition-all duration-300 cursor-pointer ${
              activeTab === "dispatch"
                ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            DISPATCH & RADAR
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("fleet");
              playSound("click");
            }}
            className={`px-4 py-2.5 text-[10px] font-mono font-bold tracking-widest rounded-xl border transition-all duration-300 cursor-pointer ${
              activeTab === "fleet"
                ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            FLEET & ROSTER
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("maintenance");
              playSound("click");
            }}
            className={`px-4 py-2.5 text-[10px] font-mono font-bold tracking-widest rounded-xl border transition-all duration-300 cursor-pointer ${
              activeTab === "maintenance"
                ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                : "bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            MAINTENANCE & FINANCIALS
          </button>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-[9px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-950/20 px-3 py-1 rounded border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>MANAGEMENT PROFILE ACTIVE</span>
        </div>
      </nav>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <section id="bento_telemetry" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Card 1: Fleet Utilization */}
          <div className="transition-all duration-500 ease-out h-full flex flex-col opacity-100 scale-100 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-2xl overflow-hidden">
            <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all duration-500" />
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3 h-3 animate-pulse" />
                  FLEET UTILIZATION
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">{utilizationRate}%</h2>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +3.8%
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Total operational vehicle efficiency threshold.</p>
              </div>

              {/* Graphical Circular Indicator */}
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" className="stroke-slate-800" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    className="stroke-cyan-400 transition-all duration-1000"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={163.3}
                    strokeDashoffset={163.3 - (163.3 * utilizationRate) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-slate-700 dark:text-slate-300">
                  {vehicles.filter(v => v.status === "on-trip").length}/{vehicles.length}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Active Vehicles */}
          <div className="transition-all duration-500 ease-out h-full flex flex-col opacity-100 scale-100 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-2xl overflow-hidden">
            <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500" />
              <div className="space-y-1.5 w-full">
                <span className="text-[10px] font-mono text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  ACTIVE VEHICLES
                </span>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                    {activeVehCount} <span className="text-xs text-slate-600 dark:text-slate-400 font-normal">/ {vehicles.length} active</span>
                  </h2>
                </div>

                {/* Custom status track */}
                <div className="flex gap-1.5 pt-2">
                  {vehicles.map((v) => (
                    <div
                      key={v.id}
                      title={`${v.name}: ${v.status}`}
                      className={`h-1.5 flex-1 rounded-sm transition-all duration-500 ${v.status === "on-trip"
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                          : v.status === "in-shop"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-emerald-500"
                        }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400 pt-1">
                  <span>{activeVehCount} on road</span>
                  <span>{inShopCount} in service docks</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: System Cost */}
          <div className="transition-all duration-500 ease-out h-full flex flex-col opacity-100 scale-100 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-2xl overflow-hidden">
            <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
              <div className="space-y-1.5 w-full">
                <span className="text-[10px] font-mono text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" />
                  TOTAL EXPENDITURES
                </span>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                    ${totalFleetCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <span className="text-[11px] font-mono text-emerald-400">USD</span>
                </div>

                {/* SVG Sparkline Spark */}
                <div className="h-6 w-full pt-1">
                  <svg className="w-full h-full" viewBox="0 0 300 30">
                    <path
                      d="M 0 25 Q 40 10, 80 20 T 160 5 T 240 18 T 300 8"
                      fill="none"
                      stroke="rgba(16, 185, 129, 0.6)"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 0 25 Q 40 10, 80 20 T 160 5 T 240 18 T 300 8 L 300 30 L 0 30 Z"
                      fill="url(#grad)"
                      opacity="0.1"
                    />
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                        <stop offset="100%" stopColor="rgba(16, 185, 129, 0)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80 mt-1.5">
                  <span>Maint: ${totalMaintCost.toLocaleString()}</span>
                  <span>Fuel: ${totalFuelCost.toLocaleString()}</span>
                </div>
                <div className="mt-2.5 p-2 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                  <p className="text-[9.5px] font-mono text-slate-800 dark:text-slate-200 text-center leading-relaxed">
                    Total Operational Cost = Fuel Logs (${totalFuelCost.toLocaleString()}) + Maintenance Logs (${totalMaintCost.toLocaleString()}) = <span className="text-emerald-400 font-bold">${totalFleetCost.toLocaleString()}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. DISPATCH & RADAR TAB */}
      {activeTab === "dispatch" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
          {/* Operations Radar Map */}
          <div className="xl:col-span-8 transition-all duration-500 ease-out h-full flex flex-col border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-3xl overflow-hidden min-h-[660px]">
            <div className="bg-white/90 dark:bg-[#0b0f2a]/90 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200 dark:border-cyan-500/20 flex-1 flex flex-col gap-5 relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.04)]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-widest text-slate-800 dark:text-slate-200">FLEET OPERATIONS RADAR</h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">LIVE SATELLITE HUD // ACTIVE TRAFFIC NETWORK</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                {/* Map Canvas Wrapper */}
                <div className="relative border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-slate-50/60 dark:bg-slate-950/60 p-4 overflow-hidden h-[340px] flex flex-col items-center justify-center">
                  <svg className="w-full h-full min-h-[300px]" viewBox="0 0 600 300" preserveAspectRatio="xMidYMid meet">
                    <g className="stroke-slate-900/50" strokeWidth="0.5">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <line key={`v-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={300} />
                      ))}
                      {Array.from({ length: 7 }).map((_, i) => (
                        <line key={`h-${i}`} x1={0} y1={i * 50} x2={600} y2={i * 50} />
                      ))}
                    </g>

                    <g className="stroke-cyan-950/60" strokeWidth="1.5">
                      {HUB_CONNECTIONS.map((conn, idx) => {
                        const fromHub = HUBS.find((h) => h.id === conn.from);
                        const toHub = HUBS.find((h) => h.id === conn.to);
                        if (!fromHub || !toHub) return null;
                        return <line key={`route-${idx}`} x1={fromHub.x} y1={fromHub.y} x2={toHub.x} y2={toHub.y} strokeDasharray="2 3" />;
                      })}
                    </g>

                    {activeTrips.map((trip) => {
                      const fromHub = HUBS.find((h) => h.id === trip.source);
                      const toHub = HUBS.find((h) => h.id === trip.destination);
                      if (!fromHub || !toHub) return null;

                      const pct = trip.progress / 100;
                      const currX = fromHub.x + (toHub.x - fromHub.x) * pct;
                      const currY = fromHub.y + (toHub.y - fromHub.y) * pct;

                      return (
                        <g key={trip.id} className="cursor-pointer group">
                          <circle cx={currX} cy={currY} r="10" fill="none" className="stroke-cyan-400 animate-ping opacity-60" strokeWidth="1" />
                          <line x1={fromHub.x} y1={fromHub.y} x2={currX} y2={currY} className="stroke-cyan-400/80" strokeWidth="2" strokeDasharray="1 1" />
                          <circle cx={currX} cy={currY} r="4.5" fill="#22d3ee" className="filter drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                          <text x={currX + 8} y={currY - 5} fill="#38bdf8" className="text-[8px] font-mono font-bold select-none">
                            {trip.id} ({Math.round(trip.progress)}%)
                          </text>
                        </g>
                      );
                    })}

                    {HUBS.map((hub) => {
                      const isHovered = activeMapHub?.id === hub.id;
                      return (
                        <g
                          key={hub.id}
                          transform={`translate(${hub.x}, ${hub.y})`}
                          onMouseEnter={() => {
                            setActiveMapHub(hub);
                            playSound("click");
                          }}
                          onMouseLeave={() => setActiveMapHub(null)}
                          className="cursor-pointer"
                        >
                          <circle cx="0" cy="0" r={isHovered ? "8" : "5"} fill="transparent" className="stroke-cyan-500/40 hover:stroke-cyan-400 transition-all duration-300" strokeWidth="1" />
                          <circle cx="0" cy="0" r="3.5" className={`transition-colors duration-300 ${isHovered ? "fill-cyan-400" : "fill-cyan-600"}`} />
                          <text x="7" y="3" className={`text-[9px] font-mono font-bold tracking-wide select-none ${isHovered ? "fill-cyan-300 scale-105" : "fill-slate-400"} transition-colors duration-200`}>
                            {hub.id}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {activeMapHub && (
                    <div className="absolute top-4 left-4 bg-slate-50/90 dark:bg-slate-950/90 border border-cyan-500/40 p-3 rounded-xl backdrop-blur-xl w-60 z-10 transition-all duration-300">
                      <span className="text-[9px] font-mono text-cyan-400 tracking-widest block">NETWORK TERMINAL NODE</span>
                      <h4 className="text-sm font-display font-bold text-slate-900 dark:text-white">{activeMapHub.name}</h4>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono">Location: {activeMapHub.city}, USA</p>
                      <div className="border-t border-slate-300 dark:border-slate-900 mt-2 pt-2 flex justify-between text-[9px] font-mono text-slate-600 dark:text-slate-400">
                        <span>INBOUND: {activeTrips.filter(t => t.destination === activeMapHub.id).length}</span>
                        <span>OUTBOUND: {activeTrips.filter(t => t.source === activeMapHub.id).length}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-2.5">
                  <h4 className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider">ACTIVE ROUTE PIPELINES ({activeTrips.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[190px] pr-1">
                    {activeTrips.map((trip) => {
                      const v = vehicles.find((item) => item.id === trip.vehicleId);
                      const d = drivers.find((item) => item.id === trip.driverId);
                      return (
                        <div key={trip.id} className="p-3 bg-slate-50/50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800/80 flex flex-col gap-2 relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-400 transition-all duration-300" style={{ width: `${trip.progress}%` }} />
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="text-cyan-400 font-bold">{trip.id}</span>
                            <span className="text-slate-600 dark:text-slate-400">{trip.speed} mph</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-display font-medium">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-900 dark:text-white">{trip.source}</span>
                              <ArrowRight className="w-3 h-3 text-cyan-500" />
                              <span className="text-slate-900 dark:text-white">{trip.destination}</span>
                            </div>
                            <span className="text-[10px] text-cyan-400 font-mono">{Math.round(trip.progress)}%</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900 pt-1.5">
                            <span className="truncate max-w-[110px]">Vehicle: {v ? v.name : trip.vehicleId}</span>
                            <span className="truncate max-w-[90px]">Driver: {d ? d.name.split(" ")[1] : trip.driverId}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Launch Dispatch Form Panel */}
          <div className="xl:col-span-4 transition-all duration-500 ease-out h-full flex flex-col border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-3xl overflow-hidden min-h-[660px]">
            <div className="bg-white/90 dark:bg-[#0b0f2a]/90 backdrop-blur-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col gap-5 relative overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.04)]">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <div>
                    <h3 className="text-xs font-mono font-bold tracking-widest text-slate-800 dark:text-slate-200">OPS DISPATCH PANEL</h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">COMPLIANCE & ROUTE ASSESSMENT INITIALIZATION</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLaunchDispatch} className="flex-1 flex flex-col gap-4 text-slate-800 dark:text-slate-200">
                <div className="grid grid-cols-1 gap-4">
                  {/* Source Hub Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider block">DISPATCH SOURCE PORT</label>
                    <select
                      value={sourceHub}
                      onChange={(e) => {
                        setSourceHub(e.target.value);
                        playSound("click");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/20 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      {HUBS.map((h) => (
                        <option key={h.id} value={h.id}>{h.city} ({h.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Destination Hub Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider block">TARGET DESTINATION PORT</label>
                    <select
                      value={destinationHub}
                      onChange={(e) => {
                        setDestinationHub(e.target.value);
                        playSound("click");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/20 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      {HUBS.map((h) => (
                        <option key={h.id} value={h.id}>{h.city} ({h.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Fleet Vehicle Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider flex justify-between">
                      <span>FLEET VEHICLE ASSIGNMENT</span>
                      <span className="text-cyan-500 font-bold">MAX CAPACITY LIMIT</span>
                    </label>
                    <select
                      value={selectedVehicle}
                      onChange={(e) => {
                        setSelectedVehicle(e.target.value);
                        playSound("click");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/20 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                    >
                      <option value="">-- Assign Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.status === "in-shop"}>
                          {v.name} ({v.id}) - Max {v.capacityMax.toLocaleString()} kg [{v.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Driver CDL Assignment */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider flex justify-between">
                      <span>OPERATOR CDL ASSIGNMENT</span>
                      <span className="text-indigo-400 font-bold">CREDENTIAL VERIFICATION</span>
                    </label>
                    <select
                      value={selectedDriver}
                      onChange={(e) => {
                        setSelectedDriver(e.target.value);
                        playSound("click");
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/20 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option value="">-- Assign Driver --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id} disabled={d.status === "suspended"}>
                          {d.name} ({d.id}) - Rating: {d.rating} [{d.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cargo Specifications */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider block">CARGO SPECIFICATIONS / INVENTORY</label>
                    <input
                      type="text"
                      placeholder="e.g. Semiconductor Wafers, Solid-State Packs"
                      value={cargoDesc}
                      onChange={(e) => setCargoDesc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600"
                    />
                  </div>

                  {/* Cargo Weight Gauge */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-wider flex justify-between">
                      <span>CARGO LOAD WEIGHT</span>
                      <span className="text-amber-500 font-bold">{cargoWeight.toLocaleString()} KG</span>
                    </label>
                    <input
                      type="range"
                      min="1000"
                      max="30000"
                      step="1000"
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(parseInt(e.target.value))}
                      className="w-full accent-cyan-500 bg-white dark:bg-slate-900 rounded-lg h-1"
                    />
                  </div>
                </div>

                {/* COMPLIANCE GAUGES CHECKLIST */}
                <div className="p-4 bg-slate-50/60 dark:bg-slate-950/60 rounded-2xl border border-slate-300 dark:border-slate-900 space-y-3.5 mt-2">
                  <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400 tracking-widest block border-b border-slate-300 dark:border-slate-900 pb-1.5">
                    REAL-TIME COMPLIANCE ENGINE SCANS
                  </span>
                  
                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Gauge 1: Driver License Verification */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {selectedDriver && drivers.find(d => d.id === selectedDriver)?.status !== "suspended" ? (
                        <div className="p-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-red-950/50 border border-red-500/30 text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-slate-700 dark:text-slate-300">CDL VALIDITY</p>
                        <span className="text-[9px] text-slate-600 dark:text-slate-400">
                          {selectedDriver ? drivers.find(d => d.id === selectedDriver)?.licenseType : "No Driver Assigned"}
                        </span>
                      </div>
                    </div>

                    {/* Gauge 2: Weight Load Limits */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {selectedVehicle && cargoWeight <= (vehicles.find(v => v.id === selectedVehicle)?.capacityMax || 0) ? (
                        <div className="p-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-red-950/50 border border-red-500/30 text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-slate-700 dark:text-slate-300">LOAD TOLERANCE</p>
                        <span className="text-[9px] text-slate-600 dark:text-slate-400">
                          {selectedVehicle 
                            ? `Max Cap: ${vehicles.find(v => v.id === selectedVehicle)?.capacityMax.toLocaleString()} kg` 
                            : "No Vehicle Assigned"}
                        </span>
                      </div>
                    </div>

                    {/* Gauge 3: Route Integrity Node Check */}
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {sourceHub !== destinationHub ? (
                        <div className="p-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-red-950/50 border border-red-500/30 text-red-400">
                          <X className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-slate-700 dark:text-slate-300">ROUTE INTEGRITY</p>
                        <span className="text-[9px] text-slate-600 dark:text-slate-400">
                          {sourceHub === destinationHub ? "Conflict Nodes" : "Clear Path"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-auto pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-black font-mono text-xs tracking-wider transition-all duration-300 glow-cyan cursor-pointer"
                  >
                    AUTHORIZE & DISPATCH
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. FLEET & ROSTER TAB */}
      {activeTab === "fleet" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
          {/* Fleet Registry Panel */}
          <div className="transition-all duration-500 ease-out flex flex-col border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-3xl overflow-hidden">
            <div className="bg-white/85 dark:bg-[#090b1c]/85 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  FLEET REGISTRY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {vehicles.length} Vehicles
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[600px] pr-1 flex flex-col gap-2.5">
                {vehicles.map((v) => {
                  const isLowBattery = v.fuelLevel <= 20;
                  return (
                    <div 
                      key={v.id} 
                      className="p-3 bg-slate-50/40 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 hover:border-cyan-500/30 transition-all duration-300 group flex flex-col gap-2 relative overflow-hidden"
                    >
                      <div className="absolute inset-y-0 left-0 w-1 bg-transparent group-hover:bg-cyan-500 transition-colors" />
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-display font-semibold text-slate-900 dark:text-slate-100">{v.name}</h4>
                          <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400 tracking-wider">
                            ID: {v.id} // {v.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {v.status === "available" ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 glow-emerald" />
                              <span className="text-[9px] font-mono text-emerald-400">READY</span>
                            </span>
                          ) : v.status === "on-trip" ? (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 glow-cyan animate-pulse" />
                              <span className="text-[9px] font-mono text-cyan-400">TRANSIT</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 glow-amber" />
                              <span className="text-[9px] font-mono text-amber-400">DOCK</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Power Level Indicator Gauge */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-600 dark:text-slate-400">
                          <span>{v.fuelType === "Electric" ? "BATTERY STATE" : "DIESEL LVL"}</span>
                          <span className={isLowBattery ? "text-red-400 animate-pulse font-bold" : "text-slate-700 dark:text-slate-300"}>
                            {v.fuelLevel}%
                          </span>
                        </div>
                        <div className="h-1 w-full bg-white dark:bg-slate-900 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLowBattery 
                                ? "bg-red-500" 
                                : v.fuelType === "Electric" 
                                ? "bg-cyan-400" 
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${v.fuelLevel}%` }}
                          />
                        </div>
                      </div>

                      {/* Small Quick-Action Repair link */}
                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-900 pt-1.5 mt-0.5">
                        <span>NEXT SVC: {v.nextService}</span>
                        {v.status !== "in-shop" && (
                          <button 
                            onClick={() => triggerEmergencyRepair(v.id)}
                            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer font-bold"
                          >
                            <Wrench className="w-2.5 h-2.5" /> Log to Maintenance
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Driver Roster Panel */}
          <div className="transition-all duration-500 ease-out flex flex-col border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-3xl overflow-hidden">
            <div className="bg-white/85 dark:bg-[#090b1c]/85 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  DRIVER ROSTER
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {drivers.length} Drivers
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[600px] pr-1 flex flex-col gap-2.5">
                {drivers.map((d) => {
                  const isSuspended = d.status === "suspended";
                  return (
                    <div 
                      key={d.id}
                      className={`p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 hover:border-indigo-500/30 transition-all duration-300 flex items-start gap-2.5 relative ${
                        isSuspended ? "opacity-60 saturate-50 border-red-500/20" : ""
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono text-xs font-bold shrink-0 ${d.avatarColor}`}>
                        {d.name.split(" ").map(n => n[0]).join("")}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-display font-semibold text-slate-900 dark:text-slate-100 truncate">{d.name}</h4>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            d.status === "available"
                              ? "bg-emerald-950/60 border-emerald-500/20 text-emerald-400"
                              : d.status === "on-trip"
                              ? "bg-cyan-950/60 border-cyan-500/20 text-cyan-400"
                              : "bg-red-950/60 border-red-500/20 text-red-400"
                          }`}>
                            {d.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-1 text-[9px] font-mono text-slate-600 dark:text-slate-400">
                          <span>LIC: {d.licenseType}</span>
                          <span className="text-amber-400 font-semibold">★ {d.rating}</span>
                        </div>

                        {/* Hours of Service Progress bar */}
                        {!isSuspended && (
                          <div className="space-y-0.5 mt-1.5">
                            <div className="flex justify-between items-center text-[8px] font-mono text-slate-600 dark:text-slate-400">
                              <span>SHIFT LIMIT REMAINING</span>
                              <span>{d.hoursRemaining} hrs / 14</span>
                            </div>
                            <div className="h-0.5 w-full bg-white dark:bg-slate-900 rounded-full">
                              <div 
                                className={`h-full rounded-full ${d.hoursRemaining <= 4 ? "bg-amber-400" : "bg-indigo-400"}`}
                                style={{ width: `${(d.hoursRemaining / 14) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {isSuspended && (
                          <div className="text-[8.5px] font-mono text-red-400 flex items-center gap-1 mt-1 bg-red-950/20 px-1 py-0.5 border border-red-500/10 rounded">
                            <AlertTriangle className="w-2.5 h-2.5" /> CDL EXPIRED / SUSPENDED BY OFFICER
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAINTENANCE & FINANCIALS TAB */}
      {activeTab === "maintenance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">
          {/* Maintenance Hub */}
          <div className="transition-all duration-500 ease-out flex flex-col border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-3xl overflow-hidden">
            <div className="bg-white/85 dark:bg-[#090b1c]/85 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-500" />
                  MAINTENANCE HUB
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  {maintenanceLogs.filter(m => m.status !== "Completed").length} Pending
                </span>
              </div>

              {/* Maintenance Chronological Timelines */}
              <div className="flex-1 overflow-y-auto max-h-[600px] pr-1 flex flex-col gap-3">
                {maintenanceLogs.map((log) => {
                  const targetVeh = vehicles.find((v) => v.id === log.vehicleId);
                  return (
                    <div key={log.id} className="p-3 bg-slate-50/40 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 hover:border-slate-700/60 transition-colors flex gap-2 relative">
                      <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          log.status === "In-Shop" 
                            ? "bg-red-500 glow-red animate-pulse" 
                            : log.status === "Scheduled" 
                            ? "bg-amber-400" 
                            : "bg-emerald-500"
                        }`} />
                        <div className="w-0.5 flex-1 bg-slate-800 min-h-[40px]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-[11px] font-display font-bold text-slate-850 dark:text-slate-200">
                              {targetVeh ? targetVeh.name : log.vehicleId}
                            </h5>
                            <span className="text-[9px] font-mono text-slate-600 dark:text-slate-400">ID: {log.id} // {log.date}</span>
                          </div>
                          <span className="text-[11.5px] font-mono font-bold text-slate-800 dark:text-slate-200">${log.cost}</span>
                        </div>
                        
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1.5 leading-relaxed bg-slate-100/20 dark:bg-[#0d1127]/20 p-1.5 border border-slate-300 dark:border-slate-900 rounded">
                          {log.description}
                        </p>

                        {log.status !== "Completed" && (
                          <button
                            onClick={() => resolveMaintenance(log.id, log.vehicleId)}
                            className="mt-2 text-[9px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer bg-emerald-950/30 border border-emerald-500/20 rounded px-1.5 py-0.5 font-bold"
                          >
                            <CheckCircle className="w-2.5 h-2.5" /> Sign-Off Road Ready
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Charging & Fuel Logs */}
          <div className="transition-all duration-500 ease-out flex flex-col border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] rounded-3xl overflow-hidden">
            <div className="bg-white/85 dark:bg-[#090b1c]/85 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-[11px] font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-emerald-500" />
                  CHARGING & FUEL LOGS
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                  Fuel Ops
                </span>
              </div>

              {/* Fuel Receipts scrolling list */}
              <div className="flex-1 max-h-[600px] overflow-y-auto pr-1 flex flex-col gap-2.5">
                {fuelLogs.map((log) => {
                  const targetV = vehicles.find((v) => v.id === log.vehicleId);
                  return (
                    <div key={log.id} className="p-2.5 bg-slate-50/40 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/60 text-xs font-mono flex items-center justify-between">
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
        </div>
      )}
    </div>
  );
}
