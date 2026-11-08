import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 minutes to accommodate large 130MB files
});

export const smartGridApi = {
  // System Health
  checkHealth: () => api.get('/health'),

  // Data Upload & Management
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  loadDemoDataset: () => api.post('/upload/demo'),
  getDatasets: () => api.get('/datasets'),
  getDatasetPreview: (datasetId) => api.get('/dataset/preview', { params: { dataset_id: datasetId } }),
  getDatasetSummary: (datasetId) => api.get('/dataset/summary', { params: { dataset_id: datasetId } }),
  downloadTemplate: () => `${API_BASE}/template`,

  // Preprocessing
  preprocessDataset: (datasetId, mapping) => api.post('/preprocess', { dataset_id: datasetId, mapping }),

  // Training
  trainModel: (params) => api.post('/train', params),
  getModelMetrics: () => api.get('/model/metrics'),
  getFeatureImportance: () => api.get('/model/feature-importance'),

  // Prediction
  predictNextDay: (datasetId, targetDate) => api.post('/predict/next-day', { dataset_id: datasetId, target_date: targetDate }),

  // Dashboard
  getDashboardSummary: () => api.get('/dashboard/summary'),
  getConsumptionTrend: (rangeType) => api.get('/dashboard/consumption-trend', { params: { range_type: rangeType } }),

  // Load Balancing
  getLoadBalancing: (datasetId) => api.get('/load-balancing', { params: { dataset_id: datasetId } }),

  // Insights
  getInsights: (datasetId) => api.get('/insights', { params: { dataset_id: datasetId } }),

  // History
  getHistory: (params) => api.get('/history', { params }),
  deleteHistoryItem: (id) => api.delete(`/history/${id}`),

  // Settings
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
};

export default api;

