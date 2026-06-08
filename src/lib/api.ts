import type { ApiResponse } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const json: ApiResponse<{ token: string; refresh_token: string }> = await res.json();
    if (json.code === 0 && json.data) {
      localStorage.setItem('token', json.data.token);
      localStorage.setItem('refreshToken', json.data.refresh_token);
      return json.data.token;
    }
    return null;
  } catch {
    return null;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  customHeaders?: Record<string, string>
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let response = await fetch(url, options);

  if (response.status === 401 && !path.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await refreshAccessToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return { code: 401, message: '登录已过期，请重新登录', data: null as T };
      }
    } else {
      const newToken = await new Promise<string>((resolve) => {
        addRefreshSubscriber(resolve);
      });
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  const json: ApiResponse<T> = await response.json();
  return json;
}

export const api = {
  get<T>(path: string, headers?: Record<string, string>) {
    return request<T>('GET', path, undefined, headers);
  },
  post<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return request<T>('POST', path, body, headers);
  },
  put<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return request<T>('PUT', path, body, headers);
  },
  delete<T>(path: string, headers?: Record<string, string>) {
    return request<T>('DELETE', path, undefined, headers);
  },
};
