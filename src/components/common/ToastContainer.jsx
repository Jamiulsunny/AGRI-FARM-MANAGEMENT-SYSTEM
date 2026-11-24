import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const icons = {
    success: <CheckCircle size={18} color="#176B45" />,
    danger: <AlertCircle size={18} color="#D94B4B" />,
    warning: <AlertTriangle size={18} color="#E9A23B" />,
    info: <Info size={18} color="#3B82B8" />
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            minWidth: 300,
            maxWidth: 420,
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {icons[t.type] || icons.info}
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--main-text)' }}>{t.message}</span>
          </div>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-text)' }}>
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}