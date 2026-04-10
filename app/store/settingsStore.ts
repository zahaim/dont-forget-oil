import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Unit = 'km' | 'miles';

interface SettingsStore {
  unit: Unit;
  defaultCurrency: string;
  carName: string;
  initialMileage: number;
  isSetupComplete: boolean;
  isLoaded: boolean;
  setUnit: (unit: Unit) => Promise<void>;
  setDefaultCurrency: (currency: string) => Promise<void>;
  completeSetup: (carName: string, initialMileage: number) => Promise<void>;
  loadSettings: () => Promise<void>;
  resetSetup: () => Promise<void>;
}

const SETTINGS_KEY = 'app_settings';

const defaultSettings = {
  unit: 'km' as Unit,
  defaultCurrency: 'EUR',
  carName: '',
  initialMileage: 0,
  isSetupComplete: false,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  unit: defaultSettings.unit,
  defaultCurrency: defaultSettings.defaultCurrency,
  carName: defaultSettings.carName,
  initialMileage: defaultSettings.initialMileage,
  isSetupComplete: defaultSettings.isSetupComplete,
  isLoaded: false,

  loadSettings: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const settings = JSON.parse(stored);
        set({
          unit: settings.unit || defaultSettings.unit,
          defaultCurrency: settings.defaultCurrency || defaultSettings.defaultCurrency,
          carName: settings.carName || defaultSettings.carName,
          initialMileage: settings.initialMileage || defaultSettings.initialMileage,
          isSetupComplete: settings.isSetupComplete || defaultSettings.isSetupComplete,
          isLoaded: true
        });
      } else {
        set({ isLoaded: true });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      set({ isLoaded: true });
    }
  },

  setUnit: async (unit) => {
    try {
      const current = get();
      const updated = {
        unit,
        defaultCurrency: current.defaultCurrency,
        carName: current.carName,
        initialMileage: current.initialMileage,
        isSetupComplete: current.isSetupComplete,
      };
      set({ unit });
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save unit:', error);
    }
  },

  setDefaultCurrency: async (currency) => {
    try {
      const current = get();
      const updated = {
        unit: current.unit,
        defaultCurrency: currency,
        carName: current.carName,
        initialMileage: current.initialMileage,
        isSetupComplete: current.isSetupComplete,
      };
      set({ defaultCurrency: currency });
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save default currency:', error);
    }
  },

  completeSetup: async (carName, initialMileage) => {
    try {
      const current = get();
      const updated = {
        unit: current.unit,
        defaultCurrency: current.defaultCurrency,
        carName,
        initialMileage,
        isSetupComplete: true,
      };
      set({
        carName,
        initialMileage,
        isSetupComplete: true,
      });
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save setup:', error);
      throw error;
    }
  },

  resetSetup: async () => {
    try {
      const current = get();
      const updated = {
        unit: current.unit,
        defaultCurrency: current.defaultCurrency,
        carName: '',
        initialMileage: 0,
        isSetupComplete: false,
      };
      set({
        carName: '',
        initialMileage: 0,
        isSetupComplete: false,
      });
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to reset setup:', error);
      throw error;
    }
  },
}));
