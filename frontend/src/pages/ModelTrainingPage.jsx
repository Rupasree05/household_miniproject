import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  Sliders,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Activity,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function ModelTrainingPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [trainResult, setTrainResult] = useState(null);
  const [alert, setAlert] = useState(null);

  // Hyperparameters
  const [nEstimators, setNEstimators] = useState(100);
  const [maxDepth, setMaxDepth] = useState(12);
  const [minSamplesSplit, setMinSamplesSplit] = useState(2);
  const [minSamplesLeaf, setMinSamplesLeaf] = useState(1);
  const [testSize, setTestSize] = useState(0.2);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dsRes = await smartGridApi.getDatasetPreview();
      if (dsRes.data.status === 'success' && dsRes.data.dataset) {
        setDatasetInfo(dsRes.data.dataset);
      }

      const mRes = await smartGridApi.getModelMetrics();
      if (mRes.data.status === 'success' && mRes.data.metrics) {
        setMetrics(mRes.data.metrics);
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

  const handleTrainModel = async () => {
    if (!datasetInfo) return;
    try {
      setTraining(true);
      setAlert(null);
      const res = await smartGridApi.trainModel({
        dataset_id: datasetInfo.id,
        n_estimators: parseInt(nEstimators),
        max_depth: parseInt(maxDepth),
        min_samples_split: parseInt(minSamplesSplit),
        min_samples_leaf: parseInt(minSamplesLeaf),
        test_size: parseFloat(testSize)
      });
      setTrainResult(res.data);
      setMetrics(res.data);
      setAlert({
        type: 'success',
        title: 'Random Forest Model Trained & Validated',
        message: `Trained ${nEstimators} decision trees on ${res.data.data_split.train_samples} samples. Evaluated on ${res.data.data_split.test_samples} test records with MAE: ${res.data.metrics.mae} kWh.`
      });
    } catch (err) {
      console.error(err);
      setAlert({
        type: 'error',
        title: 'Model Training Error',
        message: err.response?.data?.detail || 'Failed to train Random Forest model.'
      });
    } finally {
      setTraining(false);
    }
  };

  const activeMetrics = trainResult?.metrics || metrics;
  const featureImportances = trainResult?.feature_importance || metrics?.feature_importance || [];
  const comparisonSeries = trainResult?.actual_vs_predicted || [];

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Random Forest Model Training & Validation"
        subtitle="Time-series split, hyperparameter tuning, MAE/RMSE/R² evaluation, and feature importance analysis"
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

        {/* Hyperparameter Configuration & Training Launcher */}
        <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-electric-400" />
                <span>Hyperparameter Configuration</span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure ensemble parameters for the Scikit-learn RandomForestRegressor
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleTrainModel}
                disabled={!datasetInfo || training}
                className="px-6 py-2.5 rounded-xl bg-electric-500 hover:bg-electric-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-electric-500/25 flex items-center space-x-2 transition-all hover:scale-[1.02]"
              >
                {training ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fitting Ensemble Trees...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Train Random Forest Model</span>
                  </>
                )}
              </button>

              {activeMetrics && (
                <button
                  onClick={() => navigate('/predict')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <span>Predict Next-Day Demand</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Hyperparameter Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">N Estimators (Trees)</label>
                <span className="font-mono text-electric-400 font-bold">{nEstimators}</span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={nEstimators}
                onChange={(e) => setNEstimators(e.target.value)}
                className="w-full accent-electric-500 bg-navy-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Number of trees in forest</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Max Depth</label>
                <span className="font-mono text-electric-400 font-bold">{maxDepth}</span>
              </div>
              <input
                type="range"
                min="4"
                max="30"
                step="1"
                value={maxDepth}
                onChange={(e) => setMaxDepth(e.target.value)}
                className="w-full accent-electric-500 bg-navy-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Max tree split depth</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Min Samples Split</label>
                <span className="font-mono text-electric-400 font-bold">{minSamplesSplit}</span>
              </div>
              <input
                type="range"
                min="2"
                max="10"
                step="1"
                value={minSamplesSplit}
                onChange={(e) => setMinSamplesSplit(e.target.value)}
                className="w-full accent-electric-500 bg-navy-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Min samples required to split</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Min Samples Leaf</label>
                <span className="font-mono text-electric-400 font-bold">{minSamplesLeaf}</span>
              </div>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                value={minSamplesLeaf}
                onChange={(e) => setMinSamplesLeaf(e.target.value)}
                className="w-full accent-electric-500 bg-navy-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Min samples in leaf node</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">Test Split Ratio</label>
                <span className="font-mono text-electric-400 font-bold">{Math.round(testSize * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.35"
                step="0.05"
                value={testSize}
                onChange={(e) => setTestSize(e.target.value)}
                className="w-full accent-electric-500 bg-navy-950 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Chronological test holdout</span>
            </div>
          </div>
        </div>

        {/* Validation Metrics KPI Row */}
        {activeMetrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <KPICard
                title="Mean Absolute Error (MAE)"
                value={activeMetrics.mae}
                unit="kWh"
                icon={Activity}
                color="electric"
                subtitle="Average absolute prediction error on test set"
              />

              <KPICard
                title="Root Mean Squared Error (RMSE)"
                value={activeMetrics.rmse}
                unit="kWh"
                icon={TrendingUp}
                color="amber"
                subtitle="Penalizes larger prediction deviations"
              />

              <KPICard
                title="R² Score (Determination)"
                value={activeMetrics.r2_score}
                unit=""
                icon={BrainCircuit}
                color={activeMetrics.r2_score > 0 ? "emerald" : "purple"}
                subtitle={activeMetrics.r2_score > 0 ? "Good model fit on holdout" : "Baseline ensemble fit"}
              />

              <KPICard
                title="Mean Abs Percentage (MAPE)"
                value={activeMetrics.mape ? `${activeMetrics.mape}%` : '--'}
                unit=""
                icon={BarChart3}
                color="electric"
                subtitle="Percentage error on actual consumption"
              />
            </div>

            {/* Visualizations: Actual vs Predicted & Feature Importance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actual vs Predicted Line Chart */}
              <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white tracking-tight">Actual vs Predicted Demand (Test Split)</h3>
                  <p className="text-xs text-slate-400">
                    Chronological holdout comparison between actual smart-meter kWh and Random Forest predictions
                  </p>
                </div>

                {comparisonSeries.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={comparisonSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="actual" name="Actual Consumption" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="predicted" name="RF Predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                    Run training to view actual vs predicted holdout curves.
                  </div>
                )}
              </div>

              {/* Feature Importance Bar Chart */}
              <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white tracking-tight">Feature Importance Analysis</h3>
                  <p className="text-xs text-slate-400">
                    Gini impurity reduction across all ensemble trees (Domain features)
                  </p>
                </div>

                {featureImportances.length > 0 ? (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={featureImportances.slice(0, 7)}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={85} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          formatter={(val) => [`${val}`, 'Gini Importance']}
                        />
                        <Bar dataKey="importance" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-xs text-slate-400">
                    No feature importances recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

