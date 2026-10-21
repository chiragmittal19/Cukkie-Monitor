import React from 'react';
import {
  RotateCw,
  Zap,
  Radio,
} from 'lucide-react';
import type { ConnectionStatus } from '../services/websocket';
import { UniversalSearch } from './UniversalSearch';
import type { ApiEndpoint, ServiceHealthReport } from '../types/telemetry';
import type { NavTab } from './Sidebar';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  endpoints: ApiEndpoint[];
  fleet: ServiceHealthReport[];
  tableCounts?: Record<string, number>;
  onSelectTab: (tab: NavTab) => void;
  onOpenApiTester: (endpoint: ApiEndpoint) => void;
  onPingFleet: () => void;
  onPurgeCache: () => void;
  onRefreshData: () => void;
  isPinging: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  endpoints,
  fleet,
  tableCounts,
  onSelectTab,
  onOpenApiTester,
  onPingFleet,
  onPurgeCache,
  onRefreshData,
  isPinging,
}) => {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '64px',
        backgroundColor: 'rgba(12, 18, 30, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        gap: '1rem',
      }}
    >
      {/* Universal Search Box */}
      <div style={{ flex: 1, maxWidth: '560px' }}>
        <UniversalSearch
          endpoints={endpoints}
          fleet={fleet}
          tableCounts={tableCounts}
          onSelectTab={onSelectTab}
          onOpenApiTester={onOpenApiTester}
          onPingFleet={onPingFleet}
          onPurgeCache={onPurgeCache}
        />
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Synthetic Ping Button */}
        <button
          onClick={onPingFleet}
          disabled={isPinging}
          title="Send synthetic latency pings to all 4 microservices"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            border: '1px solid rgba(249, 115, 22, 0.35)',
            backgroundColor: 'rgba(249, 115, 22, 0.12)',
            color: '#fb923c',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: isPinging ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isPinging) e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.22)';
          }}
          onMouseLeave={(e) => {
            if (!isPinging) e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.12)';
          }}
        >
          <Zap size={14} fill="#fb923c" className={isPinging ? 'spin' : ''} />
          <span>{isPinging ? 'Pinging Fleet...' : 'Ping Fleet'}</span>
        </button>

        {/* Global Refresh Button */}
        <button
          onClick={onRefreshData}
          title="Refresh All Snapshots"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.45rem 0.8rem',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#e2e8f0',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <RotateCw size={13} />
          <span>Refresh</span>
        </button>

        {/* WebSocket Status Indicator Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.75rem',
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
            fontSize: '0.74rem',
            fontWeight: 600,
            color:
              connectionStatus === 'connected'
                ? '#34d399'
                : connectionStatus === 'connecting'
                ? '#facc15'
                : '#f87171',
          }}
        >
          <Radio size={12} className={connectionStatus === 'connected' ? 'pulse-badge' : ''} />
          <span style={{ textTransform: 'capitalize' }}>{connectionStatus}</span>
        </div>
      </div>
    </header>
  );
};
