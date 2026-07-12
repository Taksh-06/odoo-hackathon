/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  ShieldCheck, 
  UserMinus, 
  UserPlus, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Search,
  Compass,
  Star
} from "lucide-react";
import { Driver, playSound } from "../types";

interface SafetyOfficerDashboardProps {
  drivers: Driver[];
  setDrivers: React.Dispatch<React.SetStateAction<Driver[]>>;
  addToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function SafetyOfficerDashboard({
  drivers,
  setDrivers,
  addToast
}: SafetyOfficerDashboardProps) {

  // --- ACTIONS: SUSPEND / RECONCILE CDL CREDENTIALS ---
  const handleToggleSuspension = (driverId: string) => {
    playSound("click");
    const d = drivers.find((driver) => driver.id === driverId);
    if (!d) return;

    const isCurrentlySuspended = d.status === "suspended";
    const nextStatus = isCurrentlySuspended ? "available" : "suspended";

    fetch(`/api/drivers/${driverId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update driver status");
        
        if (nextStatus === "suspended") {
          playSound("error");
          addToast(`SAFETY PROTOCOL: CDL Credentials revoked for ${d.name} (${driverId}). Driver suspended.`, "error");
        } else {
          playSound("success");
          addToast(`COMPLIANCE APPR: CDL Credentials reinstated for ${d.name} (${driverId}).`, "success");
        }
      })
      .catch((err) => {
        playSound("error");
        addToast(err.message || "Failed to toggle driver suspension", "error");
      });
  };

  // --- STATS FOR COMPLIANCE BOARD ---
  const totalDriversCount = drivers.length;
  const suspendedDriversCount = drivers.filter(d => d.status === "suspended").length;
  const activeDriversCount = totalDriversCount - suspendedDriversCount;
  const averageSafetyScore = (drivers.reduce((sum, d) => sum + d.rating, 0) / totalDriversCount).toFixed(2);

  // Helper to resolve license expiration warning dates
  const getLicenseExpirationDate = (driverId: string) => {
    switch (driverId) {
      case "D-201": return "Oct 24, 2027";
      case "D-202": return "Jan 12, 2028";
      case "D-203": return "Expired (Suspended)";
      case "D-204": return "Jun 18, 2026";
      case "D-205": return "Dec 05, 2027";
      default: return "Jul 15, 2027";
    }
  };

  return (
    <>
      {/* 1. TOP COMPLIANCE STRIP */}
      <section id="safety_metrics" className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Fleet Safety Score */}
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              FLEET SAFETY AVERAGE
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">{averageSafetyScore} <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">/ 5.0</span></h2>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> DOT Class I
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Weighted average rating of active CDL operators.</p>
          </div>
        </div>

        {/* Card 2: Revoked / Suspended Licenses */}
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-red-400 tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              SUSPENDED CDL OPERATORS
            </span>
            <div className="flex items-baseline gap-2">
              <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">{suspendedDriversCount} <span className="text-sm text-slate-600 dark:text-slate-400 font-normal">/ {totalDriversCount} seat-limits</span></h2>
              {suspendedDriversCount > 0 ? (
                <span className="text-[10px] text-amber-500 font-mono animate-pulse font-bold">
                  ● MONITORING LIMITS
                </span>
              ) : (
                <span className="text-[10px] text-emerald-500 font-mono">
                  ● ALL CLEAR
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Total credentials blocked due to license expiry or safety issues.</p>
          </div>
        </div>

        {/* Card 3: Live Compliance Auditing */}
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-5 rounded-2xl border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-indigo-400 tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              DOT FMCSA COMPLIANCE STATUS
            </span>
            <div className="flex items-baseline justify-between">
              <h2 className="text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">ACTIVE</h2>
              <span className="text-[11px] font-mono text-indigo-400">100% ELD SYNC</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Hours of Service (HOS) logs synchronized via live telemetry feed.</p>
          </div>
        </div>

      </section>

      {/* 2. FLEET DRIVER COMPLIANCE GRID (Cols: 8) */}
      <section id="safety_drivers_grid" className="lg:col-span-8 h-full">
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 h-full">
          
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200">FLEET CDL COMPLIANCE REGISTRY</h3>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Verify state licensing status, FMCSA limits, and toggle operator suspensions</p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              {activeDriversCount} active CDL cards
            </span>
          </div>

          {/* Grid of Drivers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
            {drivers.map((driver) => {
              const isSuspended = driver.status === "suspended";
              const expDate = getLicenseExpirationDate(driver.id);
              
              // Safety Rating Evaluation
              let ratingColor = "text-emerald-400";
              let ratingText = "EXCELLENT";
              if (driver.rating < 4.5 && driver.rating >= 3.8) {
                ratingColor = "text-amber-400";
                ratingText = "MONITORED";
              } else if (driver.rating < 3.8) {
                ratingColor = "text-red-400";
                ratingText = "CRITICAL RISK";
              }

              return (
                <div 
                  key={driver.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3.5 relative overflow-hidden ${
                    isSuspended 
                      ? "bg-red-950/10 border-red-500/20" 
                      : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Driver Avatar */}
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono text-sm font-bold shrink-0 ${driver.avatarColor}`}>
                      {driver.name.split(" ").map(n => n[0]).join("")}
                    </div>

                    {/* Driver Title Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-display font-semibold text-slate-900 dark:text-slate-100 truncate">{driver.name}</h4>
                        <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded border uppercase tracking-wider shrink-0 ${
                          driver.status === "available"
                            ? "bg-emerald-950/60 border-emerald-500/20 text-emerald-400"
                            : driver.status === "on-trip"
                            ? "bg-cyan-950/60 border-cyan-500/20 text-cyan-400"
                            : "bg-red-950/60 border-red-500/20 text-red-400 animate-pulse"
                        }`}>
                          {driver.status}
                        </span>
                      </div>
                      <p className="text-[9.5px] font-mono text-slate-600 dark:text-slate-400">ID: {driver.id} // HOS Limit: {driver.hoursRemaining} hrs</p>
                    </div>
                  </div>

                  {/* License and Safety Stats details */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50/80 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-900 rounded-xl font-mono text-[10px]">
                    <div>
                      <span className="block text-slate-600 dark:text-slate-400 text-[8px] uppercase">LICENSE CLASSIFICATION</span>
                      <span className={`font-semibold ${isSuspended ? "text-red-400 line-through" : "text-slate-700 dark:text-slate-300"}`}>
                        {driver.licenseType.replace(" (Suspended)", "")}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-600 dark:text-slate-400 text-[8px] uppercase">LICENSE EXPIRATION</span>
                      <span className={`font-semibold ${isSuspended ? "text-red-400 font-bold" : "text-slate-700 dark:text-slate-300"}`}>
                        {expDate}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-600 dark:text-slate-400 text-[8px] uppercase">TELEMETRY SCORE</span>
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {driver.rating}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-600 dark:text-slate-400 text-[8px] uppercase">RISK LEVEL ASSESSMENT</span>
                      <span className={`font-black ${ratingColor}`}>{ratingText}</span>
                    </div>
                  </div>

                  {/* Toggle Suspension button */}
                  <button
                    onClick={() => handleToggleSuspension(driver.id)}
                    className={`w-full py-2.5 rounded-xl font-bold font-mono text-[10px] tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isSuspended
                        ? "bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50"
                        : "bg-red-950/30 hover:bg-red-950/50 text-red-400 border-red-500/30 hover:border-red-500/50"
                    }`}
                  >
                    {isSuspended ? (
                      <>
                        <UserPlus className="w-3.5 h-3.5" /> REINSTATE CDL CREDENTIALS
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-3.5 h-3.5" /> REVOKE & SUSPEND CDL
                      </>
                    )}
                  </button>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 3. SAFETY COMPLIANCE ENG PROTOCOL BOARD (Cols: 4) */}
      <section id="safety_checklists" className="lg:col-span-4 h-full">
        <div className="bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4 h-full">
          
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-slate-800 dark:text-slate-200">DOT AUDIT ENGINE</h3>
              <p className="text-[9px] text-slate-600 dark:text-slate-400 font-mono">Electronic safety checklist verification</p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs font-mono">
            
            <div className="p-3 bg-slate-50/60 dark:bg-slate-950/60 rounded-xl border border-slate-300 dark:border-slate-900 flex items-center gap-3">
              <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-slate-700 dark:text-slate-300 font-bold">ELD SYNC ENGINE</span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400">Live Hours of Service tracking active</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/60 dark:bg-slate-950/60 rounded-xl border border-slate-300 dark:border-slate-900 flex items-center gap-3">
              <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-slate-700 dark:text-slate-300 font-bold">CLEARINGHOUSE STATUS</span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400">Active records verified via FMCSA database</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/60 dark:bg-slate-950/60 rounded-xl border border-slate-300 dark:border-slate-900 flex items-center gap-3">
              <div className="p-1.5 rounded bg-amber-950/60 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] text-slate-700 dark:text-slate-300 font-bold">ANNUAL VEHICLE INSPECTIONS</span>
                <span className="text-[9px] text-slate-600 dark:text-slate-400">2 registry assets due for standard inspection</span>
              </div>
            </div>

            <div className="p-4 bg-indigo-950/10 border border-indigo-500/10 rounded-2xl space-y-2 mt-4 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="text-[9px] font-mono font-bold text-indigo-400 tracking-wider uppercase block">
                SAFETY BOARD BRIEFING
              </span>
              <p>
                As a Safety Officer, you have the authority to suspend or reinstate any CDL driver dynamically. Revoking CDL credentials immediately prevents them from being assigned to any active cargo manifests or trips during the Launch Dispatch workflow.
              </p>
            </div>

          </div>

        </div>
      </section>
    </>
  );
}
