import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { animalService } from '../services/animalService';
import { calculateAge, formatDisplayDate } from '../utils/dateUtils';
import Badge from '../components/common/Badge';
import ConfirmModal from '../components/common/ConfirmModal';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Edit2, Trash2, Calendar, Scale, Activity, FileText } from 'lucide-react';

export default function AnimalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reloadData } = useFarm();
  const { showToast } = useToast();
  const [deleteModal, setDeleteModal] = useState(false);

  const animal = animalService.getById(id);

  if (!animal) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <h2>Record Not Found</h2>
        <p style={{ color: 'var(--secondary-text)', margin: '12px 0 20px' }}>No animal identified with token #{id}</p>
        <button onClick={() => navigate('/animals')} className="btn btn-primary">Return to Roster</button>
      </div>
    );
  }

  const handleDelete = () => {
    try {
      animalService.softDelete(animal.id);
      showToast(`Animal ${animal.tag} moved to Deleted Items`, 'success');
      reloadData();
      navigate('/animals');
    } catch {
      showToast('Deletion failed', 'danger');
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button onClick={() => navigate('/animals')} className="btn btn-secondary">
          <ArrowLeft size={16} /> Directory
        </button>
        {!animal.isDeleted && (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to={`/edit-animal/${animal.id}`} className="btn btn-secondary">
              <Edit2 size={16} /> Edit Data
            </Link>
            <button onClick={() => setDeleteModal(true)} className="btn btn-danger">
              <Trash2 size={16} /> Soft Delete
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: 18, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', fontWeight: 600 }}>SYSTEM IDENTIFIER #{animal.id}</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '4px 0' }}>{animal.tag}</h1>
            <div style={{ color: 'var(--secondary-text)' }}>{animal.breed} ({animal.type})</div>
          </div>
          <Badge status={animal.healthStatus} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Biological Gender</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{animal.gender}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Chronological Age</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{calculateAge(animal.birthDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Birth Date</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{formatDisplayDate(animal.birthDate)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Current Weight</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>{animal.weight} kg</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Registration Timestamp</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDisplayDate(animal.createdAt)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Last Audit Verification</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDisplayDate(animal.updatedAt)}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16 }}>Clinical & Observation Ledger</h3>
        {animal.healthLogs && animal.healthLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {animal.healthLogs.map((log, index) => (
              <div key={index} style={{ padding: '12px 16px', background: 'var(--main-bg)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{log.note}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Logged: {formatDisplayDate(log.date)}</div>
                </div>
                <Badge status={log.status} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--secondary-text)' }}>No historical health events logged.</div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal}
        title="Confirm Soft Delete"
        message={`Confirm moving record ${animal.tag} to the recycle ledger?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal(false)}
      />
    </div>
  );
}