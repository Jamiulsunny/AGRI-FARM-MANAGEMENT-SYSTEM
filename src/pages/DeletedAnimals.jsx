import React, { useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { animalService } from '../services/animalService';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/common/ConfirmModal';
import Badge from '../components/common/Badge';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function DeletedAnimals() {
  const { animals, reloadData } = useFarm();
  const { showToast } = useToast();
  const [restoreModal, setRestoreModal] = useState({ isOpen: false, animal: null });

  const deleted = animals.filter(a => a.isDeleted);

  const handleRestore = () => {
    try {
      animalService.restore(restoreModal.animal.id);
      showToast(`Record ${restoreModal.animal.tag} restored successfully`, 'success');
      reloadData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setRestoreModal({ isOpen: false, animal: null });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Archived & Deleted Records</h1>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
          Historical records moved to soft-delete state. Invariant IDs prevent collision upon reactivation.
        </p>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Historical ID</th>
                <th>Tag Number</th>
                <th>Type</th>
                <th>Breed</th>
                <th>Recorded Weight</th>
                <th>Last Status</th>
                <th>Restore</th>
              </tr>
            </thead>
            <tbody>
              {deleted.length > 0 ? (
                deleted.map(a => (
                  <tr key={a.id}>
                    <td>#{a.id}</td>
                    <td style={{ fontWeight: 600 }}>{a.tag}</td>
                    <td>{a.type}</td>
                    <td>{a.breed}</td>
                    <td>{a.weight} kg</td>
                    <td><Badge status={a.healthStatus} /></td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={() => setRestoreModal({ isOpen: true, animal: a })}
                      >
                        <RotateCcw size={14} /> Reactivate
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 36, color: 'var(--secondary-text)' }}>
                    Recycle store empty. No records currently archived.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={restoreModal.isOpen}
        title="Reactivate Livestock Record"
        message={`Restore record ${restoreModal.animal?.tag} (#${restoreModal.animal?.id}) back to the active herd?`}
        confirmText="Reactivate"
        confirmVariant="primary"
        onConfirm={handleRestore}
        onCancel={() => setRestoreModal({ isOpen: false, animal: null })}
      />
    </div>
  );
}