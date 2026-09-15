import React from 'react';
import { Lock, ShieldX, AlertTriangle, RefreshCw } from 'lucide-react';

export default function LockoutModal({ tabSwitchCount, onAdminClick }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500/60 rounded-2xl p-6 sm:p-10 shadow-2xl text-center overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-20 h-20 rounded-3xl bg-red-950/90 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-500/30">
          <ShieldX className="w-10 h-10 text-red-400" />
        </div>

        <h3 className="font-heading text-3xl font-extrabold text-white mb-2">
          Quiz Terminated & Locked
        </h3>
        
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-semibold mb-6">
          <Lock className="w-3.5 h-3.5" />
          <span>Maximum Security Violations Reached ({tabSwitchCount})</span>
        </div>

        <p className="text-sm text-slate-300 mb-6 leading-relaxed">
          Your quiz session has been automatically submitted and terminated due to exceeding the maximum permitted window defocus / tab switch limit (3 warnings).
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-left space-y-2 mb-8 font-mono">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span>Security Flag:</span>
            <span className="text-red-400 font-bold">TAB_SWITCH_LIMIT_EXCEEDED</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Action Taken:</span>
            <span className="text-amber-400">AUTO_SUBMITTED_LOCAL_STATE</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <p className="text-xs text-slate-500">
            If you believe this was an error or system glitch, please contact the FunTech Society invigilators.
          </p>

          <button
            onClick={() => {
              if (onAdminClick) onAdminClick();
            }}
            className="mt-2 text-xs text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
          >
            Invigilator / Admin Portal Access
          </button>
        </div>

      </div>
    </div>
  );
}
