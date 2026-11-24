import React from 'react';

export default function StatCard({ title, value, unit = '', subtitle, icon: Icon, color = 'var(--primary-green)' }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 500, marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--main-text)', lineHeight: 1.1 }}>
          {value} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--secondary-text)' }}>{unit}</span>
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginTop: 6 }}>
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'var(--light-green-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color
        }}
      >
        <Icon size={22} />
      </div>
    </div>
  );
}