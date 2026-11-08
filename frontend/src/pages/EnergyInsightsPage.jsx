import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  DollarSign,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  BarChart3,
  Sparkles,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import KPICard from '../components/KPICard';
import { smartGridApi } from '../services/api';

export default function EnergyInsightsPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [tariff, setTariff] = useState('0.18');
  const [updatingTariff, setUpdatingTariff] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const res = await smartGridApi.getInsights();
      if (res.data.has_data) {
        setInsights(res.data);
        setTariff(String(res.data.tariff));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleUpdateTariff = async () => {
    try {
      setUpdatingTariff(true);
      setAlert(null);
      await smartGridApi.updateSettings({ electricity_tariff: parseFloat(tariff) });
      await fetchInsights();
      setAlert({
        type: 'success',
        title: 'Tariff Updated',
        message: `Electricity tariff successfully updated to $${tariff}/kWh. All cost projections recalculated.`
      });
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Update Error',
        message: 'Failed to update electricity tariff.'
      });
    } finally {
      setUpdatingTariff(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header title="Household Energy Intelligence" subtitle="Deep behavioral analytics & cost projections" />
        <LoadingSpinner message="Analyzing consumption patterns & anomaly spikes..." />
      </div>
    );
  }

  const overview = insights?.overview || {};
  const extremes = insights?.extremes || {};
  const weekendVsWeekday = insights?.weekend_vs_weekday || {};
  const dowBreakdown = insights?.day_of_week_breakdown || [];
  const anomalies = insights?.anomalies || [];
  const suggestions = insights?.suggestions || [];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Household Energy Insights"
        subtitle="Behavioral consumption trends, anomaly detection, and tariff cost analytics"
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

        {/* Cost & Tariff Configuration Bar */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Electricity Tariff & Cost Configuration</span>
            </h3>
            <p className="text-xs text-slate-400">
              Set your household rate per kWh to recalculate financial analytics across all records
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs font-mono text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="2.00"
                value={tariff}
                onChange={(e) => setTariff(e.target.value)}
                className="pl-7 pr-3 py-2 w-32 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-electric-400"
              />
              <span className="ml-2 text-xs text-slate-400 font-mono">/ kWh</span>
            </div>

            <button
              onClick={handleUpdateTariff}
              disabled={updatingTariff}
              className="px-4 py-2 rounded-xl bg-electric-500 hover:bg-electric-400 text-white text-xs font-semibold shadow-md shadow-electric-500/20 transition-all disabled:opacity-50"
            >
              {updatingTariff ? 'Updating...' : 'Apply Tariff'}
            </button>
          </div>
        </div>

        {/* Overview KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <KPICard
            title="Total Ingested Energy"
            value={overview.total_kwh}
            unit="kWh"
            icon={TrendingUp}
            color="electric"
            subtitle={`Spanning ${overview.total_days} recorded days`}
          />

          <KPICard
            title="Total Electricity Cost"
            value={`$${overview.total_cost}`}
            unit=""
            icon={DollarSign}
            color="emerald"
            subtitle={`Calculated at $${insights?.tariff}/kWh`}
          />

          <KPICard
            title="Average Daily Load"
            value={overview.avg_daily_kwh}
            unit="kWh"
            icon={Lightbulb}
            color="amber"
            subtitle={`Est. monthly: $${overview.est_monthly_cost}`}
          />

          <KPICard
            title="Weekend vs Weekday"
            value={`${Math.abs(weekendVsWeekday.diff_percentage || 0)}%`}
            unit={weekendVsWeekday.diff_percentage > 0 ? 'Higher' : 'Lower'}
            icon={Calendar}
            color={weekendVsWeekday.diff_percentage > 0 ? 'amber' : 'electric'}
            subtitle={`Higher on ${weekendVsWeekday.higher_period || 'Weekends'}`}
          />
        </div>

        {/* Extremes: Highest & Lowest Days */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-rose-400 uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                Peak Demand Outlier
              </span>
              <span className="text-xs font-mono text-slate-400">{extremes.highest_day?.date}</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Highest Consumption Day</h4>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl font-black font-mono text-rose-400">{extremes.highest_day?.kwh}</span>
              <span className="text-sm font-semibold text-slate-400">kWh</span>
              <span className="text-xs font-mono text-slate-400 ml-2">(${extremes.highest_day?.cost})</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Household usage on this day exceeded standard baselines, likely due to heavy climate control or concurrent appliance cycles.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Efficient Baselines
              </span>
              <span className="text-xs font-mono text-slate-400">{extremes.lowest_day?.date}</span>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Lowest Consumption Day</h4>
            <div className="flex items-baseline space-x-2 my-2">
              <span className="text-3xl font-black font-mono text-emerald-400">{extremes.lowest_day?.kwh}</span>
              <span className="text-sm font-semibold text-slate-400">kWh</span>
              <span className="text-xs font-mono text-slate-400 ml-2">(${extremes.lowest_day?.cost})</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Represents pure unaugmented household baseload when non-essential appliances were idle.
            </p>
          </div>
        </div>

        {/* Day of the Week Breakdown Chart */}
        {dowBreakdown.length > 0 && (
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-electric-400" />
                <span>Consumption Breakdown by Day of the Week</span>
              </h3>
              <p className="text-xs text-slate-400">
                Average daily electricity consumption across Monday through Sunday
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(val, name) => [`${val} kWh ($${(val * parseFloat(tariff)).toFixed(2)})`, 'Average Load']}
                  />
                  <Bar dataKey="avg_kwh" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                    {dowBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index >= 5 ? '#f59e0b' : '#38bdf8'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Anomalous Consumption Spikes Detection Table */}
        {anomalies.length > 0 && (
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Unusual Consumption Spikes Detected (Outliers &gt; 2σ)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Statistical anomaly filter flagged these days with power consumption exceeding 2 standard deviations above the mean
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {anomalies.length} Anomaly Events
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Event Date</th>
                    <th className="py-2.5 px-4">Spike Consumption</th>
                    <th className="py-2.5 px-4">Deviation Above Mean</th>
                    <th className="py-2.5 px-4">Percentage Surge</th>
                    <th className="py-2.5 px-4">Single-Day Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {anomalies.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="py-2 px-4 text-white font-semibold">{a.date}</td>
                      <td className="py-2 px-4 text-amber-400 font-bold">{a.kwh} kWh</td>
                      <td className="py-2 px-4 text-rose-400">+{a.deviation_kwh} kWh</td>
                      <td className="py-2 px-4 text-rose-400">+{a.deviation_pct}%</td>
                      <td className="py-2 px-4 text-slate-300">${a.cost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dynamic Energy-Saving Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <span>Targeted Energy-Saving & Tariff Advice</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {suggestions.map((s, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {s.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{s.impact}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

