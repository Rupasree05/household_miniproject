import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const alertConfig = {
  success: {
    bg: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400'
  },
  error: {
    bg: 'bg-rose-950/40 border-rose-500/30 text-rose-300',
    icon: XCircle,
    iconColor: 'text-rose-400'
  },
  warning: {
    bg: 'bg-amber-950/40 border-amber-500/30 text-amber-300',
    icon: AlertTriangle,
    iconColor: 'text-amber-400'
  },
  info: {
    bg: 'bg-electric-950/40 border-electric-500/30 text-electric-300',
    icon: Info,
    iconColor: 'text-electric-400'
  }
};

export default function AlertBanner({ type = 'info', title, message, onClose }) {
  const config = alertConfig[type] || alertConfig.info;
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.bg} flex items-start justify-between shadow-lg backdrop-blur-sm transition-all duration-200`}>
      <div className="flex items-start space-x-3">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
        <div>
          {title && <h4 className="text-sm font-semibold mb-0.5 text-white">{title}</h4>}
          <p className="text-xs leading-relaxed">{message}</p>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

