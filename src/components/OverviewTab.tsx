import React from 'react';
import {
  Server,
  Database,
  Layers,
  Cpu,
  Zap,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { TelemetrySnapshot } from '../types/telemetry';
import type { NavTab } from './Sidebar';

interface OverviewTabProps {
  snapshot: TelemetrySnapshot | null;
  onNavigateTab: (tab: NavTab) => void;
  onPingFleet: () => void;
  isPinging: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  snapshot,
  onNavigateTab,
  onPingFleet,
  isPinging,
}) => {
  if (!snapshot || !snapshot.fleet || !snapshot.db || !snapshot.cache || !snapshot.system) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 1rem', color: '#64748b' }}>
        <RefreshCw size={32} className="spin" style={{ marginBottom: '1rem' }} />
        <p>Connecting to Cukkie Ops Telemetry Stream...</p>
      </div>
    );
  }

  const { fleet, db, cache, system } = snapshot;

  const onlineCount = fleet.filter((s) => s.status === 'online').length;
  const totalCount = fleet.length;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Quick Actions */}
      <div className="glass-card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08), rgba(139, 92, 246, 0.08))',
        borderColor: 'rgba(6, 182, 212, 0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <ShieldCheck size={26} color="#38bdf8" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.2rem' }}>
              Platform Overview & Health
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              Real-time telemetry aggregated across Rust microservices, PostgreSQL, and Redis.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={onPingFleet}
            disabled={isPinging}
            className="btn btn-primary btn-sm"
          >
            <Zap size={14} />
            <span>{isPinging ? 'Pinging Fleet...' : 'Test Fleet Latency'}</span>
          </button>
          <button
            onClick={() => onNavigateTab('services')}
            className="btn btn-secondary btn-sm"
          >
            <span>Service Controls</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Services Status Card */}
        <div
          className="glass-card glow-cyan"
          onClick={() => onNavigateTab('services')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} color="#38bdf8" />
              <span className="metric-label">Microservices Fleet</span>
            </div>
            <span className={`badge ${onlineCount === totalCount ? 'badge-online' : 'badge-degraded'}`}>
              <span className={`status-dot ${onlineCount === totalCount ? 'dot-green' : 'dot-yellow'}`} />
              {onlineCount}/{totalCount} Online
            </span>
          </div>
          <div className="metric-value">{onlineCount} <span style={{ fontSize: '1.1rem', color: '#64748b' }}>/ {totalCount} Active</span></div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            User (:8081), Recipe (:8082), Log (:8083), Ops (:8084) • Click to inspect APIs →
          </p>
        </div>

        {/* Database Health Card */}
        <div
          className="glass-card glow-emerald"
          onClick={() => onNavigateTab('database')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={18} color="#34d399" />
              <span className="metric-label">PostgreSQL Engine</span>
            </div>
            <span className="badge badge-online">
              <span className="status-dot dot-green" />
              {db.status}
            </span>
          </div>
          <div className="metric-value">{db.cache_hit_ratio_pct}%</div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Buffer Cache Hit Ratio • Size: {db.database_size} • Click for table schemas →
          </p>
        </div>

        {/* Redis Cache Card */}
        <div
          className="glass-card"
          onClick={() => onNavigateTab('cache')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="#f97316" />
              <span className="metric-label">Redis Cache</span>
            </div>
            <span className="badge badge-online">
              <span className="status-dot dot-green" />
              {cache.status === 'online' ? 'Connected' : 'Fallback'}
            </span>
          </div>
          <div className="metric-value">{cache.hit_rate_pct}%</div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            Hit Rate • Memory: {cache.used_memory} • {cache.total_keys} keys • Click to purge →
          </p>
        </div>

        {/* Host CPU & Memory */}
        <div
          className="glass-card"
          onClick={() => onNavigateTab('metrics')}
          style={{ cursor: 'pointer', transition: 'transform 0.15s ease, border-color 0.15s ease' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#a855f7" />
              <span className="metric-label">Host Performance</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {system.host_name}
            </span>
          </div>
          <div className="metric-value">{system.cpu_usage_pct}%</div>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            CPU Load • RAM: {system.memory_used_mb}MB / {system.memory_total_mb}MB • Click for trends →
          </p>
        </div>
      </div>

      {/* Fleet Topology Cards */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Fleet Status & Response Latencies
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Heartbeat latency and endpoint status tested continuously.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('services')}
            className="btn btn-secondary btn-sm"
          >
            Manage Fleet
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          {fleet.map((srv) => {
            const isOnline = srv.status === 'online';
            return (
              <div
                key={srv.name}
                style={{
                  background: 'rgba(8, 12, 22, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  padding: '1.125rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`status-dot ${isOnline ? 'dot-green' : 'dot-red'}`} />
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                      {srv.name}
                    </span>
                  </div>
                  <span className={`badge ${isOnline ? 'badge-online' : 'badge-offline'}`}>
                    {srv.status}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>Port :{srv.port}</span>
                  <span style={{
                    color: isOnline ? '#38bdf8' : '#f87171',
                    fontWeight: 600,
                  }}>
                    {isOnline ? `${srv.latency_ms} ms` : 'Unreachable'}
                  </span>
                </div>

                {/* Latency Bar visualization */}
                <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    width: isOnline ? `${Math.min(Math.max(srv.latency_ms * 5, 10), 100)}%` : '0%',
                    height: '100%',
                    background: isOnline ? '#06b6d4' : '#f43f5e',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Database & Cache Quick Meters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Postgres Pool Breakdown */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} color="#34d399" />
              <span>Postgres Connection Pool</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Max: {db.max_connections}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#94a3b8' }}>Pool Saturation</span>
                <span style={{ fontWeight: 700, color: '#f8fafc' }}>{db.pool_saturation_pct}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${db.pool_saturation_pct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                  borderRadius: '4px',
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.625rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#38bdf8' }}>{db.active_connections}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Active</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.625rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399' }}>{db.idle_connections}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Idle</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.625rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>{db.max_connections}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Limit</div>
            </div>
          </div>
        </div>

        {/* Redis Cache Breakdown */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={16} color="#f97316" />
              <span>Redis Operations & Hit Ratio</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              {cache.ops_per_sec} ops/sec
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#94a3b8' }}>Cache Efficiency (Hit Rate)</span>
                <span style={{ fontWeight: 700, color: '#34d399' }}>{cache.hit_rate_pct}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${cache.hit_rate_pct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #f97316, #10b981)',
                  borderRadius: '4px',
                }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.625rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#34d399' }}>{cache.keyspace_hits}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Hits</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.625rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fb7185' }}>{cache.keyspace_misses}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Misses</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '0.625rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f97316' }}>{cache.total_keys}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Keys</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
