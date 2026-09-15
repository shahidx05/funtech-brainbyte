import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cpu, Wifi, Activity, Terminal } from 'lucide-react';
import funtechLogo from "../assets/funtech-logo2.png";
import axios from 'axios';

export default function Navbar({ participant, stage, onToggleAdmin }) {
  const [serverHealth, setServerHealth] = useState('checking');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get('/health');
        if (res.data && res.data.success) {
          setServerHealth('healthy');
        } else {
          setServerHealth('degraded');
        }
      } catch (err) {
        setServerHealth('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          {/* <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div> */}
          <div className="w-10 h-10 rounded-xl ">
          <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center overflow-hidden">
            <img
              src={funtechLogo}
              alt="FunTech Logo"
              className="w-9 h-9 object-contain"
            />
          </div>
        </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-heading text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-200 to-purple-400">
                FunTech
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 rounded-md">
                BrainByte '26
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Annual Freshman Tech Assessment</p>
          </div>
        </div>

        
        

        {/* Participant Profile / Stage Status & Admin Switcher */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleAdmin}
            className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold hover:bg-purple-900/60 transition cursor-pointer flex items-center space-x-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Admin Portal</span>
          </button>

          {participant ? (
            <div className="flex items-center space-x-3 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-heading font-bold text-indigo-300 text-xs uppercase">
                {participant.name ? participant.name.charAt(0) : 'S'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 line-clamp-1">{participant.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{participant.rollNumber || participant.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/80">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>Portal Ready</span>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
