const STORAGE_KEY = 'agri_farm_v1_records';
const BACKUP_KEY = 'agri_farm_v1_snapshot';

export const storageService = {
  loadRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to parse localStorage data:', err);
      return [];
    }
  },

  saveRecords(records) {
    if (!Array.isArray(records)) {
      throw new Error('Records must be an array');
    }
    try {
      // Create rollback snapshot
      const current = localStorage.getItem(STORAGE_KEY);
      if (current) {
        localStorage.setItem(BACKUP_KEY, current);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return true;
    } catch (err) {
      console.error('Storage quota exceeded or storage failure:', err);
      throw new Error('Storage write failed. Quota may be exceeded.');
    }
  },

  restoreLatestSnapshot() {
    const backup = localStorage.getItem(BACKUP_KEY);
    if (!backup) throw new Error('No previous snapshot found');
    localStorage.setItem(STORAGE_KEY, backup);
    return JSON.parse(backup);
  }
};