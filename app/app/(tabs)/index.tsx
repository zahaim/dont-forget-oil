import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useFuelStore } from '@/store/fuelStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCallback } from 'react';

interface Stats {
  fuelConsumed: string;
  distanceTraveled: string;
  fuelPer100km: string;
  costPerLiter: string | number;
  currencySymbol: string;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const entries = useFuelStore((state) => state.entries);
  const isEntriesLoaded = useFuelStore((state) => state.isLoaded);
  const loadEntries = useFuelStore((state) => state.loadEntries);
  const unit = useSettingsStore((state) => state.unit);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const isSetupComplete = useSettingsStore((state) => state.isSetupComplete);
  const carName = useSettingsStore((state) => state.carName);
  const initialMileage = useSettingsStore((state) => state.initialMileage);
  const [stats, setStats] = useState<Stats | null>(null);
  const [setupLoaded, setSetupLoaded] = useState(false);

  const getUnitLabel = () => unit === 'km' ? 'km' : 'mi';

  const parseDate = (dateStr: string): Date => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date(0);
    }
    return date;
  };

  const CURRENCY_SYMBOLS: Record<string, string> = {
    EUR: '€',
    USD: '$',
    GBP: '£',
    CAD: 'C$',
    BGN: 'лв',
    CZK: 'Kč',
    DKK: 'kr',
    HUF: 'Ft',
    PLN: 'zł',
    RON: 'lei',
    SEK: 'kr',
    CHF: 'CHF',
    NOK: 'kr',
  };

  const getCurrencySymbol = (currencyCode: string) => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  };

  const getLastEntryStats = () => {
    if (entries.length < 2) return null;

    // Sort entries by date descending
    const sorted = [...entries].sort(
      (a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime()
    );

    const lastEntry = sorted[0];
    const previousEntry = sorted[1];

    const distance = lastEntry.mileage - previousEntry.mileage;
    if (distance <= 0) return null;

    const efficiency = ((lastEntry.fuelAmount / distance) * 100).toFixed(2);
    const costPerLiter = (lastEntry.cost / lastEntry.fuelAmount).toFixed(2);

    return {
      efficiency,
      costPerLiter,
      currency: lastEntry.currency,
    };
  };

  const calculateStats = () => {
    if (!entries || entries.length === 0) {
      return null;
    }

    // Filter for last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = entries.filter((entry) => parseDate(entry.date) >= thirtyDaysAgo);

    if (last30Days.length === 0) {
      return null;
    }

    const totalFuelPurchased = last30Days.reduce((sum, e) => sum + e.fuelAmount, 0);

    // Find the highest and lowest mileage in this period
    const maxMileage = Math.max(...last30Days.map(e => e.mileage));
    const minMileage = Math.min(...last30Days.map(e => e.mileage));

    // Distance in this 30-day period
    const totalDistance = maxMileage - minMileage;

    // Average fuel efficiency
    const avgFuelPer100km =
      totalDistance > 0 ? ((totalFuelPurchased / totalDistance) * 100).toFixed(2) : "0.00";

    // Find currency with most spending
    const currencySpending: Record<string, { cost: number; fuel: number }> = {};
    last30Days.forEach((e) => {
      if (!currencySpending[e.currency]) {
        currencySpending[e.currency] = { cost: 0, fuel: 0 };
      }
      currencySpending[e.currency].cost += e.cost;
      currencySpending[e.currency].fuel += e.fuelAmount;
    });

    const mostSpentCurrency = Object.keys(currencySpending).reduce((a, b) =>
      currencySpending[a].cost > currencySpending[b].cost ? a : b
    );

    const costPerLiter = currencySpending[mostSpentCurrency].fuel > 0
      ? (currencySpending[mostSpentCurrency].cost / currencySpending[mostSpentCurrency].fuel).toFixed(2)
      : 0;

    return {
      fuelConsumed: totalFuelPurchased.toFixed(2),
      distanceTraveled: totalDistance.toFixed(0),
      fuelPer100km: avgFuelPer100km,
      costPerLiter,
      currencySymbol: getCurrencySymbol(mostSpentCurrency),
    };
  };

  // Load data on mount
  useEffect(() => {
    const loadAndCalculate = async () => {
      try {
        await Promise.all([loadEntries(), loadSettings()]);
        const state = useSettingsStore.getState();
        if (!state.isSetupComplete) {
          router.replace('/setup');
        } else {
          setSetupLoaded(true);
        }
      } catch (err) {
        console.error('Load error:', err);
        setSetupLoaded(true);
      }
    };
    loadAndCalculate();
  }, [loadEntries, loadSettings]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  // Recalculate stats whenever entries or initialMileage change
  useEffect(() => {
    if (setupLoaded && isEntriesLoaded && entries.length > 0) {
      setStats(calculateStats());
    }
  }, [entries, initialMileage, setupLoaded, isEntriesLoaded]);

  if (!setupLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#aaa' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.title}>don't-forget-oil</Text>
          {carName && <Text style={styles.carName}>{carName}</Text>}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No entries yet</Text>
          <Text style={styles.emptyStateSubtext}>Start logging fuel to see statistics</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsPreview}>
            <Text style={styles.statsTitle}>Last 30 days stats:</Text>
            {stats && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.distanceTraveled}</Text>
                  <Text style={styles.statLabel}>Distance Traveled ({getUnitLabel()})</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.fuelConsumed}</Text>
                  <Text style={styles.statLabel}>Fuel Consumed (litres)</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.fuelPer100km}</Text>
                  <Text style={styles.statLabel}>Efficiency (l/100{getUnitLabel()})</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.costPerLiter}</Text>
                  <Text style={styles.statLabel}>Cost per liter ({stats.currencySymbol})</Text>
                </View>
              </View>
            )}
          </View>

          {(() => {
            const lastStats = getLastEntryStats();
            return lastStats && (
              <View style={styles.lastEntryBox}>
                <Text style={styles.lastEntryLabel}>Last time:</Text>
                <View style={styles.lastEntryContent}>
                  <View style={styles.lastEntryStat}>
                    <Text style={styles.lastEntryValue}>{lastStats.efficiency}</Text>
                    <Text style={styles.lastEntryStatLabel}>Efficiency (l/100{getUnitLabel()})</Text>
                  </View>
                  <View style={styles.lastEntryStat}>
                    <Text style={styles.lastEntryValue}>{lastStats.costPerLiter}</Text>
                    <Text style={styles.lastEntryStatLabel}>Cost per liter ({getCurrencySymbol(lastStats.currency)})</Text>
                  </View>
                </View>
              </View>
            );
          })()}
        </>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/log-fuel')}
        >
          <Text style={styles.buttonText}>📸 Log Fuel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.buttonText}>📊 View History</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  carName: {
    fontSize: 14,
    color: '#4fb3ff',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#666',
  },
  statsPreview: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fb3ff',
  },
  statLabel: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  lastEntryBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
    marginBottom: 30,
  },
  lastEntryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  lastEntryContent: {
    flexDirection: 'row',
    gap: 15,
  },
  lastEntryStat: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  lastEntryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fb3ff',
    marginBottom: 4,
  },
  lastEntryStatLabel: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
  },
});
