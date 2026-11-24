import React from 'react';
import { useFarm } from '../context/FarmContext';
import { exportService } from '../services/exportService';
import { Download } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Reports() {
  const { animals, stats } = useFarm();
  const active = animals.filter(a => !a.isDeleted);

  const genderData = Object.entries(stats.genderCounts).map(([name, value]) => ({ name, value }));
  const typeData = Object.entries(stats.typeCounts).map(([name, value]) => ({ name, value }));

  const exportCSV = () => {
    const csv = exportService.toCSV(active);
    exportService.downloadFile(csv, `agri_farm_analytics_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Reports & Livestock Analytics</h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
            Aggregated metrics for production planning and veterinary reporting.
          </p>
        </div>
        <button className="btn btn-primary" onClick={exportCSV}>
          <Download size={16} /> Download Full Dataset (CSV)
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Herdsman Statistical Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div style={{ padding: 12, background: 'var(--main-bg)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Active Population</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{stats.totalActive}</div>
          </div>
          <div style={{ padding: 12, background: 'var(--main-bg)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Archived / Inactive</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{stats.totalDeleted}</div>
          </div>
          <div style={{ padding: 12, background: 'var(--main-bg)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Total Biomass</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{stats.totalWeight} kg</div>
          </div>
          <div style={{ padding: 12, background: 'var(--main-bg)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Average Animal Weight</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{stats.avgWeight} kg</div>
          </div>
          <div style={{ padding: 12, background: 'var(--main-bg)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Weight Extremes</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{stats.minWeight} - {stats.maxWeight} kg</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Gender Demographics</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  <Cell fill="#176B45" />
                  <Cell fill="#3B82B8" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Livestock Headcount by Class</h3>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={typeData}>
                <XAxis dataKey="name" fontSize={12} stroke="#718078" />
                <YAxis fontSize={12} stroke="#718078" />
                <Tooltip />
                <Bar dataKey="value" fill="#35A86B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}