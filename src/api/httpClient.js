/**
 * 🌐 Cliente HTTP Centralizado
 * Gerencia todas as requisições para o backend com tratamento de erros robusto
 */

function normalizeBaseUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

function inferApiUrl() {
  if (typeof window === 'undefined') return '';
  const { protocol, hostname } = window.location;
  if (!protocol || !hostname) return '';
  return `${protocol}//${hostname}:4000`;
}

// URL base da API
// - Em build do CRA, REACT_APP_API_URL é “baked-in” no bundle.
// - Quando ausente (ex.: build servido localmente sem env), inferimos do host atual.
const API_URL = normalizeBaseUrl(process.env.REACT_APP_API_URL) || normalizeBaseUrl(inferApiUrl());

if (!API_URL) {
  throw new Error(
    '❌ Não foi possível determinar a URL do backend.\n' +
    'Defina REACT_APP_API_URL (ex.: http://localhost:4000).'
  );
}

// Log para debug (só em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 API URL configurada:', API_URL);
}

/**
 * Tipos de erro para tratamento específico
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  SERVER: 'SERVER_ERROR',
  CLIENT: 'CLIENT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * Classe de erro customizada para API
 */
export class ApiError extends Error {
  constructor(message, type, status = null, originalError = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.originalError = originalError;
  }
}

/**
 * Categoriza o erro para tratamento específico
 */
function categorizeError(error, response = null) {
  // Timeout
  if (error.name === 'AbortError') {
    return new ApiError(
      'A requisição demorou muito e foi cancelada. Tente novamente.',
      ErrorTypes.TIMEOUT,
      null,
      error
    );
  }

  // Network Error (backend offline, CORS bloqueado, etc.)
  // TypeError é lançado quando fetch falha por rede/CORS
  if (error instanceof TypeError || error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
    return new ApiError(
      'Não foi possível conectar ao servidor. Verifique se o backend está rodando.',
      ErrorTypes.NETWORK,
      null,
      error
    );
  }

  // HTTP Errors
  if (response) {
    const status = response.status;
    
    if (status >= 500) {
      return new ApiError(
        `Erro interno no servidor (${status}). Tente novamente mais tarde.`,
        ErrorTypes.SERVER,
        status,
        error
      );
    }
    
    if (status >= 400) {
      return new ApiError(
        `Erro na requisição (${status}): ${error.message || 'Dados inválidos'}`,
        ErrorTypes.CLIENT,
        status,
        error
      );
    }
  }

  // Erro genérico
  return new ApiError(
    error.message || 'Ocorreu um erro inesperado',
    ErrorTypes.UNKNOWN,
    null,
    error
  );
}

/**
 * Faz uma requisição HTTP com timeout e tratamento de erros
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const timeout = options.timeout || 15000; // 15 segundos padrão
  
  // Criar AbortController para timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    ...(options.headers || {})
  };

  const config = {
    method,
    headers,
    signal: controller.signal,
    cache: options.cache || 'no-store',
    ...options
  };
  
  // Adicionar body se existir (e só então definir Content-Type)
  if (options.body !== undefined) {
    if (!('Content-Type' in headers)) {
      headers['Content-Type'] = 'application/json';
    }
    config.body = JSON.stringify(options.body);
  }
  
  let response = null;
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [HTTP] ${config.method} ${url}`);
    }
    
    response = await fetch(url, config);
    clearTimeout(timeoutId);
    
    // Parsear resposta JSON (tolerante a respostas vazias)
    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (response.status !== 204 && response.status !== 304 && contentType.includes('application/json')) {
      data = await response.json();
    }
    
    // Verificar se a resposta foi bem sucedida
    if (!response.ok) {
      const errorMessage = (data && data.error) ? data.error : `HTTP ${response.status}`;
      const error = new Error(errorMessage);
      throw categorizeError(error, response);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [HTTP] ${config.method} ${endpoint} - ${response.status}`);
    }
    
    return data;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Se já é um ApiError, repassa
    if (error instanceof ApiError) {
      console.error(`❌ [HTTP] ${error.type}: ${error.message}`);
      throw error;
    }
    
    // Categoriza e lança
    const apiError = categorizeError(error, response);
    console.error(`❌ [HTTP] ${apiError.type}: ${apiError.message}`);
    throw apiError;
  }
}

/**
 * API Client com métodos convenientes
 */
const httpClient = {
  /**
   * GET request
   */
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  
  /**
   * POST request
   */
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  
  /**
   * PUT request
   */
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  
  /**
   * DELETE request
   */
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  
  /**
   * Retorna a URL base da API
   */
  getBaseUrl: () => API_URL,
  
  /**
   * Verifica se o backend está online
   */
  healthCheck: async () => {
    try {
      const result = await request('/health', { timeout: 5000 });
      return { online: true, ...result };
    } catch (error) {
      return { online: false, error: error.message };
    }
  }
};

export default httpClient;
