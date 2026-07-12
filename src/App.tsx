/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Activity, 
  User, 
  Compass, 
  CheckCircle, 
  AlertTriangle, 
  LogOut,
  UserCheck,
  X
} from "lucide-react";
import { 
  Vehicle, 
  Driver, 
  Trip, 
  FuelLog, 
  MaintenanceLog, 
  Toast, 
  playSound 
} from "./types";
import FleetManagerDashboard from "./components/FleetManagerDashboard";
import DriverDashboard from "./components/DriverDashboard";
import SafetyOfficerDashboard from "./components/SafetyOfficerDashboard";
import FinancialAnalystDashboard from "./components/FinancialAnalystDashboard";

// --- INITIAL STATE DATASETS ---
const INITIAL_VEHICLES: Vehicle[] = [
  { id: "V-101", name: "Tesla Semi Alpha", type: "Electric Heavy Duty", capacityMax: 20000, capacityCurrent: 0, fuelLevel: 88, status: "available", nextService: "Aug 12", fuelType: "Electric" },
  { id: "V-102", name: "Rivian Cargo Van", type: "Electric Delivery", capacityMax: 5000, capacityCurrent: 4400, fuelLevel: 42, status: "on-trip", nextService: "Sep 01", fuelType: "Electric" },
  { id: "V-103", name: "Mack Anthem Heavy", type: "Class 8 Diesel Tractor", capacityMax: 30000, capacityCurrent: 0, fuelLevel: 94, status: "available", nextService: "Jul 28", fuelType: "Diesel" },
  { id: "V-104", name: "Ford E-Transit", type: "Light Delivery Van", capacityMax: 2000, capacityCurrent: 0, fuelLevel: 15, status: "in-shop", nextService: "Scheduled Today", fuelType: "Electric" },
  { id: "V-105", name: "Freightliner eCascadia", type: "Class 8 Electric Semi", capacityMax: 25000, capacityCurrent: 0, fuelLevel: 72, status: "available", nextService: "Aug 05", fuelType: "Electric" },
  { id: "V-106", name: "Peterbilt 579 EV", type: "Class 8 Electric Semi", capacityMax: 25000, capacityCurrent: 8000, fuelLevel: 56, status: "on-trip", nextService: "Jul 30", fuelType: "Electric" },
];

const INITIAL_DRIVERS: Driver[] = [
  { id: "D-201", name: "Alex Chen", licenseType: "CDL Class A", status: "available", rating: 4.9, hoursRemaining: 12.5, avatarColor: "bg-cyan-500/30 text-cyan-200 border-cyan-400/50" },
  { id: "D-202", name: "Sarah Jenkins", licenseType: "CDL Class A", status: "on-trip", rating: 4.8, hoursRemaining: 4.0, avatarColor: "bg-emerald-500/30 text-emerald-200 border-emerald-400/50" },
  { id: "D-203", name: "Marcus Vance", licenseType: "CDL Class B (Suspended)", status: "suspended", rating: 3.2, hoursRemaining: 0.0, avatarColor: "bg-red-500/30 text-red-200 border-red-400/50" },
  { id: "D-204", name: "Elena Rostova", licenseType: "CDL Class A", status: "available", rating: 4.95, hoursRemaining: 13.8, avatarColor: "bg-indigo-500/30 text-indigo-200 border-indigo-400/50" },
  { id: "D-205", name: "David Kim", licenseType: "CDL Class A", status: "on-trip", rating: 4.7, hoursRemaining: 8.2, avatarColor: "bg-amber-500/30 text-amber-200 border-amber-400/50" },
];

const INITIAL_TRIPS: Trip[] = [
  { id: "TRIP-301", source: "LAX", destination: "SEA", vehicleId: "V-102", driverId: "D-202", cargo: "Microchips & Batteries", weight: 4400, progress: 45, speed: 64 },
  { id: "TRIP-302", source: "DFW", destination: "ATL", vehicleId: "V-106", driverId: "D-205", cargo: "Aerospace Components", weight: 8000, progress: 72, speed: 58 },
];

