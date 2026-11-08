import React, { useState, useEffect } from 'react';
import {
  Scale,
  Zap,
  TrendingDown,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import KPICard from '../components/KPICard';
import { smartGridApi } from '../services/api';

export default function LoadBalancingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchLoadBalancingData = async () => {
    try {
      setLoading(true);
      const res = await smartGridApi.getLoadBalancing();
      if (res.data.status === 'success' && res.data.data.has_data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Unable to load load balancing insights.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoadBalancingData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header title="Intelligent Load Balancing" subtitle="Advisory peak shaving & demand shifting engine" />
        <LoadingSpinner message="Calculating load curves and peak shifting models..." />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const loadCurves = data?.load_curves || [];
  const recommendations = data?.recommendations || [];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Intelligent Load Balancing"
        subtitle="Advisory peak shaving & demand shifting recommendations"
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {alert && (
          <AlertBanner
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Disclaimer Alert */}
        <div className="p-4 rounded-xl bg-electric-950/40 border border-electric-500/30 text-xs text-slate-300 flex items-start space-x-3">
          <Info className="w-5 h-5 text-electric-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-semibold text-white">Advisory System Notice:</span> This application provides intelligent recommendations based on statistical consumption patterns and does not directly control physical electrical appliances or utility grid switches.
          </p>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            title="Current Peak Demand"
            value={metrics.current_peak_kw}
            unit="kW"
            icon={Zap}
            color="amber"
            subtitle={`Peak Window: ${data?.peak_window || '17:00 - 21:00'}`}
          />

          <KPICard
            title="Optimized Peak Demand"
            value={metrics.optimized_peak_kw}
            unit="kW"
            icon={TrendingDown}
            color="emerald"
            subtitle="Simulated post-shift peak load"
          />

          <KPICard
            title="Potential Peak Shaving"
            value={metrics.peak_reduction_percentage ? `${metrics.peak_reduction_percentage}%` : '--'}
            unit=""
            icon={Scale}
            color="electric"
            badge="Shiftable Load"
            subtitle={`Shaves ~${metrics.peak_reduction_kw} kW from grid peak`}
          />

          <KPICard
            title="Est. Monthly TOU Savings"
            value={metrics.estimated_monthly_savings ? `$${metrics.estimated_monthly_savings}` : '$0.00'}
            unit=""
            icon={DollarSign}
            color="emerald"
            subtitle={`Based on $${metrics.tariff_rate}/kWh TOU structure`}
          />
        </div>

        {/* Interactive Load Curves Simulation Chart */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Scale className="w-5 h-5 text-electric-400" />
                <span>24-Hour Load Curve: Baseline vs. Optimized Simulation</span>
              </h3>
              <p className="text-xs text-slate-400">
                Visualizing how shifting 22% of flexible evening peak load into midnight off-peak slots flattens the demand profile
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Peak: {data?.peak_window}</span>
              </span>
              <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Off-Peak: {data?.offpeak_window}</span>
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={loadCurves} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="origGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="optGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(val) => [`${val} kW`, 'Demand']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="original_kw"
                  name="Baseline Demand (kW)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#origGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="optimized_kw"
                  name="Optimized Load Shifting (kW)"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#optGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Actionable Appliance Scheduling Recommendations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Tailored Appliance Scheduling & Shifting Recommendations</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">4 Active Rules</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 hover:border-slate-700 transition-all duration-200 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {rec.category}
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {rec.impact}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-2">{rec.title}</h4>
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">{rec.description}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-navy-950/80 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current Window:</span>
                    <span className="font-mono text-amber-400 font-medium">{rec.current_time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Recommended Window:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{rec.recommended_time}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                    <span className="text-slate-400">Estimated Impact:</span>
                    <span className="font-mono text-white font-bold">{rec.estimated_reduction}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

