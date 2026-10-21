import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import type { ApiEndpoint, ApiTestResult } from '../types/telemetry';
import { testEndpoint } from '../services/api';

interface ApiTesterModalProps {
  endpoint: ApiEndpoint | null;
  onClose: () => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ApiTesterModal: React.FC<ApiTesterModalProps> = ({
  endpoint,
  onClose,
  onShowToast,
}) => {
  const [queryInput, setQueryInput] = useState('');
  const [payloadInput, setPayloadInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApiTestResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (endpoint) {
      setQueryInput(endpoint.sample_query || '');
      setPayloadInput(
        endpoint.sample_payload
          ? JSON.stringify(endpoint.sample_payload, null, 2)
          : ''
      );
      setResult(null);
    }
  }, [endpoint]);

  if (!endpoint) return null;

  const handleRunTest = async () => {
    setIsLoading(true);
    setResult(null);

    let parsedPayload = null;
    if (payloadInput.trim()) {
      try {
        parsedPayload = JSON.parse(payloadInput);
      } catch (err) {
        onShowToast('error', 'Invalid JSON payload. Please fix syntax.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const res = await testEndpoint(
        endpoint.id,
        parsedPayload,
        queryInput.trim() ? queryInput.trim() : null
      );
      setResult(res);
      if (res.success) {
        onShowToast('success', `API Call succeeded: ${res.status_code} in ${res.latency_ms.toFixed(1)}ms`);
      } else {
        onShowToast('error', `API Call failed: ${res.error || res.status_code}`);
      }
    } catch (err: any) {
      onShowToast('error', `Execution error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result.response_body, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowToast('info', 'Response copied to clipboard');
  };

  const methodColor =
    endpoint.method === 'GET'
      ? '#10b981'
      : endpoint.method === 'POST'
      ? '#3b82f6'
      : endpoint.method === 'PUT'
      ? '#eab308'
      : '#ef4444';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0c121e',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: `${methodColor}25`,
                color: methodColor,
                border: `1px solid ${methodColor}50`,
                fontFamily: 'monospace',
              }}
            >
              {endpoint.method}
            </span>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                {endpoint.path}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Service: <span style={{ color: '#f97316', fontWeight: 600 }}>{endpoint.service}</span> (Port {endpoint.port}) • {endpoint.category}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Endpoint Description */}
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.85rem',
              color: '#94a3b8',
            }}
          >
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>Description: </span>
            {endpoint.description}
            {endpoint.requires_auth && (
              <span
                style={{
                  marginLeft: '0.5rem',
                  fontSize: '0.72rem',
                  color: '#eab308',
                  backgroundColor: 'rgba(234, 179, 8, 0.12)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                Requires Auth
              </span>
            )}
          </div>

          {/* Query Parameters (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Query String (e.g. ?limit=10)
            </label>
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="?page=1&limit=5"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
          </div>

          {/* JSON Payload (if POST/PUT) */}
          {(endpoint.method === 'POST' || endpoint.method === 'PUT') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1' }}>
                  Request JSON Body
                </label>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Editable payload</span>
              </div>
              <textarea
                rows={5}
                value={payloadInput}
                onChange={(e) => setPayloadInput(e.target.value)}
                placeholder='{ "key": "value" }'
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#38bdf8',
                  fontSize: '0.82rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Run Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleRunTest}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.4rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: isLoading ? '#64748b' : '#f97316',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              {isLoading ? (
                <>
                  <RefreshCw size={16} className="spin" />
                  <span>Executing HTTP Call...</span>
                </>
              ) : (
                <>
                  <Play size={16} fill="#ffffff" />
                  <span>Send Request</span>
                </>
              )}
            </button>
          </div>

          {/* Result Output Display */}
          {result && (
            <div
              style={{
                borderRadius: '10px',
                border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                overflow: 'hidden',
              }}
            >
              {/* Result Meta Bar */}
              <div
                style={{
                  padding: '0.65rem 1rem',
                  backgroundColor: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {result.success ? (
                    <CheckCircle2 size={18} color="#10b981" />
                  ) : (
                    <AlertTriangle size={18} color="#ef4444" />
                  )}
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      color: result.status_code >= 200 && result.status_code < 300 ? '#10b981' : '#ef4444',
                    }}
                  >
                    HTTP {result.status_code}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <Clock size={13} />
                    <span>{result.latency_ms.toFixed(1)} ms</span>
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#cbd5e1',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Response'}</span>
                </button>
              </div>

              {/* JSON Pre */}
              <pre
                style={{
                  padding: '1rem',
                  margin: 0,
                  fontSize: '0.78rem',
                  color: '#f1f5f9',
                  fontFamily: 'monospace',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  lineHeight: '1.4',
                }}
              >
                {JSON.stringify(result.response_body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
