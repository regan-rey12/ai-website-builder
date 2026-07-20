import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export async function generateWebsite(prompt, clientId) {
  const { data } = await api.post(
    '/api/websites/generate',
    { prompt },
    { headers: clientId ? { 'x-client-id': clientId } : {} }
  );
  return data;
}

export async function getWebsite(id) {
  const { data } = await api.get(`/api/websites/${id}`);
  return data;
}

export async function updateWebsiteSettings(id, settings) {
  const { data } = await api.put(`/api/websites/${id}/settings`, settings);
  return data;
}

export async function checkHealth() {
  const { data } = await api.get('/api/health');
  return data;
}

export default api;
