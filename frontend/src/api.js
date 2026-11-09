import { Platform } from 'react-native';

// Endereço da API. Em produção defina EXPO_PUBLIC_API_URL no arquivo frontend/.env
// com a URL do Render (ex.: https://peteats-api.onrender.com).
const localApiUrl = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export const apiUrl = (process.env.EXPO_PUBLIC_API_URL || localApiUrl).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

// O plano gratuito do Render "dorme" sem uso; o primeiro acesso pode levar ~1 minuto.
const TIMEOUT_MS = 70000;

export const request = async (path, { method = 'GET', body, token } = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_error) {
      data = {};
    }

    if (!response.ok) {
      throw new ApiError(data.error || `Erro ${response.status} na API.`, response.status);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError('O servidor demorou para responder. Tente novamente.', 0);
    }
    throw new ApiError('Sem conexão com o servidor. Verifique a internet e tente novamente.', 0);
  } finally {
    clearTimeout(timeout);
  }
};
