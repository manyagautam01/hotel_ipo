import axios from 'axios';

export const STORAGE_KEY = 'roomly_auth'; // single place that defines where auth data lives

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
  timeout: 15000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved?.token) config.headers.Authorization = `Bearer ${saved.token}`;
  } catch {
    /* ignore corrupt storage */
  }
  return config;
});

// If the server says the session is invalid/expired, tell the AuthContext.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const hadToken = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && hadToken) {
      window.dispatchEvent(new CustomEvent('roomly:unauthorized', { detail: error.response.data?.message }));
    }
    return Promise.reject(error);
  }
);

export function errorMessage(error) {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Cannot reach the server. Make sure the backend is running on port 8001.';
  }
  return 'Something went wrong. Please try again.';
}

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};
export const roomApi = {
  list: (params) => api.get('/rooms', { params }),
  create: (data) => api.post('/rooms', data),
  setAvailability: (id, isAvailable) => api.patch(`/rooms/${id}/availability`, { isAvailable }),
  remove: (id) => api.delete(`/rooms/${id}`),
};
export const userApi = { list: () => api.get('/users') };
export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  mine: () => api.get('/bookings/mine'),
  all: () => api.get('/bookings'),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  setStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
};

export default api;
