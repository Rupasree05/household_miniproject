import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  TrendingUp,
  BarChart2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
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

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('prediction_date');
  const [order, setOrder] = useState('desc');
  const [alert, setAlert] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await smartGridApi.getHistory({
        search: search || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sort_by: sortBy,
        order: order
      });
      setPredictions(res.data.predictions);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch prediction history from SQLite database.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [categoryFilter, sortBy, order]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete prediction record #${id}?`)) return;
    try {
      await smartGridApi.deleteHistoryItem(id);
      setAlert({
        type: 'success',
        title: 'Record Deleted',
        message: `Prediction #${id} removed from SQLite database.`
      });
      await fetchHistory();
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete record.'
      });
    }
  };

  // Prepare chart series (sorted chronologically)
  const chartData = [...predictions]
    .sort((a, b) => new Date(a.prediction_date) - new Date(b.prediction_date))
    .map((p) => ({
      date: p.prediction_date,
      predicted: p.predicted_kwh,
      actual: p.actual_kwh || null
    }));

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Prediction History & Model Audit"
        subtitle="Persistent SQLite log of next-day demand predictions and validation errors"
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

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <KPICard
            title="Total Predictions Logged"
            value={summary?.total_predictions ?? predictions.length}
            unit="Forecasts"
            icon={History}
            color="electric"
            subtitle="Persistent records in SQLite"
          />

          <KPICard
            title="Average Predicted Load"
            value={summary?.avg_predicted_kwh ?? '--'}
            unit="kWh"
            icon={TrendingUp}
            color="emerald"
            subtitle="Mean forecasted daily demand"
          />

          <KPICard
            title="Average Prediction Error"
            value={summary?.avg_error_kwh ? `±${summary.avg_error_kwh}` : '±0.00'}
            unit="kWh"
            icon={ShieldCheck}
            color="amber"
            subtitle="Evaluated against recorded actuals"
          />
        </div>

        {/* Timeline Chart */}
        {chartData.length > 0 && (
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
            <div className="mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-electric-400" />
                <span>Historical Prediction Timeline (kWh)</span>
              </h3>
              <p className="text-xs text-slate-400">Chronological trajectory of logged demand forecasts</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="predicted" name="Predicted Demand (kWh)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="actual" name="Actual Ground Truth (kWh)" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Search, Filter & Table */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search date (YYYY-MM-DD) or trend..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
              />
            </form>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-electric-400"
              >
                <option value="all">All Demand Tiers</option>
                <option value="Low Demand">Low Demand</option>
                <option value="Normal Demand">Normal Demand</option>
                <option value="High Demand">High Demand</option>
                <option value="Very High Demand">Very High Demand</option>
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-electric-400"
              >
                <option value="prediction_date">Sort by Target Date</option>
                <option value="predicted_at">Sort by Timestamp</option>
                <option value="predicted_kwh">Sort by Predicted kWh</option>
                <option value="prediction_error">Sort by Error</option>
              </select>

              {/* Order Toggle */}
              <button
                onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-xl bg-navy-950 border border-slate-700 text-slate-300 hover:text-white"
                title="Toggle Order"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Predictions Table */}
          {predictions.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Forecast Date</th>
                    <th className="py-3 px-4">Predicted (kWh)</th>
                    <th className="py-3 px-4">Demand Category</th>
                    <th className="py-3 px-4">Previous Day</th>
                    <th className="py-3 px-4">7-Day Avg</th>
                    <th className="py-3 px-4">Peak Period</th>
                    <th className="py-3 px-4">Actual Ground Truth</th>
                    <th className="py-3 px-4">Error</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-[11px]">
                  {predictions.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white">{p.prediction_date}</td>
                      <td className="py-2.5 px-4 font-bold text-electric-400">{p.predicted_kwh} kWh</td>
                      <td className="py-2.5 px-4">
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
                      <td className="py-2.5 px-4">{p.prev_day_kwh ? `${p.prev_day_kwh} kWh` : '--'}</td>
                      <td className="py-2.5 px-4">{p.prev_7d_avg ? `${p.prev_7d_avg} kWh` : '--'}</td>
                      <td className="py-2.5 px-4 text-slate-400">{p.expected_peak_period || '--'}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-200">
                        {p.actual_kwh !== null && p.actual_kwh !== undefined ? `${p.actual_kwh} kWh` : 'Pending'}
                      </td>
                      <td className="py-2.5 px-4">
                        {p.prediction_error !== null && p.prediction_error !== undefined
                          ? `±${p.prediction_error} kWh`
                          : '--'}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No prediction records matched your search or filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

