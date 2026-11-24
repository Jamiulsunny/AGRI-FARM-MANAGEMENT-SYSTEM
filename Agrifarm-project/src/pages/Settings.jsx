import React, { useRef } from 'react';
import { useFarm } from '../context/FarmContext';
import { useToast } from '../context/ToastContext';
import { backupService } from '../services/backupService';
import { exportService } from '../services/exportService';
import { Download, Upload, ShieldCheck, Database } from 'lucide-react';

export default function Settings() {
  const { animals, reloadData } = useFarm();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const handleExportJSON = () => {
    const backup = backupService.createBackupData(animals);
    const content = JSON.stringify(backup, null, 2);
    exportService.downloadFile(content, `agri_farm_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    showToast('Exported complete data backup (JSON)', 'success');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        backupService.validateAndImport(event.target.result);
        showToast('Backup restored successfully', 'success');
        reloadData();
      } catch (err) {
        showToast(err.message, 'danger');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700 }}>Farm Configuration & Data Resilience</h1>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
          LocalStorage state management, backup snapshot persistence, and disaster recovery.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Database size={18} color="var(--primary-green)" /> Local Storage Persistence Engine
        </h3>
        <p style={{ color: 'var(--secondary-text)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 16 }}>
          Data is written synchronously to Web Storage (LocalStorage) under key <code>agri_farm_v1_records</code> with an automatic rollback shadow copy.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={handleExportJSON}>
            <Download size={16} /> Export JSON Backup
          </button>
          <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>
            <Upload size={16} /> Restore from JSON Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json,application/json"
            onChange={handleImportJSON}
          />
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <ShieldCheck size={18} color="var(--primary-green)" /> Architectural Verification & Guarantees
        </h3>
        <ul style={{ paddingLeft: 20, color: 'var(--secondary-text)', fontSize: '0.85rem', lineHeight: 1.8 }}>
          <li>Strict type checks reject negative weights and invalid dates.</li>
          <li>Case-insensitive uniqueness constraints enforced across active ear-tags.</li>
          <li>Formula injection defense in place on CSV generation pipelines.</li>
          <li>Soft-delete design preserves historical audit trails.</li>
        </ul>
      </div>
    </div>
  );
}