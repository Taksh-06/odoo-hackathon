import React, { useState, useEffect } from "react";
import { Compass, LogIn, ArrowRight, ShieldCheck, Activity, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

export default function Home() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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
          <div className="flex items-center gap-3">
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

          {/* Navigation & Action */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <ThemeToggle />
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-slate-950 font-black rounded-xl tracking-wider font-mono text-[11px] shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 active:scale-95 transition-all duration-300 glow-cyan cursor-pointer uppercase"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In to Gateway</span>
            </button>
          </div>

        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full flex flex-col justify-center items-center px-6 py-20 z-10">
        <div className="max-w-4xl w-full text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-cyan-400 text-xs font-mono font-bold mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            NEXT-GEN FLEET OPERATIONS
          </div>

          <h2 className="font-display font-black text-5xl md:text-7xl tracking-tight text-slate-900 dark:text-white leading-tight">
            Logistics Command <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Reimagined.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Unify your fleet operations, driver management, and financial analytics in a single, high-performance command center. 
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate("/login")}
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-cyan-500 text-slate-950 font-black rounded-xl tracking-wider font-mono text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-400 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            >
              <span>ACCESS PLATFORM</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20">
            <div className="p-6 rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm text-left">
              <Activity className="w-8 h-8 text-emerald-400 mb-4" />
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Real-Time Telemetry</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Monitor vehicle health, fuel levels, and active route progress with millisecond precision.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm text-left">
              <ShieldCheck className="w-8 h-8 text-cyan-400 mb-4" />
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">DOT Compliance</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Automated tracking for driver hours and mandatory maintenance schedules ensuring full safety.</p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-100/40 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/50 backdrop-blur-sm text-left">
              <Globe className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-2">Global Operations</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Command fleets across continents from a centralized, unified operational interface.</p>
            </div>
          </div>

        </div>
      </main>
      
      {/* --- BOTTOM SYSTEM BAR (METADATA STATS) --- */}
      <footer className="border-t border-slate-300 dark:border-slate-900 py-3 px-6 bg-slate-50/90 dark:bg-slate-50/90 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 font-mono text-[9px] z-30 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-center md:text-left">
          <div className="flex items-center gap-4">
            <span>SYS: TRANSITOPS LOGISTICS COMMAND CENTER // DISCONNECTED</span>
            <span className="hidden sm:inline">● AWAITING OPERATOR AUTH</span>
          </div>
          <div>
            <span>PROT-ENGINE V.3.8 // © {new Date().getFullYear()} TRANSITOPS LOGISTICS PROTOCOLS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
