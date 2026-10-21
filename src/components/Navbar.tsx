import React from 'react';
import {
  Activity,
  Server,
  Database,
  Layers,
  Terminal,
  BarChart3,
  RefreshCw,
  LogOut,
  Globe,
} from 'lucide-react';
import type { ConnectionStatus } from '../services/websocket';
import { getApiBaseUrl, setApiBaseUrl, DEFAULT_API_URL } from '../services/api';

export type NavTab = 'overview' | 'services' | 'database' | 'cache' | 'logs' | 'business';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  connectionStatus: ConnectionStatus;
  onRefresh: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  connectionStatus,
  onRefresh,
  onLogout,
}) => {
  const currentApiUrl = getApiBaseUrl();

  const handleEnvChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      const customUrl = prompt('Enter Ops Backend API URL:', currentApiUrl);
      if (customUrl) {
        setApiBaseUrl(customUrl.trim());
        window.location.reload();
      }
    } else {
      setApiBaseUrl(val);
      window.location.reload();
    }
  };

  const navItems: Array<{ id: NavTab; label: string; icon: React.FC<any> }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'services', label: 'Services & Fleet', icon: Server },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'cache', label: 'Redis Cache', icon: Layers },
    { id: 'logs', label: 'Live Logs', icon: Terminal },
    { id: 'business', label: 'Business KPIs', icon: BarChart3 },
  ];

  return (
    <header style={{
      background: 'rgba(10, 15, 28, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.875rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>🍪</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  Cukkie
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  Ops Hub
                </span>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Platform Observability</p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            background: connectionStatus === 'connected'
              ? 'rgba(16, 185, 129, 0.12)'
              : connectionStatus === 'connecting'
              ? 'rgba(245, 158, 11, 0.12)'
              : 'rgba(244, 63, 94, 0.12)',
            border: `1px solid ${
              connectionStatus === 'connected'
                ? 'rgba(16, 185, 129, 0.3)'
                : connectionStatus === 'connecting'
                ? 'rgba(245, 158, 11, 0.3)'
                : 'rgba(244, 63, 94, 0.3)'
            }`,
          }}>
            <span className={`status-dot ${
              connectionStatus === 'connected'
                ? 'dot-green'
                : connectionStatus === 'connecting'
                ? 'dot-yellow'
                : 'dot-red'
            }`} />
            <span style={{
              fontSize: '0.725rem',
              fontWeight: 600,
              color: connectionStatus === 'connected'
                ? '#34d399'
                : connectionStatus === 'connecting'
                ? '#fbbf24'
                : '#f87171',
            }}>
              {connectionStatus === 'connected'
                ? 'Live Stream'
                : connectionStatus === 'connecting'
                ? 'Connecting...'
                : 'Offline'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} color={isActive ? '#38bdf8' : '#64748b'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Environment */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {/* Environment Selector */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Globe size={14} color="#64748b" style={{ position: 'absolute', left: '0.6rem', pointerEvents: 'none' }} />
            <select
              value={currentApiUrl === DEFAULT_API_URL ? DEFAULT_API_URL : 'custom'}
              onChange={handleEnvChange}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '0.4rem 0.6rem 0.4rem 1.8rem',
                color: '#e2e8f0',
                fontSize: '0.775rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={DEFAULT_API_URL} style={{ background: '#0f172a' }}>Localhost (:8084)</option>
              <option value="custom" style={{ background: '#0f172a' }}>Cloud / Custom URL...</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh All Telemetry"
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={onLogout}
            title="Sign Out"
            className="btn btn-secondary btn-sm"
            style={{ color: '#fb7185' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
