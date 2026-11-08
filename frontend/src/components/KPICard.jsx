import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const colorMap = {
  electric: {
    bg: 'bg-electric-500/10',
    border: 'border-electric-500/30',
    text: 'text-electric-400',
    iconBg: 'bg-electric-500/15',
    glow: 'group-hover:border-electric-500/40 shadow-electric-500/5'
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15',
    glow: 'group-hover:border-emerald-500/40 shadow-emerald-500/5'
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    iconBg: 'bg-amber-500/15',
    glow: 'group-hover:border-amber-500/40 shadow-amber-500/5'
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    iconBg: 'bg-rose-500/15',
    glow: 'group-hover:border-rose-500/40 shadow-rose-500/5'
  },
  purple: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    iconBg: 'bg-purple-500/15',
    glow: 'group-hover:border-purple-500/40 shadow-purple-500/5'
  }
};

export default function KPICard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendLabel,
  subtitle,
  color = 'electric',
  badge
}) {
  const c = colorMap[color] || colorMap.electric;

  return (
    <div className={`group p-5 rounded-xl bg-navy-900/90 border border-slate-800/90 hover:border-slate-700 transition-all duration-200 shadow-md ${c.glow} relative overflow-hidden flex flex-col justify-between`}>
      {/* Top accent light */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
          {badge && (
            <span className={`ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
              {badge}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${c.iconBg} ${c.text} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-mono">
            {value !== undefined && value !== null ? value : '--'}
          </span>
          {unit && <span className="text-sm font-semibold text-slate-400">{unit}</span>}
        </div>

        {(trend !== undefined || subtitle) && (
          <div className="mt-2 flex items-center space-x-1.5 text-xs">
            {trend !== undefined && (
              <span className={`inline-flex items-center font-medium ${trend >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {Math.abs(trend)}%
              </span>
            )}
            <span className="text-slate-400 truncate">{trendLabel || subtitle}</span>
          </div>
        )}
      </div>
    </div>
  );
}

