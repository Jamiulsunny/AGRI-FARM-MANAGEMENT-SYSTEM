import { validateAnimalRecord } from '../utils/validation';
import { storageService } from './storageService';

export const backupService = {
  createBackupData(records) {
    return {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      platform: 'Agri Farm by Sunny Enterprise',
      records
    };
  },

  validateAndImport(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Invalid JSON structure: could not parse file');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Malformed backup object');
    }

    if (!parsed.schemaVersion || !parsed.records || !Array.isArray(parsed.records)) {
      throw new Error('Unsupported schema: missing records or schema version');
    }

    const seenIds = new Set();
    const seenActiveTags = new Set();

    parsed.records.forEach((record, idx) => {
      if (typeof record.id !== 'number' || record.id <= 0) {
        throw new Error(`Record #${idx + 1} has an invalid ID`);
      }
      if (seenIds.has(record.id)) {
        throw new Error(`Duplicate ID detected: #${record.id}`);
      }
      seenIds.add(record.id);

      const val = validateAnimalRecord(record, []);
      if (!val.isValid) {
        throw new Error(`Record #${record.id} failed validation: ${JSON.stringify(val.errors)}`);
      }

      if (!record.isDeleted) {
        const lowerTag = record.tag.toLowerCase();
        if (seenActiveTags.has(lowerTag)) {
          throw new Error(`Duplicate active tag found in import: ${record.tag}`);
        }
        seenActiveTags.add(lowerTag);
      }
    });

    storageService.saveRecords(parsed.records);
    return parsed.records;
  }
};