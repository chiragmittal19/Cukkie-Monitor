import React, { useState } from 'react';
import {
  Server,
  Play,
  Square,
  RotateCw,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import type { ServiceHealthReport, ApiEndpoint } from '../types/telemetry';
import { startService, stopService, restartService } from '../services/api';

interface ServicesTabProps {
  fleet: ServiceHealthReport[];
  endpoints: ApiEndpoint[];
  onRefreshFleet: () => void;
  onOpenApiTester: (endpoint: ApiEndpoint) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

const SERVICE_META: Record<string, { title: string; description: string }> = {
  user_service: {
    title: 'User & Authentication Service',
    description: 'Handles OTP SMS login, JWT issuance, user profile storage, and dietary preference configurations.',
  },
  recipe_service: {
    title: 'Recipe & Catalog Service',
    description: 'Serves home feed, drawer categories, dish ingredients, nutritional breakdowns, step instructions, and reviews.',
  },
  log_service: {
    title: 'Client Log & Analytics Ingestion',
    description: 'High-throughput asynchronous batching worker for client telemetry events, clicks, and performance metrics.',
  },
  ops_service: {
    title: 'Operations & Monitoring Hub',
    description: 'Aggregates platform telemetry, manages service lifecycles, and broadcasts real-time WebSocket metrics.',
  },
};

export const ServicesTab: React.FC<ServicesTabProps> = ({
  fleet,
  endpoints,
  onRefreshFleet,
  onOpenApiTester,
  onShowToast,
}) => {
  const [busyService, setBusyService] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({
    recipe_service: true,
    user_service: true,
    log_service: true,
    ops_service: false,
  });
  const [apiSearch, setApiSearch] = useState('');

  const toggleExpand = (serviceName: string) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceName]: !prev[serviceName],
    }));
  };

  const handleStart = async (serviceName: string) => {
    setBusyService(serviceName);
    try {
      const res = await startService(serviceName);
      onShowToast('success', res.message || `Started ${serviceName}`);
      setTimeout(onRefreshFleet, 1000);
    } catch (err: any) {
      onShowToast('error', `Failed to start ${serviceName}: ${err.message}`);
    } finally {
      setBusyService(null);
    }
  };

  const handleStop = async (serviceName: string) => {
    setConfirmStop(null);
    setBusyService(serviceName);
    try {
      const res = await stopService(serviceName);
      onShowToast('info', res.message || `Stopped ${serviceName}`);
      setTimeout(onRefreshFleet, 500);
    } catch (err: any) {
      onShowToast('error', `Failed to stop ${serviceName}: ${err.message}`);
    } finally {
      setBusyService(null);
    }
  };

  const handleRestart = async (serviceName: string) => {
    setBusyService(serviceName);
    try {
      const res = await restartService(serviceName);
      onShowToast('success', res.message || `Restarted ${serviceName}`);
      setTimeout(onRefreshFleet, 1200);
    } catch (err: any) {
      onShowToast('error', `Failed to restart ${serviceName}: ${err.message}`);
    } finally {
      setBusyService(null);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.25rem' }}>
            Microservices Fleet & Interactive API Explorer
          </h1>
          <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
            Live process supervision, health pings, route inspection, and interactive API test execution.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              placeholder="Filter APIs by route or name..."
              value={apiSearch}
              onChange={(e) => setApiSearch(e.target.value)}
              style={{
                padding: '0.45rem 0.75rem 0.45rem 2rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                width: '240px',
              }}
            />
          </div>

          <button
            onClick={onRefreshFleet}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCw size={14} />
            <span>Refresh Health</span>
          </button>
        </div>
      </div>

      {/* Service Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {fleet.map((svc) => {
          const meta = SERVICE_META[svc.name] || {
            title: svc.name,
            description: 'Microservice component running on local cluster.',
          };
          const isOnline = svc.status === 'online';
          const isOps = svc.name === 'ops_service';
          const isBusy = busyService === svc.name;
          const isExpanded = !!expandedServices[svc.name];

          // Filter endpoints for this service
          const serviceEndpoints = endpoints.filter((ep) => {
            const matchesService = ep.service === svc.name;
            if (!matchesService) return false;
            if (!apiSearch.trim()) return true;
            const q = apiSearch.toLowerCase();
            return (
              ep.path.toLowerCase().includes(q) ||
              ep.description.toLowerCase().includes(q) ||
              ep.method.toLowerCase().includes(q)
            );
          });

          return (
            <div
              key={svc.name}
              className="glass-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                borderLeft: `4px solid ${isOnline ? '#10b981' : '#ef4444'}`,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
              }}
            >
              {/* Service Meta & Primary Actions Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Server size={22} color={isOnline ? '#10b981' : '#ef4444'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                        {meta.title}
                      </h2>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isOnline ? '#10b981' : '#ef4444',
                          border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {svc.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                      Ident: <code style={{ color: '#f97316' }}>{svc.name}</code> • Listening on Port{' '}
                      <code style={{ color: '#38bdf8' }}>:{svc.port}</code> • Health Latency:{' '}
                      <span style={{ color: isOnline ? '#10b981' : '#94a3b8', fontWeight: 600 }}>
                        {isOnline ? `${svc.latency_ms.toFixed(1)}ms` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Process Lifecycle Control Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {confirmStop === svc.name ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        padding: '0.3rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <AlertTriangle size={14} color="#ef4444" />
                      <span style={{ fontSize: '0.75rem', color: '#fca5a5' }}>Confirm Stop?</span>
                      <button
                        onClick={() => handleStop(svc.name)}
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: '#ef4444',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmStop(null)}
                        style={{
                          padding: '0.2rem 0.4rem',
                          borderRadius: '4px',
                          border: 'none',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                          color: '#cbd5e1',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      {!isOnline ? (
                        <button
                          onClick={() => handleStart(svc.name)}
                          disabled={isBusy}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            cursor: isBusy ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Play size={13} fill="#34d399" />
                          <span>Start Process</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleRestart(svc.name)}
                            disabled={isBusy}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.45rem 0.8rem',
                              borderRadius: '6px',
                              border: '1px solid rgba(249, 115, 22, 0.3)',
                              backgroundColor: 'rgba(249, 115, 22, 0.1)',
                              color: '#fb923c',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: isBusy ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <RotateCw size={13} />
                            <span>Restart</span>
                          </button>

                          {!isOps && (
                            <button
                              onClick={() => setConfirmStop(svc.name)}
                              disabled={isBusy}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.45rem 0.8rem',
                                borderRadius: '6px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                color: '#f87171',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: isBusy ? 'not-allowed' : 'pointer',
                              }}
                            >
                              <Square size={13} fill="#f87171" />
                              <span>Stop</span>
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Expand / Collapse APIs Button */}
                  <button
                    onClick={() => toggleExpand(svc.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#cbd5e1',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <span>APIs ({serviceEndpoints.length})</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Service Description */}
              <p style={{ fontSize: '0.825rem', color: '#94a3b8', margin: 0 }}>
                {meta.description}
              </p>

              {/* Expanded API Explorer Table */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '0.6rem 0.85rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.04em' }}>
                      REGISTERED API ROUTES & PERFORMANCE DRILLDOWN
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Click "⚡ Test API" to execute live request against :{svc.port}
                    </span>
                  </div>

                  {serviceEndpoints.length === 0 ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                      No matching API endpoints found for this service.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {serviceEndpoints.map((ep) => {
                        const methodColor =
                          ep.method === 'GET'
                            ? '#10b981'
                            : ep.method === 'POST'
                            ? '#3b82f6'
                            : ep.method === 'PUT'
                            ? '#eab308'
                            : '#ef4444';

                        return (
                          <div
                            key={ep.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.75rem 0.95rem',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              gap: '1rem',
                              flexWrap: 'wrap',
                            }}
                          >
                            {/* Route Path & Method */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '280px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  backgroundColor: `${methodColor}20`,
                                  color: methodColor,
                                  border: `1px solid ${methodColor}40`,
                                  fontFamily: 'monospace',
                                  width: '48px',
                                  textAlign: 'center',
                                }}
                              >
                                {ep.method}
                              </span>
                              <div>
                                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                                  {ep.path}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  {ep.description}
                                </div>
                              </div>
                            </div>

                            {/* Performance Stats */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                                  {ep.avg_latency_ms > 0 ? `${ep.avg_latency_ms.toFixed(1)} ms` : '—'}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Avg Latency</div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                                  {ep.total_calls}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Calls</div>
                              </div>

                              {ep.last_status && (
                                <span
                                  style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    backgroundColor:
                                      ep.last_status >= 200 && ep.last_status < 300
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(239, 68, 68, 0.15)',
                                    color:
                                      ep.last_status >= 200 && ep.last_status < 300
                                        ? '#10b981'
                                        : '#ef4444',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {ep.last_status}
                                </span>
                              )}

                              {/* Interactive Test API Button */}
                              <button
                                onClick={() => onOpenApiTester(ep)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(249, 115, 22, 0.4)',
                                  backgroundColor: 'rgba(249, 115, 22, 0.15)',
                                  color: '#fb923c',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.25)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(249, 115, 22, 0.15)';
                                }}
                              >
                                <Zap size={12} fill="#fb923c" />
                                <span>Test API</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
