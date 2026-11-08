import React from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  TrendingUp,
  Cpu,
  BrainCircuit,
  Scale,
  ShieldCheck,
  ArrowRight,
  Database,
  BarChart3,
  CheckCircle,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 selection:bg-electric-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="h-20 border-b border-slate-800/80 bg-navy-950/70 backdrop-blur-lg sticky top-0 z-50 px-6 lg:px-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-electric-500 p-0.5 shadow-lg shadow-electric-500/20">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-electric-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">SmartGrid</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-electric-500/10 text-electric-400 border border-electric-500/30">AI</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Household Energy Intelligence</p>
          </div>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-electric-400 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-electric-400 transition-colors">How It Works</a>
          <a href="#architecture" className="hover:text-electric-400 transition-colors">Architecture</a>
          <a href="#applications" className="hover:text-electric-400 transition-colors">Applications</a>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/upload"
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-400 hover:to-electric-500 text-white text-sm font-semibold shadow-lg shadow-electric-500/25 transition-all duration-150 flex items-center space-x-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-6 lg:px-16 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-electric-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[250px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 mb-8 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300">
              Powered by Scikit-Learn Random Forest Regression
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight mb-6">
            Predict Tomorrow's Energy. <br />
            <span className="text-gradient-electric">Optimize Today's Consumption.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            An intelligent household energy forecasting system powered by Random Forest Machine Learning to predict next-day electricity demand and enable smarter energy management.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/upload"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-electric-500 to-electric-600 hover:from-electric-400 hover:to-electric-500 text-white font-semibold text-sm shadow-xl shadow-electric-500/30 flex items-center justify-center space-x-2 transition-all duration-150 hover:scale-[1.02]"
            >
              <Database className="w-4 h-4" />
              <span>Get Started</span>
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-navy-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700/80 flex items-center justify-center space-x-2 transition-all duration-150"
            >
              <BarChart3 className="w-4 h-4 text-electric-400" />
              <span>Explore Dashboard</span>
            </Link>
          </div>

          {/* Energy Analytics Interactive Illustration Card */}
          <div className="mt-16 p-2 rounded-2xl bg-gradient-to-b from-slate-700/30 via-slate-800/20 to-navy-900 border border-slate-800/90 shadow-2xl backdrop-blur-md">
            <div className="rounded-xl bg-navy-900/90 p-6 text-left border border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-electric-500/10 text-electric-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Next-Day Household Load Telemetry</h4>
                    <p className="text-xs text-slate-400">Random Forest Ensemble • Zero Data Leakage</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Demand: Normal (20.2 kWh)</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-electric-500/15 text-electric-400 border border-electric-500/30">
                    Peak: 19:00 - 21:00
                  </span>
                </div>
              </div>

              {/* Grid of Mini KPIs in Illustration */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-lg bg-navy-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Target Prediction</span>
                  <p className="text-xl font-bold font-mono text-white mt-1">20.2 kWh</p>
                  <span className="text-[11px] text-emerald-400 font-medium">95% Confidence Interval</span>
                </div>
                <div className="p-4 rounded-lg bg-navy-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">7-Day Baseline</span>
                  <p className="text-xl font-bold font-mono text-slate-300 mt-1">23.6 kWh</p>
                  <span className="text-[11px] text-electric-400 font-medium">-14.9% vs Prev Day</span>
                </div>
                <div className="p-4 rounded-lg bg-navy-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Load Shift Potential</span>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">22.1%</p>
                  <span className="text-[11px] text-slate-400">Shave Evening Peak</span>
                </div>
                <div className="p-4 rounded-lg bg-navy-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Ensemble Model</span>
                  <p className="text-xl font-bold font-mono text-electric-400 mt-1">100 Trees</p>
                  <span className="text-[11px] text-slate-400">MAE: 2.66 kWh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-20 px-6 lg:px-16 border-t border-slate-800/80 bg-navy-900/40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-electric-400 uppercase tracking-widest mb-3">Enterprise-Grade ML Pipeline</h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Engineered for Smart Grids & Modern Homes</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Robust data preprocessing, strict time-series feature engineering, and actionable utility peak shifting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-electric-500/10 text-electric-400 flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Random Forest Regression</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Trained on smart-meter time series using multi-tree decision ensembles with configurable estimators, tree depth, and sample leaf splits.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Zero Data Leakage</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict past-only feature construction. All lag features (t-1, t-2, t-3, t-7) and rolling statistics strictly incorporate historical data before prediction.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-electric-500/10 text-electric-400 flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Intelligent Load Balancing</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies peak demand windows, calculates shiftable flexible loads (laundry, EV, water heating), and simulates smoothed demand curves.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">UCI Smart Meter Compatibility</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Directly reads UCI Individual Household Electric Power datasets and custom datetime/power CSVs with automated cleaning and daily resampling.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Uncertainty & Feature Importance</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provides actual test-set MAE/RMSE uncertainty bounds rather than arbitrary confidence scores, plus Gini feature importance rankings.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-200">
              <div className="w-10 h-10 rounded-lg bg-electric-500/10 text-electric-400 flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Real-Time Cost Projections</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Configurable tariff rates per kWh with anomaly detection and monetary savings estimates under Time-of-Use utility structures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 lg:px-16 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-electric-400 uppercase tracking-widest mb-3">Workflow Pipeline</h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">From Raw Meter Readings to Grid Harmony</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            <div className="p-6 rounded-xl bg-navy-900/90 border border-slate-800">
              <div className="text-3xl font-black font-mono text-electric-500/40 mb-3">01</div>
              <h4 className="text-sm font-bold text-white mb-2">Upload Smart Data</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingest sub-metered records or simplified power logs. Drag-and-drop or load the instant 120-day demo dataset.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/90 border border-slate-800">
              <div className="text-3xl font-black font-mono text-electric-500/40 mb-3">02</div>
              <h4 className="text-sm font-bold text-white mb-2">Preprocess & Clean</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Impute nulls, remove duplicates, filter invalid values, and aggregate minute/hour telemetry into daily consumption totals.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/90 border border-slate-800">
              <div className="text-3xl font-black font-mono text-electric-500/40 mb-3">03</div>
              <h4 className="text-sm font-bold text-white mb-2">Train Random Forest</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate lag (1, 2, 3, 7 days) and rolling window features. Split chronologically and validate MAE, RMSE, and R² scores.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-navy-900/90 border border-slate-800">
              <div className="text-3xl font-black font-mono text-emerald-500/40 mb-3">04</div>
              <h4 className="text-sm font-bold text-white mb-2">Forecast & Balance</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Predict next-day kWh, classify demand tier, pinpoint peak windows, and recommend actionable appliance schedules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real-World Stakeholder Applications */}
      <section id="applications" className="py-20 px-6 lg:px-16 border-t border-slate-800/80 bg-navy-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3">Domain Applications</h2>
            <h3 className="text-3xl font-extrabold text-white tracking-tight">Empowering Households & Utility Operators</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-navy-900/80 border border-slate-800">
              <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">For Smart Households</h4>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Anticipate next-day electricity costs before high-consumption days happen.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Shift heavy appliances (EV charger, dryer, dishwasher) to low-tariff off-peak hours.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Detect unusual baseload leaks and faulty equipment early.</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-2xl bg-navy-900/80 border border-slate-800">
              <div className="p-3 w-fit rounded-xl bg-electric-500/10 text-electric-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white mb-3">For Utility & Grid Operators</h4>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-electric-400 shrink-0 mt-0.5" />
                  <span>Forecast aggregated feeder substation load to prevent localized transformer overloads.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-electric-400 shrink-0 mt-0.5" />
                  <span>Optimize peaker plant dispatch and time-of-use demand response incentive programs.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-electric-400 shrink-0 mt-0.5" />
                  <span>Enable sustainable solar and renewable integration by shaving evening demand spikes.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 px-6 lg:px-16 border-t border-slate-800 text-center bg-navy-950">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Forecast & Balance Power Demand?</h3>
          <p className="text-sm text-slate-400 mb-8">
            Experience complete end-to-end Machine Learning electricity demand forecasting.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/upload"
              className="px-6 py-3 rounded-xl bg-electric-500 hover:bg-electric-400 text-white font-semibold text-sm shadow-lg shadow-electric-500/25 transition-all"
            >
              Start Free Analytics
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              Open Dashboard
            </Link>
          </div>
          <div className="mt-12 text-xs text-slate-400 border-t border-slate-800/80 pt-6">
            SmartGrid AI • Intelligent Household Power Demand Prediction & Load Balancing System • Developed with React, FastAPI & Scikit-Learn
          </div>
        </div>
      </section>
    </div>
  );
}

