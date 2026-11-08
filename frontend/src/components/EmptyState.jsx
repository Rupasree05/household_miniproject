import React from 'react';
import { Link } from 'react-router-dom';
import { Database, UploadCloud, Sparkles, ArrowRight } from 'lucide-react';

export default function EmptyState({
  title = "No Dataset Available",
  description = "To generate forecasts, optimize load schedules, and view energy intelligence analytics, please upload a smart-meter consumption dataset.",
  onLoadDemo,
  loadingDemo = false
}) {
  return (
    <div className="p-12 rounded-2xl bg-navy-900/60 border border-slate-800/90 text-center max-w-2xl mx-auto my-12 shadow-xl relative overflow-hidden backdrop-blur-md">
      {/* Background glow circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-electric-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-electric-500/10 border border-electric-500/20 flex items-center justify-center text-electric-400">
        <Database className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">{description}</p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/upload"
          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-electric-500 hover:bg-electric-400 text-white text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-electric-500/20 transition-all duration-150"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Dataset CSV</span>
        </Link>

        {onLoadDemo && (
          <button
            onClick={onLoadDemo}
            disabled={loadingDemo}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700/80 flex items-center justify-center space-x-2 transition-all duration-150 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{loadingDemo ? "Loading Demo..." : "Load 120-Day Demo Data"}</span>
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mt-6">
        Supports UCI Individual Household Electric Power format and generic datetime/power CSVs.
      </p>
    </div>
  );
}

