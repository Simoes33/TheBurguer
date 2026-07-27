import axios from 'axios';

// Rotas públicas que NÃO devem redirecionar para login no 401
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/social'];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}` : '/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Injeta token JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('@TheBurguer:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicPath = PUBLIC_PATHS.some((p) => error.config?.url?.includes(p));

    // 401 em rotas protegidas: limpa sessão e redireciona para login
    if (error.response?.status === 401 && !isPublicPath) {
      sessionStorage.removeItem('@TheBurguer:user');
      sessionStorage.removeItem('@TheBurguer:token');
      // Evita redirect se já estiver na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Erro de timeout ou sem resposta do servidor
    if (error.code === 'ECONNABORTED' || !error.response) {
      const networkError = new Error('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);

export default api;
