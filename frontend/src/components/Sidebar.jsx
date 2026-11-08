import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  Cpu,
  BrainCircuit,
  TrendingUp,
  Scale,
  Lightbulb,
  History,
  Settings,
  Zap,
  Home,
  X
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Data Upload', path: '/upload', icon: UploadCloud },
  { name: 'Preprocessing', path: '/preprocessing', icon: Cpu },
  { name: 'Model Training', path: '/training', icon: BrainCircuit },
  { name: 'Next-Day Prediction', path: '/predict', icon: TrendingUp },
  { name: 'Load Balancing', path: '/load-balancing', icon: Scale },
  { name: 'Energy Insights', path: '/insights', icon: Lightbulb },
  { name: 'Prediction History', path: '/history', icon: History },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ backendOnline = true, mobileOpen = false, setMobileOpen = () => {} }) {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-navy-900 border-r border-slate-800/80 flex flex-col h-screen fixed left-0 top-0 z-50 transition-transform duration-300 select-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 bg-navy-950/40">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center space-x-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-electric-500 p-0.5 shadow-lg shadow-electric-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-electric-400 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-white text-base tracking-tight">SmartGrid</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold bg-electric-500/10 text-electric-400 border border-electric-500/30">AI</span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Power Analytics</p>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-electric-500/15 text-electric-400 border border-electric-500/30 shadow-sm shadow-electric-500/10 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Overview
          </div>
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Landing Page</span>
          </Link>
        </div>

        {/* Status Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-navy-950/60">
          <div className="p-3 rounded-lg bg-navy-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${backendOnline ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${backendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              </span>
              <span className="text-xs font-medium text-slate-300">
                {backendOnline ? 'Backend Online' : 'Connecting API...'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
