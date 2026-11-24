import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import Badge from '../components/common/Badge';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export default function AnimalHealth() {
  const { animals } = useFarm();
  const [selectedFilter, setSelectedFilter] = useState('All');

  const active = animals.filter(a => !a.isDeleted);
  const filtered = selectedFilter === 'All'
    ? active
    : active.filter(a => a.healthStatus === selectedFilter);

  const counts = {
    Healthy: active.filter(a => a.healthStatus === 'Healthy').length,
    'Under Treatment': active.filter(a => a.healthStatus === 'Under Treatment').length,
    Sick: active.filter(a => a.healthStatus === 'Sick').length,
    Recovering: active.filter(a => a.healthStatus === 'Recovering').length
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Animal Health Management</h1>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
          Quarantine tracking, infection control and veterinary surveillance logging.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" onClick={() => setSelectedFilter('Healthy')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--primary-green)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Healthy</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{counts.Healthy}</div>
        </div>
        <div className="card" onClick={() => setSelectedFilter('Under Treatment')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Under Treatment</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{counts['Under Treatment']}</div>
        </div>
        <div className="card" onClick={() => setSelectedFilter('Sick')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Sick (Quarantine)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{counts.Sick}</div>
        </div>
        <div className="card" onClick={() => setSelectedFilter('Recovering')} style={{ cursor: 'pointer', borderLeft: '4px solid var(--info)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Recovering</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{counts.Recovering}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Active Health Registry: {selectedFilter}</h3>
          {selectedFilter !== 'All' && (
            <button className="btn btn-secondary" onClick={() => setSelectedFilter('All')}>
              Reset Filter
            </button>
          )}
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tag Number</th>
                <th>Classification</th>
                <th>Breed</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.tag}</td>
                    <td>{a.type}</td>
                    <td>{a.breed}</td>
                    <td><Badge status={a.healthStatus} /></td>
                    <td>
                      <Link to={`/animals/${a.id}`} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                        Ledger & History
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: 28, color: 'var(--secondary-text)' }}>
                    No livestock under this medical classification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}