export interface ServiceHealthReport {
  name: string;
  port: number;
  status: 'online' | 'degraded' | 'offline';
  latency_ms: number;
  endpoint: string;
  last_checked: string;
}

export interface TableCounts {
  dishes: number;
  users: number;
  app_logs: number;
  dish_reviews: number;
  recipe_steps: number;
  user_favorites: number;
  localization_strings: number;
  [key: string]: number;
}

export interface DbStats {
  status: string;
  active_connections: number;
  idle_connections: number;
  max_connections: number;
  pool_saturation_pct: number;
  database_size: string;
  cache_hit_ratio_pct: number;
  table_counts: TableCounts;
}

export interface CacheStats {
  status: string;
  used_memory: string;
  peak_memory: string;
  fragmentation_ratio: number;
  connected_clients: number;
  ops_per_sec: number;
  total_commands: number;
  keyspace_hits: number;
  keyspace_misses: number;
  hit_rate_pct: number;
  total_keys: number;
}

export interface SystemStats {
  cpu_usage_pct: number;
  memory_used_mb: number;
  memory_total_mb: number;
  memory_used_pct: number;
  uptime_seconds: number;
  host_name: string;
}

export interface TopFavoriteItem {
  dish_id: string;
  favorite_count: number;
}

export interface BusinessKpis {
  total_users: number;
  total_dishes: number;
  total_reviews: number;
  avg_dish_rating: number;
  top_favorites: TopFavoriteItem[];
}

export interface RichLogItem {
  id: string;
  timestamp: string;
  source: string;      // "server" | "client"
  service: string;     // "user_service" | "recipe_service" | "log_service" | "ops_service" | "postgres" | "redis"
  platform: string;    // "android" | "ios" | "dweb" | "mweb" | "backend"
  level: string;       // "INFO" | "WARN" | "ERROR" | "DEBUG"
  message: string;
  parameters: Record<string, any>;
}

export interface TimeSeriesPoint {
  time: string;
  user_service_latency: number;
  recipe_service_latency: number;
  log_service_latency: number;
  ops_service_latency: number;
  cpu_usage: number;
  memory_usage_mb: number;
  redis_ops: number;
  db_active_conns: number;
}

export interface ApiEndpoint {
  id: string;
  service: string;
  port: number;
  method: string;
  path: string;
  description: string;
  category: string;
  requires_auth: boolean;
  sample_payload?: Record<string, any> | null;
  sample_query?: string | null;
  total_calls: number;
  last_status?: number | null;
  avg_latency_ms: number;
  error_count: number;
  last_called?: string | null;
}

export interface ApiTestResult {
  success: boolean;
  endpoint_id: string;
  url: string;
  status_code: number;
  latency_ms: number;
  response_body: Record<string, any>;
  error?: string | null;
}

export interface TelemetrySnapshot {
  fleet: ServiceHealthReport[];
  db: DbStats;
  cache: CacheStats;
  system: SystemStats;
  business: BusinessKpis;
  history?: TimeSeriesPoint[];
  timestamp: string;
}

export interface ProcessActionResponse {
  success: boolean;
  service: string;
  action: 'start' | 'stop' | 'restart';
  message: string;
}
