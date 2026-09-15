import React from 'react';
import { AlertOctagon, ShieldAlert, ArrowRight } from 'lucide-react';

export default function WarningModal({ tabSwitchCount, maxTabSwitches, onDismiss }) {
  const remaining = maxTabSwitches - tabSwitchCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl text-center overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/20">
          <AlertOctagon className="w-8 h-8 text-amber-400 animate-bounce" />
        </div>

        <h3 className="font-heading text-2xl font-bold text-white mb-2">
          Security Violation Detected!
        </h3>
        
        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          You navigated away or switched browser tabs during the active assessment session.
        </p>

        {/* Counter Badge */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-6 flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-semibold text-slate-400">Recorded Violations</p>
            <p className="text-xs text-amber-400 font-medium mt-0.5">
              Warning {tabSwitchCount} of {maxTabSwitches}
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-2xl font-extrabold text-amber-400">{remaining}</span>
            <p className="text-[10px] text-slate-500">Attempt(s) Left</p>
          </div>
        </div>

        <p className="text-xs text-red-400 font-semibold mb-6">
          ⚠️ Note: On your 4th violation (warning {tabSwitchCount} of {maxTabSwitches - 1}), your quiz session will be auto-submitted and locked immediately.
        </p>

        <button
          onClick={onDismiss}
          className="w-full py-3.5 px-6 rounded-xl font-heading font-semibold text-sm text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <span>Return to Fullscreen Quiz</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
}
