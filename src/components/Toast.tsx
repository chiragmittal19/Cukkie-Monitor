import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      maxWidth: '400px',
    }}>
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';

        const bgColor = isSuccess
          ? 'rgba(16, 185, 129, 0.95)'
          : isError
          ? 'rgba(244, 63, 94, 0.95)'
          : 'rgba(6, 182, 212, 0.95)';

        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

        return (
          <div
            key={t.id}
            style={{
              background: bgColor,
              color: '#ffffff',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <Icon size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{t.message}</span>
            <button
              onClick={() => onDismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                opacity: 0.8,
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
