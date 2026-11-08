import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  Scale,
  Database
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
import { smartGridApi } from '../services/api';

export default function PredictionPage() {
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [targetDate, setTargetDate] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dsRes = await smartGridApi.getDatasetPreview();
      if (dsRes.data.status === 'success' && dsRes.data.dataset) {
        setDatasetInfo(dsRes.data.dataset);
        // Default target date: day after date_end
        if (dsRes.data.dataset.date_end) {
          const endDate = new Date(dsRes.data.dataset.date_end);
          endDate.setDate(endDate.getDate() + 1);
          setTargetDate(endDate.toISOString().split('T')[0]);
        }
      }

      // Check if existing predictions exist in history
      const histRes = await smartGridApi.getHistory();
      if (histRes.data.predictions && histRes.data.predictions.length > 0) {
        const latest = histRes.data.predictions[0];
        // Format for display
        setPrediction({
          predicted_kwh: latest.predicted_kwh,
          demand_category: latest.demand_category,
          prediction_date: latest.prediction_date,
          prev_day_kwh: latest.prev_day_kwh,
          prev_7d_avg: latest.prev_7d_avg,
          pct_change: latest.pct_change,
          trend: latest.trend,
          expected_peak_period: latest.expected_peak_period,
          actual_kwh: latest.actual_kwh,
          prediction_error: latest.prediction_error
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePredict = async () => {
    if (!datasetInfo) return;
    try {
      setPredicting(true);
      setAlert(null);
      const res = await smartGridApi.predictNextDay(datasetInfo.id, targetDate || null);
      setPrediction(res.data.prediction);
      setAlert({
        type: 'success',
        title: 'Demand Prediction Complete',
        message: `Successfully computed next-day power demand for ${res.data.prediction.prediction_date}: ${res.data.prediction.predicted_kwh} kWh (${res.data.prediction.demand_category}).`
      });
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Prediction Failed',
        message: err.response?.data?.detail || 'Unable to generate prediction. Ensure Random Forest model is trained.'
      });
    } finally {
      setPredicting(false);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Low Demand':
        return { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
      case 'Normal Demand':
        return { text: 'text-electric-400', bg: 'bg-electric-500/15', border: 'border-electric-500/30' };
      case 'High Demand':
        return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
      case 'Very High Demand':
        return { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' };
      default:
        return { text: 'text-electric-400', bg: 'bg-electric-500/15', border: 'border-electric-500/30' };
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Next-Day Power Demand Prediction"
        subtitle="Random Forest time-series regression inference with historical percentile categorization"
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

        {/* Prediction Control Bar */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Target Forecast Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="px-4 py-2 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400 font-mono shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Active Household Dataset
              </label>
              <div className="px-4 py-2 rounded-xl bg-navy-950 border border-slate-800 text-xs text-slate-300 font-medium flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-electric-400" />
                <span>{datasetInfo ? datasetInfo.filename : 'No dataset'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePredict}
            disabled={!datasetInfo || predicting}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-400 hover:to-electric-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold shadow-xl shadow-electric-500/25 flex items-center space-x-2 transition-all hover:scale-[1.02]"
          >
            {predicting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Executing Random Forest Inference...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>Predict Next-Day Demand</span>
              </>
            )}
          </button>
        </div>

        {/* Main Prediction Result Hero Card */}
        {prediction ? (
          <div className="space-y-6">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-navy-900 via-navy-900 to-navy-950 border border-slate-800 shadow-2xl relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-electric-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-electric-500/10 text-electric-400">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                      Demand Forecast Result
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      Target Date: {prediction.prediction_date}
                    </h2>
                  </div>
                </div>

                {/* Demand Category Badge */}
                {prediction.demand_category && (
                  <div
                    className={`px-4 py-2 rounded-full border text-xs font-bold tracking-wide uppercase flex items-center space-x-2 ${
                      getCategoryColor(prediction.demand_category).bg
                    } ${getCategoryColor(prediction.demand_category).text} ${
                      getCategoryColor(prediction.demand_category).border
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    <span>{prediction.demand_category}</span>
                  </div>
                )}
              </div>

              {/* Central Value Display */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8 items-center">
                <div className="lg:col-span-1">
                  <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
                    Predicted Total Consumption
                  </span>
                  <div className="flex items-baseline space-x-2 mt-2">
                    <span className="text-5xl lg:text-6xl font-black font-mono text-white tracking-tight">
                      {prediction.predicted_kwh}
                    </span>
                    <span className="text-xl font-semibold text-electric-400">kWh</span>
                  </div>

                  {prediction.uncertainty && (
                    <div className="mt-3 text-xs text-slate-400 flex items-center space-x-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Uncertainty Bounds: [{prediction.uncertainty.lower_bound} - {prediction.uncertainty.upper_bound}] kWh (±{prediction.uncertainty.mae} MAE)
                      </span>
                    </div>
                  )}
                </div>

                {/* Secondary Indicators */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Previous Day</span>
                    <p className="text-lg font-bold font-mono text-white mt-1">
                      {prediction.prev_day_kwh ? `${prediction.prev_day_kwh} kWh` : '--'}
                    </p>
                    <span className="text-[10px] text-slate-400">Lag-1 Baseline</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">7-Day Average</span>
                    <p className="text-lg font-bold font-mono text-slate-300 mt-1">
                      {prediction.prev_7d_avg ? `${prediction.prev_7d_avg} kWh` : '--'}
                    </p>
                    <span className="text-[10px] text-slate-400">Weekly Moving Mean</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Day-over-Day Trend</span>
                    <p
                      className={`text-lg font-bold font-mono mt-1 flex items-center ${
                        prediction.pct_change >= 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {prediction.pct_change >= 0 ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                      {prediction.pct_change}%
                    </p>
                    <span className="text-[10px] text-slate-400">{prediction.trend || 'Trend'}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Peak Demand Period</span>
                    <p className="text-lg font-bold font-mono text-amber-400 mt-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{prediction.expected_peak_period || '18:00 - 21:00'}</span>
                    </p>
                    <span className="text-[10px] text-slate-400">Anticipated grid peak</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Actual Backtest</span>
                    <p className="text-lg font-bold font-mono text-slate-200 mt-1">
                      {prediction.actual_kwh !== null && prediction.actual_kwh !== undefined
                        ? `${prediction.actual_kwh} kWh`
                        : 'Unrecorded'}
                    </p>
                    <span className="text-[10px] text-slate-400">Ground truth reading</span>
                  </div>

                  <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Actual Error</span>
                    <p className="text-lg font-bold font-mono text-electric-400 mt-1">
                      {prediction.prediction_error !== null && prediction.prediction_error !== undefined
                        ? `±${prediction.prediction_error} kWh`
                        : '--'}
                    </p>
                    <span className="text-[10px] text-slate-400">Residual delta</span>
                  </div>
                </div>
              </div>

              {/* Action Link to Load Balancing */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  Anticipating {prediction.demand_category.toLowerCase()}? Balance your flexible loads to reduce peak energy costs.
                </p>
                <Link
                  to="/load-balancing"
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition-all"
                >
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>View Load Balancing Recommendations</span>
                </Link>
              </div>
            </div>

            {/* Comparison Chart: Previous 7 Days + Forecasted Day */}
            {prediction.comparison_chart && prediction.comparison_chart.length > 0 && (
              <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-electric-400" />
                    <span>Recent 7-Day History vs Next-Day Forecast (kWh)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Contextual comparison showing historical daily consumption leading to the predicted target
                  </p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prediction.comparison_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(val, name, item) => [`${val} kWh`, item.payload.type]}
                      />
                      <Bar dataKey="consumption" radius={[4, 4, 0, 0]}>
                        {prediction.comparison_chart.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.type === 'Predicted' ? '#10b981' : '#38bdf8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-navy-900/40 border border-slate-800 text-center text-slate-400">
            <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">Ready for Inference</h4>
            <p className="text-xs max-w-md mx-auto">
              Select a target date and click "Predict Next-Day Demand" above to generate a Machine Learning forecast.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

