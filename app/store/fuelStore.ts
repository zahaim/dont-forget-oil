import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FuelEntry {
  id?: string;
  date: string;
  mileage: number;
  fuelAmount: number;
  cost: number;
  currency: string;
}

interface FuelStore {
  entries: FuelEntry[];
  isLoaded: boolean;
  addFuel: (entry: Omit<FuelEntry, 'id'>) => Promise<void>;
  deleteFuel: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getAllEntries: () => FuelEntry[];
  loadEntries: () => Promise<void>;
  addSampleData: () => Promise<void>;
}

const STORAGE_KEY = 'fuel_entries';

export const useFuelStore = create<FuelStore>((set, get) => ({
  entries: [],
  isLoaded: false,

  loadEntries: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ entries: JSON.parse(stored), isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to load entries:', error);
      set({ isLoaded: true });
    }
  },

  addFuel: async (entry) => {
    try {
      const newEntry = {
        ...entry,
        id: Date.now().toString(),
      };
      const updatedEntries = [...get().entries, newEntry];
      set({ entries: updatedEntries });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  },

  deleteFuel: async (id) => {
    try {
      const updatedEntries = get().entries.filter((entry) => entry.id !== id);
      set({ entries: updatedEntries });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  },

  clearAll: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);

      // Also clear localStorage directly (for web)
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('@react-native-async-storage/async-storage:' + STORAGE_KEY);
      }

      set({ entries: [] });
    } catch (error) {
      console.error('Failed to clear all entries:', error);
      throw error;
    }
  },

  getAllEntries: () => get().entries,

  addSampleData: async () => {
    try {
      const sampleData: Omit<FuelEntry, 'id'>[] = [
        {
          date: '2026-01-10T08:30:00',
          mileage: 50500,
          fuelAmount: 45,
          cost: 72,
          currency: 'EUR',
        },
        {
          date: '2026-01-25T10:15:00',
          mileage: 51000,
          fuelAmount: 38,
          cost: 61,
          currency: 'EUR',
        },
        {
          date: '2026-03-05T09:00:00',
          mileage: 51800,
          fuelAmount: 42,
          cost: 68,
          currency: 'EUR',
        },
        {
          date: '2026-03-20T14:20:00',
          mileage: 52300,
          fuelAmount: 35,
          cost: 56,
          currency: 'EUR',
        },
        {
          date: '2026-04-02T11:45:00',
          mileage: 52800,
          fuelAmount: 40,
          cost: 64,
          currency: 'EUR',
        },
        {
          date: '2026-04-08T16:30:00',
          mileage: 53200,
          fuelAmount: 32,
          cost: 51,
          currency: 'EUR',
        },
      ];

      const entriesWithIds = sampleData.map((entry, index) => ({
        ...entry,
        id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      set({ entries: entriesWithIds });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entriesWithIds));
    } catch (error) {
      console.error('Failed to add sample data:', error);
    }
  },
}));