const INITIAL_FUEL_LOGS: FuelLog[] = [
  { id: "F-501", vehicleId: "V-101", date: "Jul 11, 08:30", amountAdded: "150 kWh (Megacharge)", cost: 45.00, location: "LA Super-hub" },
  { id: "F-502", vehicleId: "V-103", date: "Jul 10, 14:15", amountAdded: "120 Gal (Ultra Diesel)", cost: 492.00, location: "Dallas Travel Oasis" },
  { id: "F-503", vehicleId: "V-102", date: "Jul 10, 19:40", amountAdded: "65 kWh (Fastcharge)", cost: 21.45, location: "SF Central Depot" },
  { id: "F-504", vehicleId: "V-105", date: "Jul 09, 11:10", amountAdded: "180 kWh (Megacharge)", cost: 54.00, location: "Chicago Terminal East" },
];

const INITIAL_MAINTENANCE_LOGS: MaintenanceLog[] = [
  { id: "M-601", vehicleId: "V-104", date: "Scheduled Today", description: "Brake Rotor Calibration & Battery Diagnostics", cost: 1250.00, status: "In-Shop" },
  { id: "M-602", vehicleId: "V-103", date: "Jul 09", description: "Class-8 Engine Lubricant & Air Filter Exchange", cost: 480.00, status: "Completed" },
  { id: "M-603", vehicleId: "V-101", date: "Jul 08", description: "Cabin Thermal Management Inspection", cost: 310.00, status: "Completed" },
  { id: "M-604", vehicleId: "V-105", date: "Jul 15 (Scheduled)", description: "HV Cable Insulation Wear Assessment", cost: 850.00, status: "Scheduled" },
];

