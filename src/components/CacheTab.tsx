import { useState } from 'react';
import { Layers, Trash2, Zap, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { CacheStats } from '../types/telemetry';
import { purgeCache } from '../services/api';

interface CacheTabProps {
  cache: CacheStats | null;
  onRefreshCache: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const CacheTab: React.FC<CacheTabProps> = ({
  cache,
  onRefreshCache,
  onShowToast,
}) => {
  const [purgePattern, setPurgePattern] = useState('*');
  const [confirmPurge, setConfirmPurge] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  if (!cache) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
        Loading cache telemetry...
      </div>
    );
  }

  const handleExecutePurge = async () => {
    setConfirmPurge(false);
    setIsPurging(true);
    try {
      const res = await purgeCache(purgePattern);
      onShowToast('success', res.message || 'Cache purged successfully');
      setTimeout(onRefreshCache, 500);
    } catch (err: any) {
      onShowToast('error', `Failed to purge cache: ${err.message}`);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ borderColor: 'rgba(249, 115, 22, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Layers size={26} color="#f97316" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.2rem' }}>
                Redis Cache Engine & Performance
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                High-speed caching layer with in-memory fallback for dishes, categories, and localization.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-online">
              <span className="status-dot dot-green" />
              {cache.status === 'online' ? 'Redis Active (:6379)' : 'Fallback Active'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Hit Rate */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Cache Hit Rate</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div className="metric-value">{cache.hit_rate_pct}%</div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: `${cache.hit_rate_pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #f97316, #10b981)',
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {cache.keyspace_hits} hits / {cache.keyspace_misses} misses
          </p>
        </div>

        {/* Memory Footprint */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Memory Footprint</span>
            <Layers size={18} color="#f97316" />
          </div>
          <div className="metric-value">{cache.used_memory}</div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Peak Memory: {cache.peak_memory} • Fragmentation: {cache.fragmentation_ratio}
          </p>
        </div>

        {/* Command Throughput */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Command Throughput</span>
            <Zap size={18} color="#06b6d4" />
          </div>
          <div className="metric-value">{cache.ops_per_sec} <span style={{ fontSize: '1rem', color: '#64748b' }}>ops/s</span></div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {cache.total_commands} total commands processed
          </p>
        </div>

        {/* Total Keys */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Total Cached Keys</span>
            <Layers size={18} color="#8b5cf6" />
          </div>
          <div className="metric-value">{cache.total_keys}</div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Active keys in database index db0
          </p>
        </div>
      </div>

      {/* Interactive Cache Purge Utility */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
          <Trash2 size={20} color="#f43f5e" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Cache Invalidation & Purge Utility
          </h2>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Force cache invalidation to verify cache misses or refresh stale dish configurations. You can purge by key prefix or flush the entire keyspace.
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          background: 'rgba(8, 12, 22, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '1rem',
        }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>
              Select Invalidation Target / Pattern
            </label>
            <select
              value={purgePattern}
              onChange={(e) => setPurgePattern(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
                color: '#ffffff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value="*">Flush Entire Cache (* - all keys)</option>
              <option value="dish:*">Dish Details & Nutrition (dish:*)</option>
              <option value="home:*">Home Feed & Carousels (home:*)</option>
              <option value="user:*">User Preferences (user:*)</option>
            </select>
          </div>

          <button
            onClick={() => setConfirmPurge(true)}
            disabled={isPurging}
            className="btn btn-danger"
            style={{ alignSelf: 'flex-end', height: '38px' }}
          >
            <Trash2 size={15} />
            <span>{isPurging ? 'Purging...' : 'Execute Cache Purge'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmPurge && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '14px',
            padding: '2rem',
            maxWidth: '420px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldAlert size={22} color="#f43f5e" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Confirm Cache Invalidation
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to invalidate keys matching pattern <strong style={{ color: '#ffffff' }}>"{purgePattern}"</strong>? The next requests will trigger database queries until the cache warms up.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmPurge(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleExecutePurge}
                className="btn btn-danger btn-sm"
              >
                Confirm & Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
