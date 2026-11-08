import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Home,
  DollarSign,
  Target,
  Gauge,
  Database,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { smartGridApi } from '../services/api';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [alert, setAlert] = useState(null);

  // Settings form state
  const [formData, setFormData] = useState({
    household_name: 'Smart Household #1',
    electricity_tariff: 0.18,
    daily_target_kwh: 25.0,
    peak_threshold_kw: 4.5,
    unit: 'kWh',
    active_dataset_id: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [setRes, dsRes] = await Promise.all([
        smartGridApi.getSettings(),
        smartGridApi.getDatasets()
      ]);

      if (setRes.data.settings) {
        setFormData(setRes.data.settings);
      }
      if (dsRes.data.datasets) {
        setDatasets(dsRes.data.datasets);
      }
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to load household configuration from database.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setAlert(null);
      await smartGridApi.updateSettings({
        household_name: formData.household_name,
        electricity_tariff: parseFloat(formData.electricity_tariff),
        daily_target_kwh: parseFloat(formData.daily_target_kwh),
        peak_threshold_kw: parseFloat(formData.peak_threshold_kw),
        unit: formData.unit,
        active_dataset_id: String(formData.active_dataset_id)
      });
      setAlert({
        type: 'success',
        title: 'Settings Saved',
        message: 'Household preferences and baseline thresholds updated in SQLite.'
      });
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to persist settings changes.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950">
        <Header title="Household Settings" subtitle="Preferences & tariff calibration" />
        <LoadingSpinner message="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Household Settings & Thresholds"
        subtitle="Manage household profile, billing rate per kWh, and peak demand targets"
      />

      <div className="p-8 max-w-4xl mx-auto space-y-8">
        {alert && (
          <AlertBanner
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-electric-400" />
              <span>Household Configuration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These settings drive analytics cost calculations, peak warnings, and dashboard targets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Household Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-electric-400" />
                <span>Household Identifier</span>
              </label>
              <input
                type="text"
                value={formData.household_name}
                onChange={(e) => setFormData({ ...formData, household_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
                placeholder="e.g. Household #1 - Oak Residence"
                required
              />
            </div>

            {/* Electricity Tariff */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Electricity Tariff ($ per kWh)</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="2.00"
                value={formData.electricity_tariff}
                onChange={(e) => setFormData({ ...formData, electricity_tariff: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-electric-400"
                required
              />
            </div>

            {/* Daily Consumption Target */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>Daily Consumption Target (kWh)</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="1.0"
                value={formData.daily_target_kwh}
                onChange={(e) => setFormData({ ...formData, daily_target_kwh: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-electric-400"
                required
              />
            </div>

            {/* Peak Demand Threshold */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-rose-400" />
                <span>Peak Demand Threshold (kW)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={formData.peak_threshold_kw}
                onChange={(e) => setFormData({ ...formData, peak_threshold_kw: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-electric-400"
                required
              />
            </div>

            {/* Preferred Measurement Unit */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Measurement Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
              >
                <option value="kWh">Kilowatt-Hour (kWh)</option>
                <option value="MWh">Megawatt-Hour (MWh)</option>
              </select>
            </div>

            {/* Active Dataset Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-electric-400" />
                <span>Active Dataset</span>
              </label>
              <select
                value={formData.active_dataset_id}
                onChange={(e) => setFormData({ ...formData, active_dataset_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-navy-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400"
              >
                <option value="">Latest Uploaded Dataset</option>
                {datasets.map((ds) => (
                  <option key={ds.id} value={ds.id}>
                    #{ds.id} - {ds.filename} ({ds.cleaned_rows || ds.original_rows} rows)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 text-white text-xs font-semibold shadow-lg shadow-electric-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving to SQLite...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

