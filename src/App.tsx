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
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import DashboardLayout from "./components/DashboardLayout";

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("transitops_auth") === "true";
  });
  const [currentUser, setCurrentUser] = useState<{ email: string; role: "manager" | "driver" | "safety" | "finance" } | null>(() => {
    const saved = localStorage.getItem("transitops_user");
    return saved ? JSON.parse(saved) : null;
  });

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
  const handleLogin = (email: string, role: "manager" | "driver" | "safety" | "finance") => {
    setIsAuthenticated(true);
    const userObj = { email, role };
    setCurrentUser(userObj);
    localStorage.setItem("transitops_auth", "true");
    localStorage.setItem("transitops_user", JSON.stringify(userObj));
  };

  const handleLogOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem("transitops_auth");
    localStorage.removeItem("transitops_user");
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
    <Router>
      <div id="transitops_root" className="min-h-screen font-sans">
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
                  : "bg-white dark:bg-white/90 dark:bg-slate-900/90 border-slate-300/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200"
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
                className="text-slate-400 hover:text-slate-900 dark:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLogin={handleLogin} addToast={addToast} />} />
          <Route element={<DashboardLayout currentUser={currentUser} onLogOut={handleLogOut} />}>
            <Route path="/dashboard" element={renderDashboard()} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}
