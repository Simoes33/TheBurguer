import axios from 'axios';

// Rotas públicas que NÃO devem redirecionar para login no 401
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/social'];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}` : '/api',
  timeout: 45_000, // 45 segundos para cobrir cold starts do Render
  headers: { 'Content-Type': 'application/json' },
});

// Injeta token JWT em todas as requisições autenticadas
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('@TheBurguer:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Trata erros globalmente com suporte a auto-retry para GET em caso de cold start / timeout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isPublicPath = PUBLIC_PATHS.some((p) => config?.url?.includes(p));

    // 401 em rotas protegidas: limpa sessão e redireciona para login
    if (error.response?.status === 401 && !isPublicPath) {
      sessionStorage.removeItem('@TheBurguer:user');
      sessionStorage.removeItem('@TheBurguer:token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Auto-retry para requisições GET em caso de timeout (cold start) ou falha de rede/502/503/504
    const isGet = config?.method?.toLowerCase() === 'get';
    const isNetworkOrTimeout =
      error.code === 'ECONNABORTED' ||
      !error.response ||
      (error.response?.status >= 502 && error.response?.status <= 504);

    if (config && isGet && isNetworkOrTimeout) {
      config.__retryCount = config.__retryCount || 0;
      const MAX_RETRIES = 2;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const delayMs = config.__retryCount * 2000; // 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return api(config);
      }
    }

    // Erro de timeout ou sem resposta do servidor após tentativas
    if (error.code === 'ECONNABORTED' || !error.response) {
      const networkError = new Error(
        'O servidor está iniciando ou sem conexão. Aguarde um instante e recarregue a página.',
      );
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  },
);

export default api;
