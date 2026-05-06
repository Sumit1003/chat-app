import axios from 'axios';

const api = axios.create({
  baseURL: "https://chat-backend-3kj7.onrender.com/api",
  timeout: 30000, // ⏱ prevents hanging requests (important for Render)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error?.response?.data || error.message);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;