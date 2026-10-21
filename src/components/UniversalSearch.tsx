import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Server,
  Code2,
  Database,
  LineChart,
  Command,
  X,
  ArrowRight,
  Zap,
} from 'lucide-react';
import type { NavTab } from './Sidebar';
import type { ApiEndpoint, ServiceHealthReport } from '../types/telemetry';

export interface SearchResultItem {
  id: string;
  type: 'service' | 'endpoint' | 'table' | 'metric' | 'tab' | 'action';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  targetTab: NavTab;
  payload?: any;
}

interface UniversalSearchProps {
  endpoints: ApiEndpoint[];
  fleet: ServiceHealthReport[];
  tableCounts?: Record<string, number>;
  onSelectTab: (tab: NavTab) => void;
  onOpenApiTester: (endpoint: ApiEndpoint) => void;
  onPingFleet: () => void;
  onPurgeCache: () => void;
}

export const UniversalSearch: React.FC<UniversalSearchProps> = ({
  endpoints,
  fleet,
  tableCounts,
  onSelectTab,
  onOpenApiTester,
  onPingFleet,
  onPurgeCache,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut ⌘K or / to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Build searchable index
  const allSearchItems: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. Navigation Tabs & Cards
    items.push(
      {
        id: 'tab-overview',
        type: 'tab',
        title: 'System Overview Dashboard',
        subtitle: 'High-level health, fleet status, host stats, and quick actions',
        badge: 'View',
        badgeColor: '#3b82f6',
        targetTab: 'overview',
      },
      {
        id: 'tab-metrics',
        type: 'tab',
        title: 'Metrics & Trend Visualizations',
        subtitle: 'Interactive Recharts graphs for latency, DB pool, CPU, RAM & Redis ops',
        badge: 'Graphs',
        badgeColor: '#10b981',
        targetTab: 'metrics',
      },
      {
        id: 'tab-services',
        type: 'tab',
        title: 'Microservices & API Registry',
        subtitle: 'Process controls, health pinger, and live API tester catalog',
        badge: 'Services',
        badgeColor: '#f97316',
        targetTab: 'services',
      },
      {
        id: 'tab-logs',
        type: 'tab',
        title: 'Live Real-Time Logs & Telemetry',
        subtitle: 'High-speed WebSocket log stream with server/client & time filters',
        badge: 'Logs',
        badgeColor: '#06b6d4',
        targetTab: 'logs',
      },
      {
        id: 'tab-database',
        type: 'tab',
        title: 'PostgreSQL Database Performance',
        subtitle: 'Connection pool saturation, table row counts, size & query metrics',
        badge: 'Database',
        badgeColor: '#8b5cf6',
        targetTab: 'database',
      },
      {
        id: 'tab-cache',
        type: 'tab',
        title: 'Redis Cache & Memory Telemetry',
        subtitle: 'Hit ratios, key fragmentation, command throughput, and cache purger',
        badge: 'Cache',
        badgeColor: '#ec4899',
        targetTab: 'cache',
      },
      {
        id: 'tab-business',
        type: 'tab',
        title: 'Business KPIs & Recipe Metrics',
        subtitle: 'Total dishes, users, ratings, and top favorite dishes analytics',
        badge: 'Business',
        badgeColor: '#eab308',
        targetTab: 'business',
      }
    );

    // 2. Microservices
    fleet.forEach((svc) => {
      items.push({
        id: `svc-${svc.name}`,
        type: 'service',
        title: `${svc.name} (: ${svc.port})`,
        subtitle: `Status: ${svc.status.toUpperCase()} • Ping latency: ${svc.latency_ms.toFixed(1)}ms`,
        badge: svc.status,
        badgeColor: svc.status === 'online' ? '#10b981' : '#ef4444',
        targetTab: 'services',
        payload: svc,
      });
    });

    // 3. API Endpoints
    endpoints.forEach((ep) => {
      items.push({
        id: `ep-${ep.id}`,
        type: 'endpoint',
        title: `${ep.method} ${ep.path}`,
        subtitle: `${ep.service} • ${ep.description} (${ep.avg_latency_ms.toFixed(1)}ms avg)`,
        badge: ep.method,
        badgeColor:
          ep.method === 'GET'
            ? '#10b981'
            : ep.method === 'POST'
            ? '#3b82f6'
            : ep.method === 'PUT'
            ? '#eab308'
            : '#ef4444',
        targetTab: 'services',
        payload: ep,
      });
    });

    // 4. Database Tables
    if (tableCounts) {
      Object.entries(tableCounts).forEach(([table, count]) => {
        items.push({
          id: `tbl-${table}`,
          type: 'table',
          title: `PostgreSQL Table: ${table}`,
          subtitle: `${count.toLocaleString()} rows recorded in primary database`,
          badge: `${count} rows`,
          badgeColor: '#8b5cf6',
          targetTab: 'database',
        });
      });
    }

    // 5. Quick Actions
    items.push(
      {
        id: 'act-ping',
        type: 'action',
        title: 'Action: Ping Fleet Health',
        subtitle: 'Run synthetic latency probes against all 4 microservices',
        badge: 'Execute',
        badgeColor: '#f97316',
        targetTab: 'services',
        payload: 'ping',
      },
      {
        id: 'act-purge',
        type: 'action',
        title: 'Action: Purge Redis Cache',
        subtitle: 'Clear all cached queries or wildcard patterns from Redis',
        badge: 'Execute',
        badgeColor: '#ef4444',
        targetTab: 'cache',
        payload: 'purge',
      }
    );

    return items;
  }, [endpoints, fleet, tableCounts]);

  // Filtered results based on query
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return allSearchItems.slice(0, 10);
    }
    const q = query.toLowerCase().trim();
    return allSearchItems
      .filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.targetTab.toLowerCase().includes(q) ||
          item.badge?.toLowerCase().includes(q)
        );
      })
      .slice(0, 15);
  }, [allSearchItems, query]);

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false);
    if (item.type === 'action') {
      if (item.payload === 'ping') onPingFleet();
      if (item.payload === 'purge') onPurgeCache();
      onSelectTab(item.targetTab);
    } else if (item.type === 'endpoint') {
      onSelectTab('services');
      if (item.payload) {
        onOpenApiTester(item.payload as ApiEndpoint);
      }
    } else {
      onSelectTab(item.targetTab);
    }
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    }
  };

  const getItemIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'service':
        return <Server size={16} color="#f97316" />;
      case 'endpoint':
        return <Code2 size={16} color="#38bdf8" />;
      case 'table':
        return <Database size={16} color="#a78bfa" />;
      case 'metric':
      case 'tab':
        return <LineChart size={16} color="#34d399" />;
      case 'action':
        return <Zap size={16} color="#fbbf24" />;
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: '580px' }}>
      {/* Trigger Bar */}
      <div
        onClick={() => setIsOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.55rem 0.9rem',
          borderRadius: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.07)';
          e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Search size={16} color="#94a3b8" />
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Search services, APIs, tables, logs, cards...
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            padding: '0.15rem 0.45rem',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontFamily: 'monospace',
          }}
        >
          <Command size={11} />
          <span>K</span>
        </div>
      </div>

      {/* Floating Modal Command Palette */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '100%',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(249, 115, 22, 0.15)',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {/* Input Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              gap: '0.75rem',
            }}
          >
            <Search size={18} color="#f97316" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search anything in Cukkie Ops... (e.g. recipe, /trending, postgres, ping)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDownInInput}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.9rem',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Results List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '0.4rem',
            }}
          >
            {filteredResults.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                No matching services, APIs, or database records found for "{query}"
              </div>
            ) : (
              filteredResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(249, 115, 22, 0.25)' : 'transparent'}`,
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {getItemIcon(item.type)}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isSelected ? '#f8fafc' : '#e2e8f0' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: `${item.badgeColor || '#64748b'}20`,
                            color: item.badgeColor || '#94a3b8',
                            border: `1px solid ${item.badgeColor || '#64748b'}40`,
                            fontFamily: item.type === 'endpoint' ? 'monospace' : 'inherit',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isSelected && <ArrowRight size={14} color="#f97316" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Guide */}
          <div
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.72rem',
              color: '#64748b',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>ESC Close</span>
            </div>
            <span>{filteredResults.length} indexed items</span>
          </div>
        </div>
      )}
    </div>
  );
};
