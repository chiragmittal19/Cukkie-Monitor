import { Database, CheckCircle2, Server, HardDrive, BarChart2 } from 'lucide-react';
import type { DbStats } from '../types/telemetry';

interface DatabaseTabProps {
  db: DbStats | null;
}

export const DatabaseTab: React.FC<DatabaseTabProps> = ({ db }) => {
  if (!db) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
        Loading database telemetry...
      </div>
    );
  }

  const tables = [
    { name: 'Dishes (Catalog)', count: db.table_counts.dishes, color: '#06b6d4' },
    { name: 'Users', count: db.table_counts.users, color: '#3b82f6' },
    { name: 'App Logs (Telemetry)', count: db.table_counts.app_logs, color: '#8b5cf6' },
    { name: 'Dish Reviews', count: db.table_counts.dish_reviews, color: '#10b981' },
    { name: 'Recipe Steps', count: db.table_counts.recipe_steps, color: '#f59e0b' },
    { name: 'User Favorites', count: db.table_counts.user_favorites, color: '#f43f5e' },
    { name: 'Localization Strings', count: db.table_counts.localization_strings, color: '#14b8a6' },
  ];

  const maxCount = Math.max(...tables.map((t) => t.count), 1);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-card glow-emerald">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Database size={26} color="#34d399" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.2rem' }}>
                PostgreSQL Engine & Connection Pool
              </h1>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Engine health, connection saturation, and live table row counts in the `cukkie` database.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-online">
              <span className="status-dot dot-green" />
              Connected (:5432)
            </span>
          </div>
        </div>
      </div>

      {/* Database KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Pool Saturation */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Pool Saturation</span>
            <Server size={18} color="#06b6d4" />
          </div>
          <div className="metric-value">{db.pool_saturation_pct}%</div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div style={{
              width: `${db.pool_saturation_pct}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981, #06b6d4)',
            }} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            {db.active_connections} active / {db.max_connections} max connections
          </p>
        </div>

        {/* Cache Hit Ratio */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Buffer Cache Hit Ratio</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div className="metric-value">{db.cache_hit_ratio_pct}%</div>
          <p style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '0.5rem', fontWeight: 600 }}>
            Optimal (&gt;99% in-memory reads)
          </p>
        </div>

        {/* Database Size */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Total Disk Size</span>
            <HardDrive size={18} color="#8b5cf6" />
          </div>
          <div className="metric-value">{db.database_size}</div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Postgres cluster data directory on disk
          </p>
        </div>
      </div>

      {/* Table Distribution & Row Counts */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
              Database Table Distribution & Row Counts
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Live record counts across all core schemas.
            </p>
          </div>
          <BarChart2 size={20} color="#38bdf8" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tables.map((t) => {
            const pct = Math.max((t.count / maxCount) * 100, 3);
            return (
              <div key={t.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{t.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                    {t.count.toLocaleString()} rows
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${pct}%`,
                    height: '100%',
                    background: t.color,
                    borderRadius: '5px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