export default function App() {
  // --- STATE ENGINES ---
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [activeTrips, setActiveTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(INITIAL_FUEL_LOGS);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(INITIAL_MAINTENANCE_LOGS);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- AUTHENTICATION STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ email: string; role: "manager" | "driver" | "safety" | "finance" } | null>(null);

  // --- LOGIN FORM STATES ---
  const [loginEmail, setLoginEmail] = useState<string>("ronakskaka08@gmail.com");
  const [loginPassword, setLoginPassword] = useState<string>("••••••••");
  const [loginRole, setLoginRole] = useState<"manager" | "driver" | "safety" | "finance">("manager");

  const [currentTime, setCurrentTime] = useState<string>("");

  // --- TIME CLOCK SIMULATOR ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- TRANSIT PIPELINE RADAR PROGRESS SIMULATOR ---
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTrips((prevTrips) => {
        const nextTrips = prevTrips.map((trip) => {
          if (trip.progress < 100) {
            const increment = parseFloat((Math.random() * 1.5 + 0.8).toFixed(1));
            const nextProgress = Math.min(100, trip.progress + increment);
            return { ...trip, progress: nextProgress };
          }
          return trip;
        });

        // Trigger safety releases on completion
        nextTrips.forEach((trip) => {
          if (trip.progress >= 100 && !trip.completedTriggered) {
            trip.completedTriggered = true;
            
            setVehicles((vPrev) =>
              vPrev.map((v) => (v.id === trip.vehicleId ? { ...v, status: "available", capacityCurrent: 0 } : v))
            );
            setDrivers((dPrev) =>
              dPrev.map((d) => (d.id === trip.driverId ? { ...d, status: "available" } : d))
            );

            addToast(
              `Trip TRIP-${trip.id.split("-")[1]} from ${trip.source} to ${trip.destination} has reached destination. Payload secure.`,
              "success"
            );
            playSound("success");
          }
        });

        return nextTrips.filter((t) => t.progress < 100);
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  // --- TOAST SERVICE ---
  const addToast = (message: string, type: "success" | "error" | "warning" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- GLOBAL MUTATOR ACTIONS ---
  const triggerEmergencyRepair = (vehicleId: string) => {
    playSound("click");
    const v = vehicles.find((v) => v.id === vehicleId);
    if (!v) return;

    if (v.status === "in-shop") {
      addToast(`MAINTENANCE: ${v.name} is already inside the repair docks.`, "info");
      return;
    }

    if (v.status === "on-trip") {
      playSound("error");
      addToast(`SAFETY WARNING: Vehicle ${v.name} is currently active on a transit node.`, "warning");
      return;
    }

    setVehicles((prev) =>
      prev.map((item) => (item.id === vehicleId ? { ...item, status: "in-shop" } : item))
    );

    const mId = `M-${Math.floor(600 + Math.random() * 400)}`;
    const newMaint: MaintenanceLog = {
      id: mId,
      vehicleId,
      date: "Urgent (Today)",
      description: "Sensor Malfunction & Critical Powertrain Overhaul",
      cost: 2450.00,
      status: "In-Shop",
    };

    setMaintenanceLogs((prev) => [newMaint, ...prev]);
    addToast(`MAINTENANCE REDIRECT: ${v.name} pulled from operations into maintenance. Repair log initialized.`, "warning");
  };

  const resolveMaintenance = (maintId: string, vehicleId: string) => {
    playSound("click");
    setMaintenanceLogs((prev) =>
      prev.map((m) => (m.id === maintId ? { ...m, status: "Completed" } : m))
    );
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status: "available", fuelLevel: 100 } : v))
    );
    addToast(`MAINTENANCE COMPLETED: Vehicle ${vehicleId} certified road-ready. Returned to operational fleet.`, "success");
    playSound("success");
  };

  // --- AUTH SUBMIT ---
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      playSound("error");
      addToast("SECURITY ALARM: Credentials validation fields must not be empty.", "error");
      return;
    }

    setIsAuthenticated(true);
    setCurrentUser({ email: loginEmail, role: loginRole });
    playSound("success");
    addToast(`SECURE SESSION REIFIED: Access granted for Operator (${loginEmail}). Protocol level: ${loginRole.toUpperCase()}`, "success");
  };

  const handleLogOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    playSound("click");
    addToast("SECURE SESSION TERMINATED: Safe travels operator.", "info");
  };

  // --- RENDER ROUTER ELEMENT ---
  const renderDashboard = () => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case "manager":
        return (
          <FleetManagerDashboard 
            vehicles={vehicles}
            setVehicles={setVehicles}
            drivers={drivers}
            setDrivers={setDrivers}
            activeTrips={activeTrips}
            setActiveTrips={setActiveTrips}
            fuelLogs={fuelLogs}
            maintenanceLogs={maintenanceLogs}
            setMaintenanceLogs={setMaintenanceLogs}
            addToast={addToast}
            triggerEmergencyRepair={triggerEmergencyRepair}
            resolveMaintenance={resolveMaintenance}
          />
        );
      case "driver":
        return (
          <DriverDashboard 
            vehicles={vehicles}
            setVehicles={setVehicles}
            drivers={drivers}
            setDrivers={setDrivers}
            activeTrips={activeTrips}
            setActiveTrips={setActiveTrips}
            fuelLogs={fuelLogs}
            setFuelLogs={setFuelLogs}
            maintenanceLogs={maintenanceLogs}
            setMaintenanceLogs={setMaintenanceLogs}
            addToast={addToast}
            currentTime={currentTime}
          />
        );
      case "safety":
        return (
          <SafetyOfficerDashboard 
            drivers={drivers}
            setDrivers={setDrivers}
            addToast={addToast}
          />
        );
      case "finance":
        return (
          <FinancialAnalystDashboard 
            vehicles={vehicles}
            fuelLogs={fuelLogs}
            setFuelLogs={setFuelLogs}
            maintenanceLogs={maintenanceLogs}
            setMaintenanceLogs={setMaintenanceLogs}
            addToast={addToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="transitops_root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* GLOWING ABSTRACT SPACE-X BACKGROUND BLOBS */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-12 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* --- FLOATING TOAST SYSTEM --- */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-xl transition-all duration-300 animate-slide-in shadow-xl ${
              t.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-200 shadow-emerald-950/20"
                : t.type === "error"
                ? "bg-red-950/80 border-red-500/30 text-red-200 shadow-red-950/20"
                : t.type === "warning"
                ? "bg-amber-950/80 border-amber-500/30 text-amber-200 shadow-amber-950/20"
                : "bg-slate-900/90 border-slate-700/50 text-slate-200"
            }`}
          >
            {t.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {t.type === "warning" && <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {t.type === "info" && <Activity className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
            
            <div className="flex-1 text-xs leading-relaxed font-mono">
              {t.message}
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {!isAuthenticated ? (
        // ==================== AUTHENTICATION GATEWAY ====================
        <div className="min-h-screen flex flex-col justify-center items-center p-6">
          <div className="max-w-md w-full bg-[#090b1c]/80 backdrop-blur-2xl rounded-3xl border border-slate-800/80 p-8 shadow-[0_0_50px_rgba(6,182,212,0.04)] relative overflow-hidden flex flex-col items-center gap-6 z-10 transition-all duration-500">
            
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

            {/* Logistics Icon Header */}
            <div className="flex flex-col items-center gap-2">
              <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/25 glow-cyan shadow-[0_0_15px_rgba(34,211,238,0.15)]" style={{ animationDuration: "3s" }}>
                <Compass className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-center mt-2">
                <h2 className="font-display font-black text-xl tracking-wider text-white">TRANSITOPS</h2>
                <span className="text-[9px] font-mono font-bold tracking-widest bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 inline-block mt-1">
                  OPERATIONS GATEWAY
                </span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="w-full space-y-4 font-mono text-xs">
              
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 tracking-wider block">OPERATOR EMAIL ADDRESS</label>
                <input 
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@transitops.com"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-cyan-500/25 px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 tracking-wider block">SECURE CREDENTIAL LOCK</label>
                <input 
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 hover:border-cyan-500/25 px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 tracking-wider block">OPERATIONAL PROFILE SECURITY ROLE</label>
                <select 
                  value={loginRole} 
                  onChange={(e) => setLoginRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 hover:border-cyan-500/25 px-3 py-2.5 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                >
                  <option value="manager">Fleet Manager</option>
                  <option value="driver">Driver Portal</option>
                  <option value="safety">Safety Officer</option>
                  <option value="finance">Financial Analyst</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-3 bg-cyan-500 text-slate-950 font-black rounded-xl tracking-wider font-mono text-[11px] shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 active:scale-95 transition-all duration-300 mt-2 glow-cyan cursor-pointer"
              >
                INITIALIZE TRANSIT PROTOCOLS
              </button>

            </form>

            {/* Secure Handshake Notice */}
            <div className="text-center text-[9px] text-slate-500 font-mono mt-2 flex items-center justify-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>SECURE LINK COMPLIANCE VERIFICATION // [DOT-749]</span>
            </div>

          </div>
        </div>
      ) : (
        // ==================== DASHBOARD PORTAL SHELL ====================
        <>
          {/* --- HEADER CONTROLS --- */}
          <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Logo & Platform Status */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 glow-cyan">
                  <Compass className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: "20s" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display font-bold text-xl tracking-wider text-white">TRANSITOPS</h1>
                    <span className="text-[10px] font-mono font-bold tracking-widest bg-cyan-950/60 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                      V.3.8-PROTOTYPE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SYSTEM STATUS: SECURE // {currentTime}
                  </p>
                </div>
              </div>

              {/* User ID & Role Switcher Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                {/* Operator Telemetry Tag */}
                <div className="flex items-center gap-2.5 bg-[#0d1127]/60 border border-slate-800/80 rounded-xl px-3.5 py-2 text-[11px] font-mono text-slate-400">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="text-slate-500">OPERATOR:</span>
                  <span className="text-cyan-400 font-bold max-w-[150px] truncate">{currentUser?.email}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/25 font-bold uppercase">
                    {currentUser?.role === "manager" ? "Fleet Manager" : currentUser?.role === "driver" ? "Driver Portal" : currentUser?.role === "safety" ? "Safety Officer" : "Financial Analyst"}
                  </span>
                </div>

                {/* SECURE LOG OUT BUTTON */}
                <button
                  onClick={handleLogOut}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-950/30 hover:bg-red-950/50 text-red-400 hover:text-red-300 rounded-xl text-xs font-mono border border-red-500/30 transition-all duration-300 cursor-pointer font-bold shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.05)]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>LOG OUT</span>
                </button>
              </div>

            </div>
          </header>

          {/* --- MAIN OPERATIONAL AREA --- */}
          <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {renderDashboard()}
          </main>

          {/* --- BOTTOM SYSTEM BAR (METADATA STATS) --- */}
          <footer className="border-t border-slate-900 py-3 px-6 bg-slate-950/90 text-slate-500 font-mono text-[9px] z-30">
            <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
              <div className="flex items-center gap-4">
                <span>SYS: TRANSITOPS LOGISTICS COMMAND CENTER // CONNECTED</span>
                <span className="hidden sm:inline">● COMPLIANCE SECURE [DOT CERTIFIED]</span>
                <span className="hidden lg:inline text-cyan-400">● PORT AGGREGATE ENCRYPTED</span>
              </div>
              <div>
                <span>PROT-ENGINE V.3.8 // © {new Date().getFullYear()} TRANSITOPS LOGISTICS PROTOCOLS</span>
              </div>
            </div>
          </footer>
        </>
      )}

    </div>
  );
}
