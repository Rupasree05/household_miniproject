import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  Settings2,
  Table
} from 'lucide-react';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import { smartGridApi } from '../services/api';

export default function DataUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [activeDataset, setActiveDataset] = useState(null);
  const [alert, setAlert] = useState(null);

  // Column mapping state
  const [showMapping, setShowMapping] = useState(false);
  const [customMapping, setCustomMapping] = useState({ datetime: '', power: '' });

  const fetchActiveDataset = async () => {
    try {
      const res = await smartGridApi.getDatasetPreview();
      if (res.data.status === 'success' && res.data.dataset) {
        setActiveDataset(res.data.dataset);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchActiveDataset();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setAlert({ type: 'error', title: 'Invalid File', message: 'Please upload a CSV or text-delimited smart-meter file.' });
      return;
    }
    setSelectedFile(file);
    setAlert(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setAlert(null);
      const res = await smartGridApi.uploadFile(selectedFile);
      setAlert({
        type: 'success',
        title: 'Upload Successful',
        message: `Dataset '${selectedFile.name}' uploaded and analyzed. ${res.data.data.total_rows} records detected.`
      });
      setSelectedFile(null);
      await fetchActiveDataset();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail 
        || (err.code === 'ERR_NETWORK' || err.message === 'Network Error' 
            ? 'Cannot connect to backend server. Please ensure the backend is running at http://127.0.0.1:8000 (open a terminal in backend/ and run: uvicorn app.main:app --reload --port 8000, or double-click start_smartgrid.bat).' 
            : err.message)
        || 'Failed to upload dataset.';
      setAlert({
        type: 'error',
        title: 'Upload Error',
        message: msg
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      setAlert(null);
      const res = await smartGridApi.loadDemoDataset();
      setAlert({
        type: 'success',
        title: 'Demo Data Loaded',
        message: 'UCI Household Power 120-Day dataset successfully loaded.'
      });
      await fetchActiveDataset();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail 
        || (err.code === 'ERR_NETWORK' || err.message === 'Network Error' 
            ? 'Cannot connect to backend server. Please ensure the backend is running at http://127.0.0.1:8000 (open a terminal in backend/ and run: uvicorn app.main:app --reload --port 8000, or double-click start_smartgrid.bat).' 
            : err.message)
        || 'Failed to load demo dataset.';
      setAlert({
        type: 'error',
        title: 'Error',
        message: msg
      });
    } finally {
      setLoadingDemo(false);
    }
  };

  const summary = activeDataset?.summary || {};

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 pb-16">
      <Header
        title="Data Ingestion & Management"
        subtitle="Upload UCI Household Power telemetry or smart-meter CSV records"
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

        {/* Upload Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drag & Drop Upload Zone (2 cols) */}
          <div className="lg:col-span-2 p-8 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-electric-400" />
                  <span>Upload Smart-Meter CSV</span>
                </h3>
                <a
                  href={smartGridApi.downloadTemplate()}
                  download="smartgrid_template.csv"
                  className="inline-flex items-center space-x-1.5 text-xs text-electric-400 hover:text-electric-300 font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sample Template CSV</span>
                </a>
              </div>

              {/* Drop area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragActive
                    ? 'border-electric-400 bg-electric-500/10'
                    : 'border-slate-700/80 hover:border-slate-600 bg-navy-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-electric-500/10 text-electric-400 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click to browse or drag and drop your CSV'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports UCI Household Power (`Date;Time;Global_active_power...`) or simple (`datetime,power_consumption`)
                </p>
                {selectedFile && (
                  <div className="mt-3 inline-flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="px-6 py-2.5 rounded-lg bg-electric-500 hover:bg-electric-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-md shadow-electric-500/20 transition-all flex items-center space-x-2"
              >
                {uploading ? (
                  <span>Parsing Dataset...</span>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload & Validate</span>
                  </>
                )}
              </button>

              <button
                onClick={handleLoadDemo}
                disabled={loadingDemo}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{loadingDemo ? 'Loading Demo...' : 'Load 120-Day Demo Dataset'}</span>
              </button>
            </div>
          </div>

          {/* Dataset Specifications & Guidance Card */}
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-3">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Dataset Specifications</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                The forecasting model requires chronological consumption records with minimum 14 consecutive days for lag & rolling features.
              </p>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-navy-950/80 border border-slate-800">
                  <h4 className="font-semibold text-slate-200 mb-1">UCI Household Dataset:</h4>
                  <p className="text-slate-400 text-[11px] font-mono leading-tight">
                    Date; Time; Global_active_power; Global_reactive_power; Voltage; Global_intensity; Sub_metering_1...
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-navy-950/80 border border-slate-800">
                  <h4 className="font-semibold text-slate-200 mb-1">Simplified Smart Meter:</h4>
                  <p className="text-slate-400 text-[11px] font-mono leading-tight">
                    datetime, power_consumption (kWh or kW)
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-electric-950/30 border border-electric-500/20 text-[11px] text-slate-300">
                  <div className="font-semibold text-electric-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Official UCI Dataset Instructions:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed mb-1.5">
                    Download the raw archive from the{' '}
                    <a
                      href="https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-electric-400 underline hover:text-electric-300"
                    >
                      UCI Machine Learning Repository
                    </a>
                    . SmartGrid AI automatically detects the semicolon (;) delimiter, parses timestamps, and cleans '?' null markers.
                  </p>
                </div>
              </div>
            </div>

            {activeDataset && (
              <button
                onClick={() => navigate('/preprocessing')}
                className="mt-6 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Proceed to Preprocessing</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Dataset Overview & Statistics */}
        {activeDataset && (
          <div className="p-6 rounded-2xl bg-navy-900/90 border border-slate-800 shadow-xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-base">{activeDataset.filename}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {activeDataset.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Uploaded {activeDataset.uploaded_at}</p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowMapping(!showMapping)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium border border-slate-700 flex items-center space-x-1.5"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Column Mapping</span>
                </button>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Records</span>
                <p className="text-xl font-bold font-mono text-white mt-1">{summary.total_rows || activeDataset.original_rows}</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Columns</span>
                <p className="text-xl font-bold font-mono text-white mt-1">{summary.total_cols || activeDataset.original_cols}</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Missing Values</span>
                <p className="text-xl font-bold font-mono text-amber-400 mt-1">{summary.total_missing ?? 0}</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Duplicates</span>
                <p className="text-xl font-bold font-mono text-slate-300 mt-1">{summary.duplicate_rows ?? 0}</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Format Detected</span>
                <p className="text-sm font-bold font-mono text-electric-400 mt-2 uppercase">{summary.format_type || 'UCI'}</p>
              </div>

              <div className="p-4 rounded-xl bg-navy-950/70 border border-slate-800/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Validation</span>
                <p className="text-sm font-bold text-emerald-400 mt-2 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Verified</span>
                </p>
              </div>
            </div>

            {/* Custom Column Mapping Drawer */}
            {showMapping && (
              <div className="p-4 rounded-xl bg-navy-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Map Custom Columns</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Datetime Column Name</label>
                    <input
                      type="text"
                      placeholder="e.g. timestamp or date"
                      value={customMapping.datetime}
                      onChange={(e) => setCustomMapping({ ...customMapping, datetime: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Power Consumption Column Name</label>
                    <input
                      type="text"
                      placeholder="e.g. active_power or kwh"
                      value={customMapping.power}
                      onChange={(e) => setCustomMapping({ ...customMapping, power: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-electric-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Raw Dataset Preview Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Table className="w-4 h-4 text-electric-400" />
                <span>Raw Ingestion Preview (First 10 Records)</span>
              </h4>

              {summary.preview_rows && summary.preview_rows.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-navy-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-mono">
                      <tr>
                        {summary.columns?.slice(0, 8).map((col) => (
                          <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {summary.preview_rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {summary.columns?.slice(0, 8).map((col) => (
                            <td key={col} className="py-2 px-3 whitespace-nowrap text-slate-300">
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No preview rows available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

