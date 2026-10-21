import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Search,
  Download,
  Pause,
  Play,
  Code2,
  X,
  Server,
  Smartphone,
  Trash2,
  Copy,
  Check,
  Send,
  RotateCw,
  Radio,
  WifiOff,
} from 'lucide-react';
import type { RichLogItem } from '../types/telemetry';
import { ingestLog } from '../services/api';

interface LogsTabProps {
  logs: RichLogItem[];
  isLiveStreaming: boolean;
  onToggleLiveStream: (enabled: boolean) => void;
  onRefreshLogs: () => Promise<void>;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const LogsTab: React.FC<LogsTabProps> = ({
  logs,
  isLiveStreaming,
  onToggleLiveStream,
  onRefreshLogs,
  onShowToast,
}) => {
  // Primary mode: 'all' | 'server' | 'client'
  const [sourceMode, setSourceMode] = useState<'all' | 'server' | 'client'>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [timeWindowSecs, setTimeWindowSecs] = useState<number>(0); // 0 = all
  const [searchTerm, setSearchTerm] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [inspectLog, setInspectLog] = useState<RichLogItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [clearedBefore, setClearedBefore] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(() => new Date().toLocaleTimeString());

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshLogs();
      setLastRefreshed(new Date().toLocaleTimeString());
    } finally {
      setIsRefreshing(false);
    }
  };

  // Time window filtering logic
  const now = Date.now();

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Check if cleared
      const logTs = new Date(log.timestamp).getTime();
      if (clearedBefore > 0 && logTs <= clearedBefore) {
        return false;
      }

      // 1. Source filter
      if (sourceMode !== 'all' && log.source.toLowerCase() !== sourceMode) {
        return false;
      }

      // 2. Service sub-filter
      if (selectedService !== 'all' && log.service.toLowerCase() !== selectedService.toLowerCase()) {
        return false;
      }

      // 3. Platform sub-filter
      if (selectedPlatform !== 'all' && log.platform.toLowerCase() !== selectedPlatform.toLowerCase()) {
        return false;
      }

      // 4. Level filter
      if (selectedLevel !== 'all' && log.level.toUpperCase() !== selectedLevel.toUpperCase()) {
        return false;
      }

      // 5. Time window filter
      if (timeWindowSecs > 0) {
        const ageSecs = (now - logTs) / 1000;
        if (ageSecs > timeWindowSecs) {
          return false;
        }
      }

      // 6. Free text search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const msgMatch = log.message.toLowerCase().includes(q);
        const svcMatch = log.service.toLowerCase().includes(q);
        const paramMatch = JSON.stringify(log.parameters).toLowerCase().includes(q);
        const platformMatch = log.platform.toLowerCase().includes(q);
        if (!msgMatch && !svcMatch && !paramMatch && !platformMatch) {
          return false;
        }
      }

      return true;
    }).slice(0, 100);
  }, [
    logs,
    clearedBefore,
    sourceMode,
    selectedService,
    selectedPlatform,
    selectedLevel,
    timeWindowSecs,
    searchTerm,
    now,
  ]);

  const handleSendTestEvent = async () => {
    const testEvents = [
      {
        source: 'client',
        service: 'recipe_service',
        platform: 'dweb',
        level: 'INFO',
        message: '[Client] dish_clicked: dish_biryani',
        parameters: { dishId: 'dish_biryani', category: 'main_course', screen: 'home_feed' },
      },
      {
        source: 'client',
        service: 'user_service',
        platform: 'android',
        level: 'INFO',
        message: '[Client] user_bookmark_added',
        parameters: { dishId: 'dish_halwa', userId: 'usr_test_101' },
      },
      {
        source: 'client',
        service: 'recipe_service',
        platform: 'ios',
        level: 'INFO',
        message: '[Client] portion_size_changed',
        parameters: { dishId: 'dish_pbm', originalPortion: 2, newPortion: 4 },
      },
      {
        source: 'server',
        service: 'recipe_service',
        platform: 'backend',
        level: 'INFO',
        message: 'Cache hit for dish catalog: 12 items served in 1.4ms',
        parameters: { cache_status: 'HIT', latency_ms: 1.4 },
      },
    ];

    const pick = testEvents[Math.floor(Math.random() * testEvents.length)];
    try {
      await ingestLog(pick);
      onShowToast('success', `Sent live test event: ${pick.message}`);
    } catch (err: any) {
      onShowToast('error', `Failed to send event: ${err.message}`);
    }
  };

  const handleCopyInspect = () => {
    if (!inspectLog) return;
    navigator.clipboard.writeText(JSON.stringify(inspectLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('info', 'Log JSON copied to clipboard');
  };

  const exportAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cukkie_telemetry_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('success', `Exported ${filteredLogs.length} logs to JSON`);
  };

  const exportAsCsv = () => {
    const headers = ['id', 'timestamp', 'source', 'service', 'platform', 'level', 'message', 'parameters'];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.source}"`,
      `"${l.service}"`,
      `"${l.platform}"`,
      `"${l.level}"`,
      `"${l.message.replace(/"/g, '""')}"`,
      `"${JSON.stringify(l.parameters).replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `cukkie_telemetry_logs_${Date.now()}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('success', `Exported ${filteredLogs.length} logs to CSV`);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR':
        return '#ef4444';
      case 'WARN':
        return '#f59e0b';
      case 'DEBUG':
        return '#8b5cf6';
      case 'INFO':
      default:
        return '#3b82f6';
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Action Controls */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Terminal size={22} color="#38bdf8" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.2rem' }}>
              Logs & Telemetry Center
            </h1>
            <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              {isLiveStreaming
                ? '⚡ Real-time stream active (bounded strictly to 100 most recent items).'
                : '🛡️ High-performance snapshot mode. Click "Refresh Logs" or toggle Live Stream for real-time inspection.'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Manual Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Fetch the latest 100 logs from server on-demand"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              opacity: isRefreshing ? 0.7 : 1,
            }}
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
          </button>

          {/* Real-Time Live Stream Toggle */}
          <button
            onClick={() => {
              const next = !isLiveStreaming;
              onToggleLiveStream(next);
              onShowToast('info', next ? 'Live real-time stream ENABLED (capped at 100 items)' : 'Live stream PAUSED (Snapshot mode active)');
            }}
            title={isLiveStreaming ? 'Click to disable live streaming and save resources' : 'Click to enable real-time live streaming'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: `1px solid ${isLiveStreaming ? '#10b981' : 'rgba(255, 255, 255, 0.14)'}`,
              backgroundColor: isLiveStreaming ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: isLiveStreaming ? '#34d399' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isLiveStreaming ? <Radio size={14} color="#34d399" /> : <WifiOff size={14} />}
            <span>{isLiveStreaming ? 'Live Stream: ON (Max 100)' : 'Live Stream: OFF'}</span>
          </button>

          {/* Pause / Resume button if Live Stream is active */}
          {isLiveStreaming && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume stream scrolling' : 'Freeze stream to inspect line'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.45rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: isPaused ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: isPaused ? '#facc15' : '#e2e8f0',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isPaused ? <Play size={13} fill="#facc15" /> : <Pause size={13} />}
              <span>{isPaused ? 'Resume' : 'Freeze'}</span>
            </button>
          )}

          <button
            onClick={handleSendTestEvent}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              backgroundColor: 'rgba(249, 115, 22, 0.15)',
              color: '#fb923c',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Send size={13} />
            <span>Simulate Event</span>
          </button>

          <button
            onClick={() => {
              setClearedBefore(Date.now());
              onShowToast('info', 'Terminal view cleared');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>

          <button
            onClick={exportAsJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#38bdf8',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>JSON</span>
          </button>

          <button
            onClick={exportAsCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#38bdf8',
              fontSize: '0.78rem',
              cursor: 'pointer',
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filter Control Bar */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
        }}
      >
        {/* Row 1: Primary Source Segment (All vs Server-Side vs Client-Side) + Free Text Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Primary Source Tabs */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {[
              { id: 'all', label: 'All Logs', icon: Terminal },
              { id: 'server', label: 'Server-Side', icon: Server },
              { id: 'client', label: 'Client-Side', icon: Smartphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = sourceMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSourceMode(tab.id as any);
                    setSelectedService('all');
                    setSelectedPlatform('all');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: isActive ? '#f97316' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Free Text Search Box */}
          <div
            style={{
              position: 'relative',
              flex: 1,
              minWidth: '260px',
              maxWidth: '480px',
            }}
          >
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Free text filter (message, dishId, params)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Row 2: Sub-filters (Services / Platforms, Time Window, Log Level) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Sub-Filter: Server Services (Shown if Server or All) */}
          {(sourceMode === 'server' || sourceMode === 'all') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>SERVICE:</span>
              {['all', 'user_service', 'recipe_service', 'log_service', 'ops_service', 'postgres', 'redis'].map((svc) => (
                <button
                  key={svc}
                  onClick={() => setSelectedService(svc)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    border: `1px solid ${selectedService === svc ? 'rgba(249, 115, 22, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    backgroundColor: selectedService === svc ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: selectedService === svc ? '#fb923c' : '#94a3b8',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {svc === 'all' ? 'All Services' : svc}
                </button>
              ))}
            </div>
          )}

          {/* Sub-Filter: Client Platforms (Shown if Client or All) */}
          {(sourceMode === 'client' || sourceMode === 'all') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PLATFORM:</span>
              {['all', 'dweb', 'mweb', 'android', 'ios'].map((plt) => (
                <button
                  key={plt}
                  onClick={() => setSelectedPlatform(plt)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    border: `1px solid ${selectedPlatform === plt ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                    backgroundColor: selectedPlatform === plt ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                    color: selectedPlatform === plt ? '#38bdf8' : '#94a3b8',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {plt === 'all' ? 'All Platforms' : plt}
                </button>
              ))}
            </div>
          )}

          {/* Time Window Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>WINDOW:</span>
            {[
              { label: 'All', secs: 0 },
              { label: '10m', secs: 600 },
              { label: '30m', secs: 1800 },
              { label: '2h', secs: 7200 },
              { label: '24h', secs: 86400 },
            ].map((w) => (
              <button
                key={w.label}
                onClick={() => setTimeWindowSecs(w.secs)}
                style={{
                  padding: '0.25rem 0.55rem',
                  borderRadius: '4px',
                  border: `1px solid ${timeWindowSecs === w.secs ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                  backgroundColor: timeWindowSecs === w.secs ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: timeWindowSecs === w.secs ? '#34d399' : '#94a3b8',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {w.label}
              </button>
            ))}
          </div>

          {/* Level Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>LEVEL:</span>
            {['all', 'INFO', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '4px',
                  border: `1px solid ${selectedLevel === lvl ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  backgroundColor: selectedLevel === lvl ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  color: selectedLevel === lvl ? '#f8fafc' : '#94a3b8',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal View Table */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          backgroundColor: '#070b14',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
        }}
      >
        {/* Terminal Header */}
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLiveStreaming ? '#10b981' : '#64748b',
                boxShadow: isLiveStreaming ? '0 0 8px #10b981' : 'none',
              }}
            />
            <span style={{ fontFamily: 'monospace', color: isLiveStreaming ? '#34d399' : '#94a3b8', fontWeight: 600 }}>
              {isLiveStreaming ? 'LIVE REAL-TIME STREAM ACTIVE' : 'SNAPSHOT MODE (Click "Refresh Logs" to update)'}
            </span>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ color: '#94a3b8' }}>
              Refreshed: <strong style={{ color: '#cbd5e1' }}>{lastRefreshed}</strong>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>
              Showing <span style={{ color: '#f97316', fontWeight: 700 }}>{filteredLogs.length}</span> / {logs.length} logs
            </span>
            <span
              style={{
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#38bdf8',
                fontSize: '0.7rem',
                fontWeight: 600,
              }}
            >
              100 max cap
            </span>
          </div>
        </div>

        {/* Logs Output Lines */}
        <div
          style={{
            maxHeight: '560px',
            overflowY: 'auto',
            fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '0.8rem',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748b' }}>
              No telemetry or log entries match current filter settings.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const levelColor = getLevelBadgeColor(log.level);
              const formattedTime = new Date(log.timestamp).toLocaleTimeString();

              return (
                <div
                  key={log.id}
                  onClick={() => setInspectLog(log)}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.75rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {/* Timestamp */}
                  <span style={{ color: '#64748b', fontSize: '0.74rem', flexShrink: 0 }}>
                    {formattedTime}
                  </span>

                  {/* Level Badge */}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: `${levelColor}20`,
                      color: levelColor,
                      border: `1px solid ${levelColor}40`,
                      flexShrink: 0,
                    }}
                  >
                    {log.level}
                  </span>

                  {/* Source & Platform Badge */}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: log.source === 'client' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                      color: log.source === 'client' ? '#38bdf8' : '#fb923c',
                      flexShrink: 0,
                    }}
                  >
                    {log.source === 'client' ? `${log.platform}` : `${log.service}`}
                  </span>

                  {/* Message Content */}
                  <span
                    style={{
                      color: '#e2e8f0',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {log.message}
                  </span>

                  {/* Parameter preview */}
                  {log.parameters && Object.keys(log.parameters).length > 0 && (
                    <span
                      style={{
                        color: '#94a3b8',
                        fontSize: '0.72rem',
                        flexShrink: 0,
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {JSON.stringify(log.parameters)}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Inspect Log Drawer / Modal */}
      {inspectLog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setInspectLog(null)}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '650px',
              backgroundColor: '#0c121e',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              padding: 0,
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Code2 size={18} color="#38bdf8" />
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>
                  Log Record Details
                </span>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SOURCE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
                    {inspectLog.source}
                  </div>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SERVICE</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f97316' }}>
                    {inspectLog.service}
                  </div>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>PLATFORM</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                    {inspectLog.platform}
                  </div>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>TIMESTAMP</div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {inspectLog.timestamp}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  MESSAGE:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#f8fafc', backgroundColor: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '6px' }}>
                  {inspectLog.message}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#cbd5e1' }}>
                    PARAMETERS JSON:
                  </div>
                  <button
                    onClick={handleCopyInspect}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#cbd5e1',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    margin: 0,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    fontSize: '0.78rem',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                  }}
                >
                  {JSON.stringify(inspectLog.parameters, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
