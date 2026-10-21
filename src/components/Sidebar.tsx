import React from 'react';
import {
  Activity,
  LineChart,
  Server,
  Terminal,
  Database,
  Layers,
  TrendingUp,
  LogOut,
  Radio,
  Sparkles,
} from 'lucide-react';
import type { ConnectionStatus } from '../services/websocket';
import type { ServiceHealthReport } from '../types/telemetry';

export type NavTab =
  | 'overview'
  | 'metrics'
  | 'services'
  | 'logs'
  | 'database'
  | 'cache'
  | 'business';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  connectionStatus: ConnectionStatus;
  fleet: ServiceHealthReport[];
  logCount: number;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  connectionStatus,
  fleet,
  logCount,
  onLogout,
}) => {
  const onlineCount = fleet.filter((s) => s.status === 'online').length;
  const totalFleet = fleet.length || 4;

  const navSections = [
    {
      title: 'OBSERVABILITY',
      items: [
        {
          id: 'overview' as NavTab,
          label: 'Overview',
          icon: Activity,
          badge: null,
        },
        {
          id: 'metrics' as NavTab,
          label: 'Metrics & Trends',
          icon: LineChart,
          badge: 'Live',
        },
        {
          id: 'services' as NavTab,
          label: 'Services & APIs',
          icon: Server,
          badge: `${onlineCount}/${totalFleet}`,
        },
        {
          id: 'logs' as NavTab,
          label: 'Live Logs',
          icon: Terminal,
          badge: logCount > 0 ? `${logCount}` : null,
          badgePulse: true,
        },
      ],
    },
    {
      title: 'INFRASTRUCTURE',
      items: [
        {
          id: 'database' as NavTab,
          label: 'PostgreSQL DB',
          icon: Database,
          badge: null,
        },
        {
          id: 'cache' as NavTab,
          label: 'Redis Cache',
          icon: Layers,
          badge: null,
        },
      ],
    },
    {
      title: 'BUSINESS & PRODUCT',
      items: [
        {
          id: 'business' as NavTab,
          label: 'KPIs & Analytics',
          icon: TrendingUp,
          badge: null,
        },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '260px',
        minWidth: '260px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: '#0c121e',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 50,
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div>
        <div
          style={{
            padding: '1.25rem 1.25rem 1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              }}
            >
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f8fafc', letterSpacing: '-0.02em' }}>
                Cukkie<span style={{ color: '#f97316' }}>Ops</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                Fleet Observability
              </div>
            </div>
          </div>

          {/* Connection Status Indicator */}
          <div
            title={`WebSocket: ${connectionStatus}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor:
                connectionStatus === 'connected'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : connectionStatus === 'connecting'
                  ? 'rgba(234, 179, 8, 0.15)'
                  : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${
                connectionStatus === 'connected'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : connectionStatus === 'connecting'
                  ? 'rgba(234, 179, 8, 0.3)'
                  : 'rgba(239, 68, 68, 0.3)'
              }`,
            }}
          >
            <Radio
              size={12}
              color={
                connectionStatus === 'connected'
                  ? '#10b981'
                  : connectionStatus === 'connecting'
                  ? '#eab308'
                  : '#ef4444'
              }
              className={connectionStatus === 'connected' ? 'pulse-badge' : ''}
            />
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {navSections.map((sec) => (
            <div key={sec.title}>
              <div
                style={{
                  padding: '0 0.75rem 0.4rem',
                  fontSize: '0.675rem',
                  fontWeight: 700,
                  color: '#475569',
                  letterSpacing: '0.08em',
                }}
              >
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.55rem 0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#f8fafc' : '#94a3b8',
                        backgroundColor: isActive ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = '#f1f5f9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#94a3b8';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <Icon
                          size={17}
                          color={isActive ? '#f97316' : '#64748b'}
                          style={{ transition: 'color 0.15s' }}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '9999px',
                            backgroundColor: isActive
                              ? 'rgba(249, 115, 22, 0.25)'
                              : 'rgba(255, 255, 255, 0.06)',
                            color: isActive ? '#fb923c' : '#94a3b8',
                            border: `1px solid ${
                              isActive ? 'rgba(249, 115, 22, 0.3)' : 'rgba(255, 255, 255, 0.08)'
                            }`,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fleet Status & Logout */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {/* Environment Pill Card */}
        <div
          style={{
            padding: '0.65rem 0.75rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>ENVIRONMENT</span>
            <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>Local Cluster</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Hub Port</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>8084</span>
          </div>
        </div>

        {/* Logout Action */}
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            width: '100%',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.18)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
          }}
        >
          <LogOut size={14} />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};
