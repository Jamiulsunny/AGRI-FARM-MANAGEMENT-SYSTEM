import { storageService } from './storageService';
import { validateAnimalRecord } from '../utils/validation';

export const animalService = {
  getAll() {
    return storageService.loadRecords();
  },

  getActive() {
    return this.getAll().filter(a => !a.isDeleted);
  },

  getDeleted() {
    return this.getAll().filter(a => a.isDeleted);
  },

  getById(id) {
    const numericId = Number(id);
    return this.getAll().find(a => a.id === numericId) || null;
  },

  getNextId() {
    const all = this.getAll();
    if (all.length === 0) return 1;
    const maxId = Math.max(...all.map(a => a.id || 0));
    return maxId + 1;
  },

  create(recordData) {
    const all = this.getAll();
    const validation = validateAnimalRecord(recordData, all);
    if (!validation.isValid) {
      throw { validationErrors: validation.errors };
    }

    const newRecord = {
      ...recordData,
      id: this.getNextId(),
      tag: recordData.tag.trim(),
      type: recordData.type.trim(),
      breed: recordData.breed.trim(),
      weight: Number(recordData.weight),
      healthStatus: recordData.healthStatus.trim(),
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      healthLogs: [
        {
          date: new Date().toISOString(),
          status: recordData.healthStatus.trim(),
          note: 'Initial health status recorded'
        }
      ]
    };

    const updated = [...all, newRecord];
    storageService.saveRecords(updated);
    return newRecord;
  },

  update(id, recordData) {
    const numericId = Number(id);
    const all = this.getAll();
    const existingIndex = all.findIndex(a => a.id === numericId);

    if (existingIndex === -1) {
      throw new Error(`Animal record #${id} not found`);
    }

    const existingRecord = all[existingIndex];
    const validation = validateAnimalRecord(recordData, all, numericId);
    if (!validation.isValid) {
      throw { validationErrors: validation.errors };
    }

    const updatedRecord = {
      ...existingRecord,
      ...recordData,
      id: numericId, // Ensure ID is immutable
      weight: Number(recordData.weight),
      updatedAt: new Date().toISOString()
    };

    if (recordData.healthStatus && recordData.healthStatus !== existingRecord.healthStatus) {
      updatedRecord.healthLogs = [
        ...(existingRecord.healthLogs || []),
        {
          date: new Date().toISOString(),
          status: recordData.healthStatus.trim(),
          note: recordData.healthNote || 'Status updated via editor'
        }
      ];
    }

    all[existingIndex] = updatedRecord;
    storageService.saveRecords(all);
    return updatedRecord;
  },

  softDelete(id) {
    const numericId = Number(id);
    const all = this.getAll();
    const index = all.findIndex(a => a.id === numericId);
    if (index === -1) throw new Error('Record not found');

    all[index].isDeleted = true;
    all[index].updatedAt = new Date().toISOString();
    storageService.saveRecords(all);
    return true;
  },

  restore(id) {
    const numericId = Number(id);
    const all = this.getAll();
    const target = all.find(a => a.id === numericId);
    if (!target) throw new Error('Record not found');

    // Tag conflict check with currently active records
    const hasTagConflict = all.some(
      a => !a.isDeleted && a.id !== numericId && a.tag.toLowerCase() === target.tag.toLowerCase()
    );
    if (hasTagConflict) {
      throw new Error(`Cannot restore: An active animal already uses tag "${target.tag}"`);
    }

    target.isDeleted = false;
    target.updatedAt = new Date().toISOString();
    storageService.saveRecords(all);
    return true;
  }
};