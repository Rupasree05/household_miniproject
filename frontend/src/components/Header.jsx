import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, Menu } from 'lucide-react';

export default function Header({
  title,
  subtitle,
  activeHousehold = 'Smart Household #1',
  onOpenMobileMenu
}) {
  return (
    <header className="h-16 bg-navy-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Toggle Button */}
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Household Pill */}
        <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{activeHousehold}</span>
        </div>

        {/* Quick Predict Button */}
        <Link
          to="/predict"
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-400 hover:to-electric-500 text-white text-xs font-semibold shadow-md shadow-electric-500/20 transition-all duration-150 hover:scale-[1.02]"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Predict</span>
        </Link>
      </div>
    </header>
  );
}
