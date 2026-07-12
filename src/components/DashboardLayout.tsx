import React, { useState, useEffect } from "react";
import { Compass, UserCheck, LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

interface DashboardLayoutProps {
  currentUser: { email: string; role: "manager" | "driver" | "safety" | "finance" } | null;
  onLogOut: () => void;
}

export default function DashboardLayout({ currentUser, onLogOut }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* GLOWING ABSTRACT SPACE-X BACKGROUND BLOBS */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-12 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* --- HEADER CONTROLS --- */}
      <header className="border-b border-slate-300 dark:border-slate-900 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Platform Status */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 glow-cyan">
              <Compass className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: "20s" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-xl tracking-wider text-slate-900 dark:text-white">TRANSITOPS</h1>
                <span className="text-[10px] font-mono font-bold tracking-widest bg-cyan-950/60 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  V.3.8-PROTOTYPE
                </span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM STATUS: SECURE // {currentTime}
              </p>
            </div>
          </div>

          {/* User ID & Role Switcher Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <ThemeToggle />
            
            {/* Operator Telemetry Tag */}
            <div className="flex items-center gap-2.5 bg-slate-100/60 dark:bg-[#0d1127]/60 border border-slate-200 dark:border-slate-800/80 rounded-xl px-3.5 py-2 text-[11px] font-mono text-slate-600 dark:text-slate-400">
              <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-slate-600 dark:text-slate-400">OPERATOR:</span>
              <span className="text-cyan-400 font-bold max-w-[150px] truncate">{currentUser.email}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/25 font-bold uppercase">
                {currentUser.role === "manager" ? "Fleet Manager" : currentUser.role === "driver" ? "Driver Portal" : currentUser.role === "safety" ? "Safety Officer" : "Financial Analyst"}
              </span>
            </div>

            {/* SECURE LOG OUT BUTTON */}
            <button
              onClick={() => {
                onLogOut();
                navigate("/");
              }}
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
        <Outlet />
      </main>

      {/* --- BOTTOM SYSTEM BAR (METADATA STATS) --- */}
      <footer className="border-t border-slate-300 dark:border-slate-900 py-3 px-6 bg-slate-50/90 dark:bg-slate-50/90 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 font-mono text-[9px] z-30 mt-auto">
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
    </div>
  );
}
