import axios from 'axios';

function createApiClient(baseURL) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const message = error.response?.data?.message || 'حصل خطأ غير متوقع، حاول تاني';
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      return Promise.reject(new Error(message));
    }
  );

  return client;
}

export const authClient = createApiClient(import.meta.env.VITE_AUTH_API_URL);
export const habitsClient = createApiClient(import.meta.env.VITE_HABITS_API_URL);
export const dashboardClient = createApiClient(import.meta.env.VITE_DASHBOARD_API_URL);
