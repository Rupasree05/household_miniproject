import React from 'react';

export default function LoadingSpinner({ message = "Loading analytics...", subMessage }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-2 border-slate-800 border-t-electric-400 border-r-emerald-400 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-electric-400 animate-ping"></div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-200 tracking-wide">{message}</p>
        {subMessage && <p className="text-xs text-slate-400 mt-1">{subMessage}</p>}
      </div>
    </div>
  );
}

