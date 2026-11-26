import { ERROR_MESSAGES } from '../../../../shared/constants/errors';
import { setOffline } from './connectivity';
import { expireCurrentSession, getToken } from './session';

// Без ответа за это время считаем, что связи нет (иначе без сети экран висит на загрузке).
const REQUEST_TIMEOUT_MS = 10_000;
// 502/503/504 — ответ прокси без сервера, 530 — Cloudflare Tunnel без сервера.
const GATEWAY_DOWN_STATUSES = new Set([502, 503, 504, 530]);

// Адрес Go-бэкенда задаётся при сборке: EXPO_PUBLIC_API_URL (см. mobile/.env.example).
// На телефоне localhost — это сам телефон, поэтому для него нужен адрес компьютера в сети или сервера.
const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/+$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  // false — запрос без токена (вход и регистрация)
  auth?: boolean;
  // токен другого профиля вместо текущего (проверка при переключении профиля)
  token?: string;
}

export const apiRequest = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  { auth = true, token }: RequestOptions = {}
): Promise<T> => {
  const headers: Record<string, string> = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth) {
    const bearer = token ?? (await getToken());
    if (!bearer) {
      throw new ApiError(401, 'unauthorized', ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
    }
    headers.Authorization = `Bearer ${bearer}`;
  }

  let response: Response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    setOffline(true);
    throw new ApiError(0, 'network', 'Server is unavailable. Check your internet connection');
  } finally {
    clearTimeout(timer);
  }
  // Сервер на ПК выключен, а туннель/прокси перед ним работает — это тоже «нет связи»,
  // иначе неотправленные изменения посчитались бы отвергнутыми сервером и пропали.
  if (GATEWAY_DOWN_STATUSES.has(response.status)) {
    setOffline(true);
    throw new ApiError(0, 'network', 'Server is unavailable. Check your internet connection');
  }
  setOffline(false);

  if (response.status === 204) {
    return undefined as T;
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // тело не JSON — например, ошибка прокси
  }

  if (!response.ok) {
    const err = (data ?? {}) as { error?: string; message?: string };
    if (response.status === 401 && auth) {
      if (!token) {
        await expireCurrentSession();
      }
      throw new ApiError(401, 'unauthorized', ERROR_MESSAGES.USER_NOT_AUTHENTICATED);
    }
    throw new ApiError(
      response.status,
      err.error ?? 'http_error',
      err.message ?? `Server error (${response.status})`
    );
  }

  return data as T;
};
