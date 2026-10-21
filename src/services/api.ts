import type {
  TelemetrySnapshot,
  ServiceHealthReport,
  DbStats,
  CacheStats,
  RichLogItem,
  ProcessActionResponse,
  ApiEndpoint,
  ApiTestResult,
  TimeSeriesPoint,
} from '../types/telemetry';

const TOKEN_KEY = 'cukkie_ops_token';
const API_URL_KEY = 'cukkie_ops_api_url';

export const DEFAULT_API_URL = 'http://localhost:8084';

export function getApiBaseUrl(): string {
  return localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(API_URL_KEY, url);
}

export const DEFAULT_TOKEN = 'cukkie_ops_secret_2026';

export function getStoredToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    localStorage.setItem(TOKEN_KEY, DEFAULT_TOKEN);
    return DEFAULT_TOKEN;
  }
  return token;
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorBody}`);
  }

  return response.json();
}

export async function verifyToken(token: string): Promise<boolean> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/ops/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.valid === true;
}

export async function fetchOverview(): Promise<TelemetrySnapshot> {
  return request<TelemetrySnapshot>('/api/v1/ops/overview');
}

export async function fetchServices(): Promise<ServiceHealthReport[]> {
  return request<ServiceHealthReport[]>('/api/v1/ops/services');
}

export async function triggerPingServices(): Promise<{ success: boolean; fleet: ServiceHealthReport[] }> {
  return request<{ success: boolean; fleet: ServiceHealthReport[] }>('/api/v1/ops/services/ping', {
    method: 'POST',
  });
}

export async function startService(name: string): Promise<ProcessActionResponse> {
  return request<ProcessActionResponse>(`/api/v1/ops/services/${name}/start`, {
    method: 'POST',
  });
}

export async function stopService(name: string): Promise<ProcessActionResponse> {
  return request<ProcessActionResponse>(`/api/v1/ops/services/${name}/stop`, {
    method: 'POST',
  });
}

export async function restartService(name: string): Promise<ProcessActionResponse> {
  return request<ProcessActionResponse>(`/api/v1/ops/services/${name}/restart`, {
    method: 'POST',
  });
}

export async function fetchEndpoints(): Promise<ApiEndpoint[]> {
  return request<ApiEndpoint[]>('/api/v1/ops/endpoints');
}

export async function testEndpoint(
  endpointId: string,
  payload?: Record<string, any> | null,
  query?: string | null,
): Promise<ApiTestResult> {
  return request<ApiTestResult>(`/api/v1/ops/endpoints/${endpointId}/test`, {
    method: 'POST',
    body: JSON.stringify({ payload: payload ?? null, query: query ?? null }),
  });
}

export async function fetchHistory(): Promise<TimeSeriesPoint[]> {
  return request<TimeSeriesPoint[]>('/api/v1/ops/history');
}

export async function fetchDbStats(): Promise<DbStats> {
  return request<DbStats>('/api/v1/ops/db');
}

export async function fetchCacheStats(): Promise<CacheStats> {
  return request<CacheStats>('/api/v1/ops/cache');
}

export async function purgeCache(pattern: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/api/v1/ops/cache/purge', {
    method: 'POST',
    body: JSON.stringify({ pattern }),
  });
}

export interface LogsFilterParams {
  limit?: number;
  source?: string;
  service?: string;
  platform?: string;
  level?: string;
  time_window_secs?: number;
  search?: string;
}

export async function fetchRichLogs(params: LogsFilterParams = {}): Promise<RichLogItem[]> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.source && params.source !== 'all') query.set('source', params.source);
  if (params.service && params.service !== 'all') query.set('service', params.service);
  if (params.platform && params.platform !== 'all') query.set('platform', params.platform);
  if (params.level && params.level !== 'all') query.set('level', params.level);
  if (params.time_window_secs) query.set('time_window_secs', String(params.time_window_secs));
  if (params.search) query.set('search', params.search);

  const qs = query.toString();
  return request<RichLogItem[]>(`/api/v1/ops/logs${qs ? `?${qs}` : ''}`);
}

export async function ingestLog(log: Partial<RichLogItem>): Promise<RichLogItem> {
  return request<RichLogItem>('/api/v1/ops/logs/ingest', {
    method: 'POST',
    body: JSON.stringify(log),
  });
}
