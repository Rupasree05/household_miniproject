import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
  BarChart2,
  Table,
  Check,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { smartGridApi } from '../services/api';

export default function PreprocessingPage() {
  const navigate = useNavigate();

  const [datasetInfo, setDatasetInfo] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [prepResult, setPrepResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDataset = async () => {
    try {
      setLoading(true);
      const res = await smartGridApi.getDatasetPreview();
      if (res.data.status === 'success' && res.data.dataset) {
        setDatasetInfo(res.data.dataset);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const handleRunPreprocessing = async () => {
    if (!datasetInfo) return;
    try {
      setProcessing(true);
      setAlert(null);
      const res = await smartGridApi.preprocessDataset(datasetInfo.id);
      setPrepResult(res.data);
      setAlert({
        type: 'success',
        title: 'Preprocessing Complete',
        message: `Successfully cleaned, chronological sorted, and aggregated ${res.data.original_rows} raw records into ${res.data.cleaned_days} daily consumption totals.`
      });
      await fetchDataset();
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Preprocessing Failed',
        message: err.response?.data?.detail || 'An error occurred during dataset preprocessing.'
      });
    } finally {
      setProcessing(false);
    }
  };

  // Convert hourly profile dict to chart array
  const hourlyData = prepResult?.hourly_profile
    ? Object.entries(prepResult.hourly_profile).map(([h, val]) => ({
        hour: `${String(h).padStart(2, '0')}:00`,
        power_kw: val
      }))
    : [];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Data Cleaning & Domain Preprocessing"
        subtitle="Pandas pipeline: Null imputation, deduplication, chronological sorting, and daily kWh resampling"
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

        {/* Pipeline Stepper Visual */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
            Preprocessing Pipeline Workflow
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { step: '01', title: 'Parse Timestamps', desc: 'Date/Time parsing & delimiter check' },
              { step: '02', title: 'Impute Nulls', desc: 'Ffill / bfill missing values' },
              { step: '03', title: 'Remove Duplicates', desc: 'Eliminate duplicate rows' },
              { step: '04', title: 'Clip Invalid Readings', desc: 'Ensure non-negative kW values' },
              { step: '05', title: 'Daily Resampling', desc: 'Aggregate sub-metered readings to kWh' }
            ].map((s, idx) => (
              <div
                key={s.step}
                className={`p-3.5 rounded-xl border transition-all ${
                  prepResult || datasetInfo?.status === 'preprocessed'
                    ? 'bg-navy-950/80 border-emerald-500/40'
                    : 'bg-navy-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-electric-400">Step {s.step}</span>
                  {(prepResult || datasetInfo?.status === 'preprocessed') && (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white mb-0.5">{s.title}</h4>
                <p className="text-[11px] text-slate-400 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            <div>
              <p className="text-xs text-slate-300 font-medium">
                Active Dataset:{' '}
                <span className="text-white font-bold">{datasetInfo ? datasetInfo.filename : 'None loaded'}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                {datasetInfo?.status === 'preprocessed'
                  ? 'Dataset is already preprocessed and ready for ML training.'
                  : 'Click below to initiate the multi-stage Pandas cleaning and resampling pipeline.'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRunPreprocessing}
                disabled={!datasetInfo || processing}
                className="px-6 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-electric-500/20 flex items-center space-x-2 transition-all"
              >
                {processing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>{datasetInfo?.status === 'preprocessed' ? 'Re-run Preprocessing' : 'Run Preprocessing Pipeline'}</span>
                  </>
                )}
              </button>

              {(prepResult || datasetInfo?.status === 'preprocessed') && (
                <button
                  onClick={() => navigate('/training')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <span>Feature Engineering & Training</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preprocessing Results Grid */}
        {(prepResult || datasetInfo?.status === 'preprocessed') && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-xl bg-navy-900/90 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Raw Input Records</span>
                <p className="text-xl font-bold font-mono text-white mt-1">
                  {prepResult?.original_rows || datasetInfo?.original_rows}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/90 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Cleaned Daily Days</span>
                <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {prepResult?.cleaned_days || datasetInfo?.cleaned_rows}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/90 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Duplicates Removed</span>
                <p className="text-xl font-bold font-mono text-slate-300 mt-1">
                  {prepResult?.duplicates_removed ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/90 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nulls Imputed</span>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                  {prepResult?.missing_values_handled ?? 0}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/90 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Date Span</span>
                <p className="text-xs font-bold font-mono text-electric-400 mt-2 truncate">
                  {prepResult?.date_range ? `${prepResult.date_range.start} to ${prepResult.date_range.end}` : `${datasetInfo?.date_start} to ${datasetInfo?.date_end}`}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-navy-900/90 border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Avg Daily Load</span>
                <p className="text-xl font-bold font-mono text-white mt-1">
                  {prepResult?.statistics?.avg_daily_kwh ? `${prepResult.statistics.avg_daily_kwh} kWh` : '--'}
                </p>
              </div>
            </div>

            {/* Sub-Daily Hourly Distribution Profile (if present) */}
            {hourlyData.length > 0 && (
              <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-electric-400" />
                    <span>Typical 24-Hour Active Power Profile (kW)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aggregated across all smart-meter readings to extract baseline hourly load patterns
                  </p>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(val) => [`${val} kW`, 'Average Load']}
                      />
                      <Bar dataKey="power_kw" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Cleaned Daily Preview Table */}
            {prepResult?.preview && (
              <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-400" />
                  <span>Cleaned Daily Consumption Records (First 10 Days)</span>
                </h4>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300 font-mono">
                    <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Daily Total (kWh)</th>
                        <th className="py-2.5 px-4">Peak Observed (kW)</th>
                        <th className="py-2.5 px-4">Peak Hour</th>
                        <th className="py-2.5 px-4">Readings Aggregated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      {prepResult.preview.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-4 text-white font-semibold">{row.date}</td>
                          <td className="py-2 px-4 text-emerald-400 font-bold">{row.power_consumption} kWh</td>
                          <td className="py-2 px-4 text-amber-400">{row.peak_demand_kw || '--'} kW</td>
                          <td className="py-2 px-4 text-slate-400">{row.peak_hour ? `${String(row.peak_hour).padStart(2, '0')}:00` : '--'}</td>
                          <td className="py-2 px-4 text-slate-400">{row.readings_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

