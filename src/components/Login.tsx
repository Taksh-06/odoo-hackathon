import React, { useState } from "react";
import { Compass, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { playSound } from "../types";

interface LoginProps {
  onLogin: (email: string, password: string, role: "manager" | "driver" | "safety" | "finance") => Promise<boolean>;
  addToast: (message: string, type: "success" | "error" | "warning" | "info") => void;
}

export default function Login({ onLogin, addToast }: LoginProps) {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState<string>("ronakskaka08@gmail.com");
  const [loginPassword, setLoginPassword] = useState<string>("password");
  const [loginRole, setLoginRole] = useState<"manager" | "driver" | "safety" | "finance">("manager");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound("click");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      playSound("error");
      addToast("SECURITY ALARM: Credentials validation fields must not be empty.", "error");
      return;
    }

    const success = await onLogin(loginEmail, loginPassword, loginRole);
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* GLOWING ABSTRACT SPACE-X BACKGROUND BLOBS */}
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-indigo-600/10 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[550px] h-[550px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-12 w-[350px] h-[350px] bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />

      {/* ==================== AUTHENTICATION GATEWAY ==================== */}
      <div className="max-w-md w-full bg-white/80 dark:bg-[#090b1c]/80 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800/80 p-8 shadow-[0_0_50px_rgba(6,182,212,0.04)] relative overflow-hidden flex flex-col items-center gap-6 z-10 transition-all duration-500">
        
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl" />

        {/* Logistics Icon Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/25 glow-cyan shadow-[0_0_15px_rgba(34,211,238,0.15)]" style={{ animationDuration: "3s" }}>
            <Compass className="w-8 h-8 text-cyan-400" />
          </div>
          <div className="text-center mt-2">
            <h2 className="font-display font-black text-xl tracking-wider text-slate-900 dark:text-white">TRANSITOPS</h2>
            <span className="text-[9px] font-mono font-bold tracking-widest bg-cyan-950/60 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 inline-block mt-1">
              OPERATIONS GATEWAY
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLoginSubmit} className="w-full space-y-4 font-mono text-xs">
          
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-600 dark:text-slate-400 tracking-wider block">OPERATOR EMAIL ADDRESS</label>
            <input 
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              placeholder="name@transitops.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/25 px-3 py-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-600 dark:text-slate-400 tracking-wider block">SECURE CREDENTIAL LOCK</label>
            <input 
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/25 px-3 py-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-600 dark:text-slate-400 tracking-wider block">OPERATIONAL PROFILE SECURITY ROLE</label>
            <select 
              value={loginRole} 
              onChange={(e) => setLoginRole(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/25 px-3 py-2.5 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
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
        <div className="text-center text-[9px] text-slate-600 dark:text-slate-400 font-mono mt-2 flex items-center justify-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>SECURE LINK COMPLIANCE VERIFICATION // [DOT-749]</span>
        </div>

      </div>
    </div>
  );
}
