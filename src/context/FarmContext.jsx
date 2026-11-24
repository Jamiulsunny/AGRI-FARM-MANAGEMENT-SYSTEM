import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { animalService } from '../services/animalService';
import { calculateFarmStatistics } from '../utils/statistics';
import { useToast } from './ToastContext';

const FarmContext = createContext(null);

export function FarmProvider({ children }) {
  const [animals, setAnimals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const reloadData = useCallback(() => {
    try {
      const records = animalService.getAll();
      setAnimals(records);
    } catch (err) {
      showToast('Failed to load records from storage', 'danger');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // Seed standard demo data if store is empty on first execution
    const existing = animalService.getAll();
    if (existing.length === 0) {
      const initialSeed = [
        {
          id: 1,
          tag: 'COW-001',
          type: 'Cow',
          breed: 'Holstein Friesian',
          gender: 'Female',
          birthDate: '2023-04-12',
          weight: 540,
          healthStatus: 'Healthy',
          isDeleted: false,
          createdAt: new Date('2023-04-15').toISOString(),
          updatedAt: new Date('2026-08-10').toISOString(),
          healthLogs: [{ date: '2023-04-15', status: 'Healthy', note: 'Calf registered healthy' }]
        },
        {
          id: 2,
          tag: 'COW-002',
          type: 'Cow',
          breed: 'Jersey',
          gender: 'Female',
          birthDate: '2024-01-20',
          weight: 420,
          healthStatus: 'Under Treatment',
          isDeleted: false,
          createdAt: new Date('2024-01-25').toISOString(),
          updatedAt: new Date('2026-10-02').toISOString(),
          healthLogs: [{ date: '2026-10-02', status: 'Under Treatment', note: 'Mastitis treatment round 1' }]
        },
        {
          id: 3,
          tag: 'GT-104',
          type: 'Goat',
          breed: 'Boer',
          gender: 'Male',
          birthDate: '2025-02-14',
          weight: 78,
          healthStatus: 'Healthy',
          isDeleted: false,
          createdAt: new Date('2025-02-18').toISOString(),
          updatedAt: new Date('2026-09-01').toISOString(),
          healthLogs: [{ date: '2025-02-18', status: 'Healthy', note: 'Routine physical verified' }]
        },
        {
          id: 4,
          tag: 'SHP-089',
          type: 'Sheep',
          breed: 'Dorper',
          gender: 'Female',
          birthDate: '2024-11-05',
          weight: 62,
          healthStatus: 'Sick',
          isDeleted: false,
          createdAt: new Date('2024-11-10').toISOString(),
          updatedAt: new Date('2026-11-01').toISOString(),
          healthLogs: [{ date: '2026-11-01', status: 'Sick', note: 'Hoof infection under observation' }]
        }
      ];
      import('../services/storageService').then(m => {
        m.storageService.saveRecords(initialSeed);
        setAnimals(initialSeed);
        setIsLoading(false);
      });
    } else {
      reloadData();
    }
  }, [reloadData]);

  const stats = calculateFarmStatistics(animals);

  return (
    <FarmContext.Provider
      value={{
        animals,
        stats,
        isLoading,
        reloadData
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const ctx = useContext(FarmContext);
  if (!ctx) throw new Error('useFarm must be used within FarmProvider');
  return ctx;
}