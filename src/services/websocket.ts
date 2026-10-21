import type { TelemetrySnapshot, RichLogItem } from '../types/telemetry';
import { getApiBaseUrl, getStoredToken } from './api';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export class OpsWebSocketClient {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private snapshotListeners: Array<(snapshot: TelemetrySnapshot) => void> = [];
  private logListeners: Array<(log: RichLogItem) => void> = [];
  private reconnectTimeout: any = null;
  private backoffMs: number = 1000;
  private isExplicitlyClosed: boolean = false;

  constructor() {
    // idle initially until connect is invoked
  }

  public connect(): void {
    this.isExplicitlyClosed = false;
    this.cleanupSocket();

    const baseUrl = getApiBaseUrl();
    const token = getStoredToken();

    // Convert http/https to ws/wss
    const wsBase = baseUrl.replace(/^http/, 'ws');
    const wsUrl = token ? `${wsBase}/api/v1/ops/ws?token=${encodeURIComponent(token)}` : `${wsBase}/api/v1/ops/ws`;

    this.updateStatus('connecting');

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.updateStatus('connected');
        this.backoffMs = 1000; // Reset backoff on success
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data) {
            if (data.type === 'snapshot' || (data.fleet && data.db)) {
              const snapshotData = data.data || data;
              if (snapshotData && snapshotData.fleet && snapshotData.db) {
                this.snapshotListeners.forEach((fn) => fn(snapshotData as TelemetrySnapshot));
              }
            } else if (data.type === 'log_entry' && data.log) {
              this.logListeners.forEach((fn) => fn(data.log as RichLogItem));
            }
          }
        } catch (err) {
          console.warn('[OpsWS] Failed to parse message', err);
        }
      };

      this.socket.onclose = () => {
        this.updateStatus('disconnected');
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('[OpsWS] WebSocket error:', err);
        this.socket?.close();
      };
    } catch (err) {
      this.updateStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.cleanupSocket();
    this.updateStatus('disconnected');
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.status);
    return () => {
      this.statusListeners = this.statusListeners.filter((fn) => fn !== callback);
    };
  }

  public onSnapshot(callback: (snapshot: TelemetrySnapshot) => void): () => void {
    this.snapshotListeners.push(callback);
    return () => {
      this.snapshotListeners = this.snapshotListeners.filter((fn) => fn !== callback);
    };
  }

  public onLogEntry(callback: (log: RichLogItem) => void): () => void {
    this.logListeners.push(callback);
    return () => {
      this.logListeners = this.logListeners.filter((fn) => fn !== callback);
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.backoffMs = Math.min(this.backoffMs * 1.5, 10000);
      this.connect();
    }, this.backoffMs);
  }

  private cleanupSocket(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      this.socket.onmessage = null;
      try {
        this.socket.close();
      } catch (_) {}
      this.socket = null;
    }
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => fn(newStatus));
    }
  }
}

export const opsWsClient = new OpsWebSocketClient();
