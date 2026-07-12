/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- SHARED TYPE DEFINITIONS ---

export interface Hub {
  id: string;
  name: string;
  city: string;
  x: number;
  y: number;
}

export interface Vehicle {
  id: string;
  name: string;
  type: string;
  capacityMax: number; // kg
  capacityCurrent: number; // kg
  fuelLevel: number; // % (Battery/Diesel)
  status: "available" | "in-shop" | "on-trip";
  nextService: string;
  fuelType: "Electric" | "Diesel";
}

export interface Driver {
  id: string;
  name: string;
  licenseType: string;
  status: "available" | "on-trip" | "suspended";
  rating: number;
  hoursRemaining: number; // Hours remaining in daily shift
  avatarColor: string;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  driverId: string;
  vehicleId: string;
  cargo: string;
  weight: number; // kg
  progress: number; // 0 - 100
  speed: number; // mph
  completedTriggered?: boolean;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string;
  amountAdded: string;
  cost: number;
  location: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  date: string;
  description: string;
  cost: number;
  status: "Completed" | "In-Shop" | "Scheduled";
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
}

// --- STATIC DATA CONFIGS ---
export const HUBS: Hub[] = [
  { id: "SEA", name: "Seattle Terminal", city: "Seattle", x: 60, y: 40 },
  { id: "SFO", name: "SF Depot", city: "San Francisco", x: 45, y: 110 },
  { id: "LAX", name: "LA Port", city: "Los Angeles", x: 65, y: 190 },
  { id: "DEN", name: "Denver Hub", city: "Denver", x: 190, y: 90 },
  { id: "DFW", name: "Houston Port", city: "Houston", x: 290, y: 220 },
  { id: "ORD", name: "Chicago Center", city: "Chicago", x: 370, y: 65 },
  { id: "ATL", name: "Atlanta Depot", city: "Atlanta", x: 430, y: 175 },
  { id: "JFK", name: "NY Terminal", city: "New York", x: 530, y: 55 },
  { id: "MIA", name: "Miami Gateway", city: "Miami", x: 500, y: 245 },
];

export const HUB_CONNECTIONS = [
  { from: "SEA", to: "SFO" },
  { from: "SFO", to: "LAX" },
  { from: "SFO", to: "DEN" },
  { from: "LAX", to: "DFW" },
  { from: "DEN", to: "ORD" },
  { from: "DFW", to: "ATL" },
  { from: "ORD", to: "JFK" },
  { from: "ATL", to: "JFK" },
  { from: "ATL", to: "MIA" },
  { from: "ORD", to: "ATL" },
  { from: "DEN", to: "DFW" },
];

// --- CUSTOM WEB AUDIO SYNTHESIZER FOR HIGH-TECH SOUND EFFECTS ---
export const playSound = (type: "click" | "success" | "error" | "ambient" | "launch") => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "success") {
      const now = ctx.currentTime;
      [587.33, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.05, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.25);
      });
    } else if (type === "error") {
      const now = ctx.currentTime;
      [150, 130].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.06, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.22);
      });
    } else if (type === "launch") {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.45);
    }
  } catch (e) {
    console.warn("Web Audio Context not authorized or initialized", e);
  }
};
