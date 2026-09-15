import React from 'react';
import { Clock, Radio, Sparkles, RefreshCw } from 'lucide-react';

export default function WaitingRoom({ participant, onCheckLive, checking }) {
  return (
    <div className="w-full max-w-xl mx-auto py-12 px-4">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
        
        {/* Glowing Background Blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Pulse Live Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-6">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>QUIZ WAITING ROOM</span>
        </div>

        {/* Icon Animation */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-inner relative">
          <Clock className="w-10 h-10 text-amber-400 animate-bounce" />
          <Sparkles className="w-4 h-4 text-amber-300 absolute top-2 right-2 animate-spin" />
        </div>

        {/* Header */}
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white">
          Quiz Has Not Started Yet
        </h2>
        <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          Welcome <span className="text-cyan-400 font-semibold">{participant?.name || 'Participant'}</span>! Please stay on this screen. The questions will become available as soon as the Admin makes the quiz live.
        </p>

        {/* Info Card */}
        <div className="mt-8 p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span>Status:</span>
            <span className="text-amber-400 font-bold font-mono">Waiting for Host...</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Automatic Sync:</span>
            <span className="text-emerald-400 font-bold font-mono">Checking status...</span>
          </div>
        </div>

        {/* Manual Refresh Button */}
        <div className="mt-8">
          <button
            onClick={onCheckLive}
            disabled={checking}
            className="w-full py-3.5 px-6 rounded-2xl font-heading font-semibold text-xs text-slate-950 bg-gradient-to-r from-amber-400 to-amber-200 hover:from-amber-300 hover:to-white flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <RefreshCw className={`w-4 h-4 text-slate-950 ${checking ? 'animate-spin' : ''}`} />
            <span>Check Quiz Status Now</span>
          </button>
        </div>

      </div>
    </div>
  );
}
