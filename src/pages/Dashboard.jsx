import React from 'react';
import { useFarm } from '../context/FarmContext';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import { PawPrint, HeartPulse, AlertCircle, Scale, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#176B45', '#35A86B', '#3B82B8', '#E9A23B', '#D94B4B', '#9CA3AF'];

export default function Dashboard() {
  const { animals, stats, isLoading } = useFarm();
  const activeAnimals = animals.filter(a => !a.isDeleted);
  const recentRecords = [...activeAnimals].reverse().slice(0, 5);

  const typeData = Object.entries(stats.typeCounts).map(([name, value]) => ({ name, value }));
  const healthData = Object.entries(stats.healthCounts).map(([name, value]) => ({ name, value }));

  if (isLoading) return <div>Loading Farm Intelligence Console...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Farm Health & Productivity Overview</h1>
          <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
            Telemetry and livestock performance metrics across all active paddocks.
          </p>
        </div>
        <Link to="/add-animal" className="btn btn-primary">
          <Plus size={16} /> Register Animal
        </Link>
      </div>

      <div className="grid-stats">
        <StatCard title="Total Active Animals" value={stats.totalActive} icon={PawPrint} />
        <StatCard title="Healthy Animals" value={stats.healthyCount} icon={HeartPulse} color="var(--primary-green)" />
        <StatCard title="Attention Required" value={stats.attentionCount} icon={AlertCircle} color="var(--danger)" />
        <StatCard title="Herd Biomass" value={stats.totalWeight} unit="kg" subtitle={`Avg: ${stats.avgWeight} kg`} icon={Scale} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, marginBottom: 28 }}>
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Herd Composition by Type</h3>
          {typeData.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                    {typeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--secondary-text)' }}>No livestock data</div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 16 }}>Health Distribution</h3>
          {healthData.length > 0 ? (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={healthData}>
                  <XAxis dataKey="name" fontSize={12} stroke="#718078" />
                  <YAxis fontSize={12} stroke="#718078" />
                  <Tooltip />
                  <Bar dataKey="value" fill="var(--primary-green)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--secondary-text)' }}>No livestock data</div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Recently Registered Livestock</h3>
          <Link to="/animals" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--primary-green)', textDecoration: 'none', fontWeight: 500 }}>
            View Full Inventory <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tag</th>
                <th>Type</th>
                <th>Breed</th>
                <th>Gender</th>
                <th>Weight</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRecords.length > 0 ? (
                recentRecords.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link to={`/animals/${a.id}`} style={{ color: 'var(--primary-green)', textDecoration: 'none' }}>
                        {a.tag}
                      </Link>
                    </td>
                    <td>{a.type}</td>
                    <td>{a.breed}</td>
                    <td>{a.gender}</td>
                    <td>{a.weight} kg</td>
                    <td><Badge status={a.healthStatus} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--secondary-text)' }}>
                    No recent animals recorded.
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