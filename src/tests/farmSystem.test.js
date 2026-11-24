import { describe, it, expect, beforeEach } from 'vitest';
import { isValidDate, validateAnimalRecord } from '../src/utils/validation';
import { calculateFarmStatistics } from '../src/utils/statistics';
import { animalService } from '../src/services/animalService';
import { storageService } from '../src/services/storageService';
import { backupService } from '../src/services/backupService';
import { exportService } from '../src/services/exportService';

describe('Agri Farm Enterprise QA Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // --- Category 1: Validation Engine Tests ---
  describe('Calendar & Format Validation (isValidDate)', () => {
    it('approves standard leap years and ordinary calendar dates', () => {
      expect(isValidDate('2024-02-29')).toBe(true);
      expect(isValidDate('2023-01-31')).toBe(true);
      expect(isValidDate('2026-11-09')).toBe(true);
      expect(isValidDate('2000-02-29')).toBe(true);
    });

    it('rejects invalid leap year dates, impossible days, and malformed strings', () => {
      expect(isValidDate('2023-02-29')).toBe(false);
      expect(isValidDate('2024-04-31')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false);
      expect(isValidDate('1899-12-31')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate('random-string')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate('2024/02/29')).toBe(false);
    });
  });

  describe('Record Validation Engine (validateAnimalRecord)', () => {
    const sampleRecord = {
      tag: 'TAG-101',
      type: 'Cow',
      breed: 'Angus',
      gender: 'Female',
      birthDate: '2023-05-10',
      weight: 450,
      healthStatus: 'Healthy'
    };

    it('passes completely compliant records', () => {
      const res = validateAnimalRecord(sampleRecord, []);
      expect(res.isValid).toBe(true);
      expect(Object.keys(res.errors).length).toBe(0);
    });

    it('detects missing and empty required fields', () => {
      const emptyRec = { tag: ' ', type: '', breed: '', gender: 'Alien', birthDate: '', weight: -10, healthStatus: '' };
      const res = validateAnimalRecord(emptyRec, []);
      expect(res.isValid).toBe(false);
      expect(res.errors.tag).toBeDefined();
      expect(res.errors.type).toBeDefined();
      expect(res.errors.breed).toBeDefined();
      expect(res.errors.gender).toBeDefined();
      expect(res.errors.birthDate).toBeDefined();
      expect(res.errors.weight).toBeDefined();
      expect(res.errors.healthStatus).toBeDefined();
    });

    it('enforces string field length caps', () => {
      const longTag = { ...sampleRecord, tag: 'A'.repeat(51) };
      expect(validateAnimalRecord(longTag, []).isValid).toBe(false);

      const longType = { ...sampleRecord, type: 'A'.repeat(31) };
      expect(validateAnimalRecord(longType, []).isValid).toBe(false);

      const longBreed = { ...sampleRecord, breed: 'A'.repeat(41) };
      expect(validateAnimalRecord(longBreed, []).isValid).toBe(false);

      const longHealth = { ...sampleRecord, healthStatus: 'A'.repeat(31) };
      expect(validateAnimalRecord(longHealth, []).isValid).toBe(false);
    });

    it('enforces case-insensitive uniqueness on active tags', () => {
      const existing = [{ id: 1, tag: 'TAG-101' }];
      const duplicate = { ...sampleRecord, tag: 'tag-101' };
      const res = validateAnimalRecord(duplicate, existing);
      expect(res.isValid).toBe(false);
      expect(res.errors.tag).toBe('Tag must be unique across all records');
    });

    it('permits preserving identical tag when editing current ID', () => {
      const existing = [{ id: 1, tag: 'TAG-101' }];
      const editSelf = { ...sampleRecord, tag: 'TAG-101' };
      const res = validateAnimalRecord(editSelf, existing, 1);
      expect(res.isValid).toBe(true);
    });

    it('rejects invalid or non-positive weights', () => {
      expect(validateAnimalRecord({ ...sampleRecord, weight: 0 }, []).isValid).toBe(false);
      expect(validateAnimalRecord({ ...sampleRecord, weight: -5 }, []).isValid).toBe(false);
      expect(validateAnimalRecord({ ...sampleRecord, weight: NaN }, []).isValid).toBe(false);
      expect(validateAnimalRecord({ ...sampleRecord, weight: Infinity }, []).isValid).toBe(false);
    });
  });

  // --- Category 2: Animal Management & CRUD Operations ---
  describe('Animal Service Layer Operations', () => {
    it('creates records with sequential auto-incrementing IDs and timestamps', () => {
      const rec = animalService.create({
        tag: 'COW-1',
        type: 'Cow',
        breed: 'Holstein',
        gender: 'Female',
        birthDate: '2023-01-01',
        weight: 500,
        healthStatus: 'Healthy'
      });
      expect(rec.id).toBe(1);
      expect(rec.isDeleted).toBe(false);
      expect(rec.createdAt).toBeDefined();
      expect(rec.updatedAt).toBeDefined();
      expect(animalService.getAll().length).toBe(1);
    });

    it('fetches record by identifier', () => {
      const created = animalService.create({
        tag: 'COW-2',
        type: 'Cow',
        breed: 'Jersey',
        gender: 'Female',
        birthDate: '2023-01-01',
        weight: 420,
        healthStatus: 'Healthy'
      });
      const fetched = animalService.getById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched.tag).toBe('COW-2');
    });

    it('updates record while preserving immutable ID and unchanged properties', () => {
      const rec = animalService.create({
        tag: 'GOAT-1',
        type: 'Goat',
        breed: 'Boer',
        gender: 'Male',
        birthDate: '2024-01-01',
        weight: 50,
        healthStatus: 'Healthy'
      });
      const updated = animalService.update(rec.id, {
        tag: 'GOAT-1',
        type: 'Goat',
        breed: 'Boer',
        gender: 'Male',
        birthDate: '2024-01-01',
        weight: 58,
        healthStatus: 'Recovering'
      });
      expect(updated.id).toBe(rec.id);
      expect(updated.weight).toBe(58);
      expect(updated.healthStatus).toBe('Recovering');
    });

    it('performs soft delete without removing entry from storage', () => {
      const rec = animalService.create({
        tag: 'SHP-1',
        type: 'Sheep',
        breed: 'Dorper',
        gender: 'Female',
        birthDate: '2024-01-01',
        weight: 60,
        healthStatus: 'Healthy'
      });
      animalService.softDelete(rec.id);
      expect(animalService.getActive().length).toBe(0);
      expect(animalService.getDeleted().length).toBe(1);
      expect(animalService.getAll().length).toBe(1);
    });

    it('restores soft-deleted records when no tag conflicts exist', () => {
      const rec = animalService.create({
        tag: 'BUF-1',
        type: 'Buffalo',
        breed: 'Murrah',
        gender: 'Male',
        birthDate: '2023-01-01',
        weight: 650,
        healthStatus: 'Healthy'
      });
      animalService.softDelete(rec.id);
      expect(animalService.getActive().length).toBe(0);
      animalService.restore(rec.id);
      expect(animalService.getActive().length).toBe(1);
    });

    it('prevents restoring records if tag is taken by another active animal', () => {
      const first = animalService.create({
        tag: 'DUPL-1',
        type: 'Cow',
        breed: 'Jersey',
        gender: 'Female',
        birthDate: '2023-01-01',
        weight: 400,
        healthStatus: 'Healthy'
      });
      animalService.softDelete(first.id);

      animalService.create({
        tag: 'DUPL-1',
        type: 'Cow',
        breed: 'Angus',
        gender: 'Female',
        birthDate: '2023-01-01',
        weight: 410,
        healthStatus: 'Healthy'
      });

      expect(() => animalService.restore(first.id)).toThrow(/An active animal already uses tag/);
    });
  });

  // --- Category 3: Analytics & Math Consistency Tests ---
  describe('Farm Statistics Engine (calculateFarmStatistics)', () => {
    it('handles empty datasets safely without division by zero', () => {
      const stats = calculateFarmStatistics([]);
      expect(stats.totalActive).toBe(0);
      expect(stats.totalDeleted).toBe(0);
      expect(stats.avgWeight).toBe(0);
      expect(stats.totalWeight).toBe(0);
      expect(stats.minWeight).toBe(0);
      expect(stats.maxWeight).toBe(0);
    });

    it('computes exact mathematical aggregations across active populations', () => {
      const dataset = [
        { id: 1, type: 'Cow', gender: 'Female', healthStatus: 'Healthy', weight: 500, isDeleted: false },
        { id: 2, type: 'Cow', gender: 'Female', healthStatus: 'Sick', weight: 400, isDeleted: false },
        { id: 3, type: 'Goat', gender: 'Male', healthStatus: 'Healthy', weight: 100, isDeleted: false },
        { id: 4, type: 'Sheep', gender: 'Female', healthStatus: 'Healthy', weight: 800, isDeleted: true } // Soft deleted
      ];

      const stats = calculateFarmStatistics(dataset);
      expect(stats.totalActive).toBe(3);
      expect(stats.totalDeleted).toBe(1);
      expect(stats.healthyCount).toBe(2);
      expect(stats.attentionCount).toBe(1);
      expect(stats.totalWeight).toBe(1000); // 500 + 400 + 100
      expect(stats.avgWeight).toBe(333.33);
      expect(stats.minWeight).toBe(100);
      expect(stats.maxWeight).toBe(500);
      expect(stats.typeCounts['Cow']).toBe(2);
      expect(stats.typeCounts['Goat']).toBe(1);
      expect(stats.typeCounts['Sheep']).toBeUndefined(); // Excluded because deleted
    });
  });

  // --- Category 4: Storage, Snapshot & Backup System Tests ---
  describe('Storage & Backup Serialization', () => {
    it('persists and retrieves records from LocalStorage', () => {
      const dummy = [{ id: 1, tag: 'TEST-1' }];
      storageService.saveRecords(dummy);
      expect(storageService.loadRecords()).toEqual(dummy);
    });

    it('creates and restores backup snapshot upon corruption', () => {
      storageService.saveRecords([{ id: 1, tag: 'SNAP-1' }]);
      storageService.saveRecords([{ id: 1, tag: 'SNAP-2' }]);
      const restored = storageService.restoreLatestSnapshot();
      expect(restored[0].tag).toBe('SNAP-1');
    });

    it('validates and safely imports compliant JSON backup packages', () => {
      const validPayload = JSON.stringify({
        schemaVersion: '1.0.0',
        records: [
          {
            id: 1,
            tag: 'IMP-1',
            type: 'Cow',
            breed: 'Angus',
            gender: 'Female',
            birthDate: '2023-01-01',
            weight: 500,
            healthStatus: 'Healthy',
            isDeleted: false
          }
        ]
      });

      const imported = backupService.validateAndImport(validPayload);
      expect(imported.length).toBe(1);
      expect(storageService.loadRecords().length).toBe(1);
    });

    it('rejects corrupted or malformed import packages', () => {
      expect(() => backupService.validateAndImport('{ corrupt json')).toThrow(/could not parse/);
      expect(() => backupService.validateAndImport('{}')).toThrow(/Unsupported schema/);
      expect(() => backupService.validateAndImport(JSON.stringify({ schemaVersion: '1.0', records: [{ id: -1 }] }))).toThrow(/invalid ID/);
    });
  });

  // --- Category 5: Exporting & Formula Injection Prevention ---
  describe('Export Service Security & Formatting', () => {
    it('neutralizes spreadsheet formula injection characters', () => {
      const malicious = [
        {
          id: 1,
          tag: '=SUM(A1:A10)',
          type: '+cmd|',
          breed: '-1+1',
          gender: 'Male',
          birthDate: '2023-01-01',
          weight: 100,
          healthStatus: '@dangerous',
          createdAt: '2026-01-01'
        }
      ];

      const csv = exportService.toCSV(malicious);
      expect(csv).toContain("\"'=SUM(A1:A10)\"");
      expect(csv).toContain("\"'+cmd|\"");
      expect(csv).toContain("\"'-1+1\"");
      expect(csv).toContain("\"'@dangerous\"");
    });
  });
});