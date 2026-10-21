import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { MetricsTab } from './components/MetricsTab';
import { ServicesTab } from './components/ServicesTab';
import { DatabaseTab } from './components/DatabaseTab';
import { CacheTab } from './components/CacheTab';
import { LogsTab } from './components/LogsTab';
import { BusinessTab } from './components/BusinessTab';
import { ApiTesterModal } from './components/ApiTesterModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import type {
  TelemetrySnapshot,
  RichLogItem,
  ApiEndpoint,
  TimeSeriesPoint,
} from './types/telemetry';
import {
  getStoredToken,
  clearStoredToken,
  fetchOverview,
  fetchRichLogs,
  fetchEndpoints,
  fetchHistory,
  triggerPingServices,
  purgeCache,
} from './services/api';
import { opsWsClient } from './services/websocket';
import type { ConnectionStatus } from './services/websocket';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getStoredToken());
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot | null>(null);
  const [logs, setLogs] = useState<RichLogItem[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [history, setHistory] = useState<TimeSeriesPoint[]>([]);
  const [selectedEndpointForTest, setSelectedEndpointForTest] = useState<ApiEndpoint | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isPinging, setIsPinging] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [isLiveLogsEnabled, setIsLiveLogsEnabled] = useState<boolean>(false);
  const isLiveLogsRef = React.useRef(isLiveLogsEnabled);
  useEffect(() => {
    isLiveLogsRef.current = isLiveLogsEnabled;
  }, [isLiveLogsEnabled]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRefreshLogs = useCallback(async () => {
    try {
      const freshLogs = await fetchRichLogs({ limit: 100 });
      if (freshLogs) {
        setLogs(freshLogs.slice(0, 100));
      }
      showToast('info', `Loaded ${freshLogs?.length ?? 0} most recent logs`);
    } catch (err: any) {
      showToast('error', `Failed to refresh logs: ${err.message}`);
    }
  }, [showToast]);

  const loadInitialData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [ov, recentLogs, epList, hist] = await Promise.all([
        fetchOverview().catch(() => null),
        fetchRichLogs({ limit: 100 }).catch(() => []),
        fetchEndpoints().catch(() => []),
        fetchHistory().catch(() => []),
      ]);
      if (ov) {
        setSnapshot(ov);
        if (ov.history && ov.history.length > 0) {
          setHistory(ov.history);
        }
      }
      if (recentLogs && recentLogs.length > 0) setLogs(recentLogs.slice(0, 100));
      if (epList && epList.length > 0) setEndpoints(epList);
      if (hist && hist.length > 0) setHistory(hist);
    } catch (err) {
      console.warn('Initial data load error', err);
    }
  }, [isAuthenticated]);

  const isTabVisibleRef = React.useRef(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isTabVisibleRef.current = isVisible;
      if (isVisible && isAuthenticated) {
        // Tab restored: immediately sync fresh state without lag
        loadInitialData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, loadInitialData]);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadInitialData();

    // Subscribe to WebSocket status
    const unsubStatus = opsWsClient.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // Subscribe to WebSocket snapshot broadcast (paused when tab is hidden to conserve resources)
    const unsubSnapshot = opsWsClient.onSnapshot((newSnapshot) => {
      if (!isTabVisibleRef.current) return;
      setSnapshot(newSnapshot);
      if (newSnapshot.history && newSnapshot.history.length > 0) {
        setHistory(newSnapshot.history);
      }
    });

    // Subscribe to WebSocket real-time log event stream (paused when hidden or stream toggled off)
    const unsubLogs = opsWsClient.onLogEntry((newLog) => {
      if (!isTabVisibleRef.current || !isLiveLogsRef.current) return;
      setLogs((prev) => [newLog, ...prev.slice(0, 99)]);
    });

    opsWsClient.connect();

    return () => {
      unsubStatus();
      unsubSnapshot();
      unsubLogs();
      opsWsClient.disconnect();
    };
  }, [isAuthenticated, loadInitialData]);

  const handlePingFleet = async () => {
    setIsPinging(true);
    try {
      const res = await triggerPingServices();
      if (res && res.fleet && snapshot) {
        setSnapshot({
          ...snapshot,
          fleet: res.fleet,
        });
      }
      showToast('success', 'Ping probe completed across all microservices');
    } catch (err: any) {
      showToast('error', `Fleet ping failed: ${err.message}`);
    } finally {
      setIsPinging(false);
    }
  };

  const handlePurgeCache = async () => {
    try {
      const res = await purgeCache('*');
      showToast('success', res.message || 'Purged Redis cache');
      loadInitialData();
    } catch (err: any) {
      showToast('error', `Failed to purge cache: ${err.message}`);
    }
  };

  const handleLogout = () => {
    clearStoredToken();
    setIsAuthenticated(false);
    showToast('info', 'Logged out of Cukkie Ops');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    showToast('success', 'Authenticated with Cukkie Ops Cluster');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070b14', color: '#f8fafc' }}>
      {/* Fixed Left Navigation Pane */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        connectionStatus={connectionStatus}
        fleet={snapshot?.fleet ?? []}
        logCount={logs.length}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Sticky Top Header with Universal Search */}
        <Header
          connectionStatus={connectionStatus}
          endpoints={endpoints}
          fleet={snapshot?.fleet ?? []}
          tableCounts={snapshot?.db?.table_counts}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenApiTester={(ep) => setSelectedEndpointForTest(ep)}
          onPingFleet={handlePingFleet}
          onPurgeCache={handlePurgeCache}
          onRefreshData={loadInitialData}
          isPinging={isPinging}
        />

        {/* Content Body */}
        <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          {activeTab === 'overview' && (
            <OverviewTab
              snapshot={snapshot}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onPingFleet={handlePingFleet}
              isPinging={isPinging}
            />
          )}

          {activeTab === 'metrics' && (
            <MetricsTab
              history={history}
              db={snapshot?.db ?? null}
              cache={snapshot?.cache ?? null}
              system={snapshot?.system ?? null}
              fleet={snapshot?.fleet ?? []}
              onRefresh={loadInitialData}
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab
              fleet={snapshot?.fleet ?? []}
              endpoints={endpoints}
              onRefreshFleet={loadInitialData}
              onOpenApiTester={(ep) => setSelectedEndpointForTest(ep)}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'logs' && (
            <LogsTab
              logs={logs}
              isLiveStreaming={isLiveLogsEnabled}
              onToggleLiveStream={setIsLiveLogsEnabled}
              onRefreshLogs={handleRefreshLogs}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseTab db={snapshot?.db ?? null} />
          )}

          {activeTab === 'cache' && (
            <CacheTab
              cache={snapshot?.cache ?? null}
              onRefreshCache={loadInitialData}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'business' && (
            <BusinessTab business={snapshot?.business ?? null} />
          )}
        </main>
      </div>

      {/* Interactive API Tester Drawer / Modal */}
      {selectedEndpointForTest && (
        <ApiTesterModal
          endpoint={selectedEndpointForTest}
          onClose={() => setSelectedEndpointForTest(null)}
          onShowToast={showToast}
        />
      )}

      {/* Login Authentication Modal */}
      {!isAuthenticated && (
        <LoginModal onSuccess={handleLoginSuccess} />
      )}

      {/* Notification Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
