import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  Activity,
  Gauge,
  BrainCircuit,
  ArrowRight,
  Calendar,
  AlertCircle,
  Lightbulb,
  Scale,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import Header from '../components/Header';
import KPICard from '../components/KPICard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { smartGridApi } from '../services/api';

export default function DashboardPage({ onOpenMobileMenu }) {
  const [loading, setLoading] = useState(true);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [summary, setSummary] = useState(null);
  const [trendRange, setTrendRange] = useState('daily');
  const [trendData, setTrendData] = useState([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const sumRes = await smartGridApi.getDashboardSummary();
      setSummary(sumRes.data);

      if (sumRes.data.has_data) {
        // Fetch trend
        const trendRes = await smartGridApi.getConsumptionTrend(trendRange);
        if (trendRes.data.has_data) {
          setTrendData(trendRes.data.data);
        }

        // Fetch model metrics if trained
        const mRes = await smartGridApi.getModelMetrics();
        if (mRes.data.status === 'success') {
          setModelMetrics(mRes.data.metrics);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load dashboard data. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRangeChange = async (range) => {
    setTrendRange(range);
    try {
      setTrendLoading(true);
      const res = await smartGridApi.getConsumptionTrend(range);
      if (res.data.has_data) {
        setTrendData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTrendLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      await smartGridApi.loadDemoDataset();
      // Preprocess and train automatically on demo load
      const prepRes = await smartGridApi.preprocessDataset(1);
      await smartGridApi.trainModel({ dataset_id: 1, n_estimators: 100, max_depth: 12 });
      await smartGridApi.predictNextDay(1);
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load demo data. Please try again.');
    } finally {
      setLoadingDemo(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header title="Household Energy Dashboard" subtitle="Real-time electricity telemetry & ML forecasts" />
        <LoadingSpinner message="Loading smart-meter telemetry..." />
      </div>
    );
  }

  const hasData = summary && summary.has_data;
  const kpis = summary?.kpis || {};

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Household Energy Dashboard"
        subtitle={hasData ? `Active Dataset: ${summary.dataset_name}` : "Electricity telemetry & ML forecasts"}
      />

      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {errorMsg && (
          <AlertBanner
            type="error"
            title="Dashboard Warning"
            message={errorMsg}
            onClose={() => setErrorMsg('')}
          />
        )}

        {!hasData ? (
          <EmptyState
            title="No Smart-Meter Dataset Active"
            description="Upload historical household consumption records or load the 120-day demo dataset to activate live KPI telemetry, ML training metrics, and demand predictions."
            onLoadDemo={handleLoadDemo}
            loadingDemo={loadingDemo}
          />
        ) : (
          <>
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* 1. Today's Consumption */}
              <KPICard
                title="Today's Consumption"
                value={kpis.today_consumption_kwh}
                unit="kWh"
                icon={Activity}
                color="electric"
                subtitle={`Recorded on ${kpis.today_date}`}
              />

              {/* 2. Predicted Tomorrow's Demand */}
              <KPICard
                title="Predicted Tomorrow"
                value={kpis.predicted_tomorrow_kwh || '--'}
                unit="kWh"
                icon={TrendingUp}
                color={
                  kpis.demand_category === 'Low Demand'
                    ? 'emerald'
                    : kpis.demand_category === 'High Demand' || kpis.demand_category === 'Very High Demand'
                    ? 'amber'
                    : 'electric'
                }
                badge={kpis.demand_category || 'Pending'}
                subtitle={kpis.prediction_date ? `Forecast for ${kpis.prediction_date}` : 'Awaiting prediction'}
              />

              {/* 3. Average Daily Consumption */}
              <KPICard
                title="Avg Daily Consumption"
                value={kpis.avg_daily_kwh}
                unit="kWh"
                icon={Zap}
                color="emerald"
                subtitle={`Across ${kpis.total_records_days} logged days`}
              />

              {/* 4. Peak Demand kW */}
              <KPICard
                title="Peak Demand"
                value={kpis.peak_demand_kw}
                unit="kW"
                icon={Gauge}
                color="amber"
                subtitle={kpis.has_hourly ? 'From sub-metered records' : 'Estimated daily peak'}
              />

              {/* 5. Model R² Score */}
              <KPICard
                title="Model Performance"
                value={kpis.model_r2_score !== null && kpis.model_r2_score !== undefined ? kpis.model_r2_score : '--'}
                unit="R²"
                icon={BrainCircuit}
                color={kpis.model_r2_score > 0 ? "electric" : "purple"}
                badge={kpis.model_r2_score !== null ? "Trained" : "Untrained"}
                subtitle={kpis.model_mae ? `MAE: ±${kpis.model_mae} kWh` : 'Train model to view'}
              />
            </div>

            {/* Main Visualizations Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Electricity Consumption Chart with Range Selector */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <span>Electricity Consumption Telemetry</span>
                    </h3>
                    <p className="text-xs text-slate-400">Historical consumption trend & 7-day rolling baseline</p>
                  </div>

                  {/* Range Switcher */}
                  <div className="flex items-center space-x-1 p-1 bg-navy-950 rounded-lg border border-slate-800 text-xs font-medium">
                    {['daily', 'weekly', 'monthly'].map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRangeChange(r)}
                        className={`px-3 py-1.5 rounded-md capitalize transition-all duration-150 ${
                          trendRange === r
                            ? 'bg-electric-500 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {trendLoading ? (
                  <div className="h-72 flex items-center justify-center">
                    <LoadingSpinner message="Updating trend..." />
                  </div>
                ) : trendData.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {trendRange === 'daily' ? (
                        <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="kwhGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="kwh"
                            name="Daily kWh"
                            stroke="#38bdf8"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#kwhGradient)"
                          />
                          <Line
                            type="monotone"
                            dataKey="trend_7d"
                            name="7-Day Avg Baseline"
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                          />
                        </AreaChart>
                      ) : (
                        <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                          <Bar dataKey="total_kwh" name="Total kWh" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="peak_kwh" name="Peak Day kWh" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                    No consumption data available for this range.
                  </div>
                )}
              </div>

              {/* Right Col: Quick Recommendations & Load Advisory */}
              <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-400" />
                      <span>Smart Load Balancing</span>
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Advisory
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                    AI recommendations to flatten peak demand and lower monthly electricity costs.
                  </p>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                        <span>Peak Window Alert</span>
                        <span className="text-amber-400 font-mono">17:00 - 21:00</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Shift laundry, dishwasher, and EV charging away from this interval.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                        <span>Off-Peak Opportunity</span>
                        <span className="text-emerald-400 font-mono">23:00 - 06:00</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Deep off-peak window offers lowest grid strain and lowest TOU electricity tariffs.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-navy-950/70 border border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                        <span>Peak Shaving Potential</span>
                        <span className="text-electric-400 font-mono">~22.1% Reduction</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        Estimated monthly savings of ~$18.50 on standard time-of-use billing.
                      </p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/load-balancing"
                  className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 flex items-center justify-center space-x-1.5 transition-all duration-150"
                >
                  <span>Explore Load Balancing Engine</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </Link>
              </div>
            </div>

            {/* Bottom Row: Recent Predictions Table */}
            <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Recent Demand Forecasts</h3>
                  <p className="text-xs text-slate-400">Stored next-day prediction history from SQLite</p>
                </div>
                <Link
                  to="/history"
                  className="text-xs font-semibold text-electric-400 hover:text-electric-300 flex items-center space-x-1"
                >
                  <span>View Full History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {summary?.recent_predictions && summary.recent_predictions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-navy-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Prediction Date</th>
                        <th className="py-3 px-4">Forecasted Demand</th>
                        <th className="py-3 px-4">Demand Category</th>
                        <th className="py-3 px-4">Previous Day</th>
                        <th className="py-3 px-4">7-Day Avg</th>
                        <th className="py-3 px-4">Expected Peak</th>
                        <th className="py-3 px-4">Prediction Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {summary.recent_predictions.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-white">{p.prediction_date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-electric-400">
                            {p.predicted_kwh} kWh
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                p.demand_category === 'Low Demand'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : p.demand_category === 'Normal Demand'
                                  ? 'bg-electric-500/15 text-electric-400 border-electric-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {p.demand_category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">{p.prev_day_kwh ? `${p.prev_day_kwh} kWh` : '--'}</td>
                          <td className="py-3 px-4 font-mono">{p.prev_7d_avg ? `${p.prev_7d_avg} kWh` : '--'}</td>
                          <td className="py-3 px-4 font-mono text-slate-400">{p.expected_peak_period || '--'}</td>
                          <td className="py-3 px-4 font-mono">
                            {p.prediction_error !== null && p.prediction_error !== undefined
                              ? `±${p.prediction_error} kWh`
                              : <span className="text-slate-400">Pending actual</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  <span>No prediction records logged yet. </span>
                  <Link to="/predict" className="text-electric-400 hover:underline font-semibold ml-1">
                    Run your first next-day prediction →
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

