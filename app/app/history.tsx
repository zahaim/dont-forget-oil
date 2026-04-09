import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useFuelStore } from '@/store/fuelStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useCallback, useState, useEffect } from 'react';

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

type TimePeriod = 'all' | 'thisMonth' | 'lastMonth' | 'last30Days' | 'thisYear';

export default function HistoryScreen() {
  const entries = useFuelStore((state) => state.entries);
  const deleteFuel = useFuelStore((state) => state.deleteFuel);
  const loadEntries = useFuelStore((state) => state.loadEntries);
  const unit = useSettingsStore((state) => state.unit);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const initialMileage = useSettingsStore((state) => state.initialMileage);
  const [refreshKey, setRefreshKey] = useState(0);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  const getCurrencySymbol = (currencyCode: string) => {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  };

  const getUnitLabel = () => unit === 'km' ? 'km' : 'mi';

  const getFilteredEntries = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return entries.filter((entry) => {
      const entryDate = new Date(entry.date);

      switch (timePeriod) {
        case 'thisMonth':
          return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
        case 'lastMonth':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return entryDate.getMonth() === lastMonth && entryDate.getFullYear() === lastMonthYear;
        case 'last30Days':
          return entryDate >= thirtyDaysAgo;
        case 'thisYear':
          return entryDate.getFullYear() === currentYear;
        case 'all':
        default:
          return true;
      }
    });
  };

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'last30Days':
        return 'Last 30 Days';
      case 'thisYear':
        return 'This Year';
      case 'all':
      default:
        return 'All Time';
    }
  };

  const getEfficiencyForEntry = (entry: any) => {
    // Find the previous entry (next in sorted array, since sorted descending by date)
    const sortedAll = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const currentIndex = sortedAll.findIndex((e) => e.id === entry.id);

    if (currentIndex === -1) return null;

    let previousMileage: number;

    if (currentIndex === sortedAll.length - 1) {
      // This is the oldest entry, use initial mileage
      previousMileage = initialMileage;
    } else {
      // Use the previous entry's mileage
      previousMileage = sortedAll[currentIndex + 1].mileage;
    }

    const distance = entry.mileage - previousMileage;

    if (distance <= 0) return null;

    return ((entry.fuelAmount / distance) * 100).toFixed(2);
  };

  // Load data on mount
  useEffect(() => {
    loadEntries();
    loadSettings();
  }, [loadEntries, loadSettings]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadEntries();
      setRefreshKey((prev) => prev + 1);
    }, [loadEntries])
  );

  const calculateStats = () => {
    const filteredEntries = getFilteredEntries();

    if (!filteredEntries || filteredEntries.length === 0) return null;

    const sorted = [...filteredEntries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Total fuel purchased
    const totalFuelPurchased = filteredEntries.reduce((sum, e) => sum + e.fuelAmount, 0);

    // Calculate distance within this period
    let totalDistance = 0;
    if (sorted.length > 0) {
      totalDistance = sorted[sorted.length - 1].mileage - sorted[0].mileage;
    }

    // Calculate costs by currency
    const costByCurrency: Record<string, number> = {};
    filteredEntries.forEach((e) => {
      if (!costByCurrency[e.currency]) {
        costByCurrency[e.currency] = 0;
      }
      costByCurrency[e.currency] += e.cost;
    });

    return {
      totalDistance: totalDistance.toFixed(0),
      totalFuel: totalFuelPurchased.toFixed(2),
      fuelPer100km: totalDistance > 0 ? ((totalFuelPurchased / totalDistance) * 100).toFixed(2) : 0,
      costByCurrency,
    };
  };

  const stats = calculateStats();
  const filteredEntries = getFilteredEntries();
  const sortedFilteredEntries = [...filteredEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <ScrollView style={styles.container} key={refreshKey}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Fuel History</Text>
      </View>

      <View style={styles.entryCountBox}>
        <Text style={styles.entryCountText}>{filteredEntries.length} Entries</Text>
      </View>

      {/* Time Period Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelector}>
        {(['all', 'thisMonth', 'lastMonth', 'last30Days', 'thisYear'] as TimePeriod[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodButton, timePeriod === period && styles.periodButtonActive]}
            onPress={() => setTimePeriod(period)}
          >
            <Text style={[styles.periodButtonText, timePeriod === period && styles.periodButtonTextActive]}>
              {period === 'all' ? 'All' : period === 'thisMonth' ? 'This Month' : period === 'lastMonth' ? 'Last Month' : period === 'last30Days' ? 'Last 30d' : 'This Year'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Statistics - {getPeriodLabel()}</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalDistance}</Text>
              <Text style={styles.statLabel}>Distance ({getUnitLabel()})</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalFuel}l</Text>
              <Text style={styles.statLabel}>Total Fuel</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.fuelPer100km}</Text>
              <Text style={styles.statLabel}>l/100{getUnitLabel()}</Text>
            </View>
          </View>

          <Text style={styles.costSectionTitle}>Costs by Currency</Text>
          {Object.entries(stats.costByCurrency).map(([currency, cost]: [string, any]) => (
            <View key={currency} style={styles.costRow}>
              <Text style={styles.costLabel}>{currency}</Text>
              <Text style={styles.costValue}>
                {getCurrencySymbol(currency)}{cost.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.entriesContainer}>
        <Text style={styles.entriesTitle}>Entries</Text>
        {sortedFilteredEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No entries for this period</Text>
          </View>
        ) : (
          sortedFilteredEntries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>
                  {new Date(entry.date).toLocaleDateString()} {new Date(entry.date).toLocaleTimeString()}
                </Text>
                <TouchableOpacity onPress={() => deleteFuel(entry.id!)}>
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.entryDetails}>
                <View style={styles.entryField}>
                  <Text style={styles.entryLabel}>Mileage</Text>
                  <Text style={styles.entryValue}>{entry.mileage} {getUnitLabel()}</Text>
                </View>
                <View style={styles.entryField}>
                  <Text style={styles.entryLabel}>Fuel</Text>
                  <Text style={styles.entryValue}>{entry.fuelAmount} l</Text>
                </View>
                <View style={styles.entryField}>
                  <Text style={styles.entryLabel}>Cost</Text>
                  <Text style={styles.entryValue}>{getCurrencySymbol(entry.currency)}{entry.cost.toFixed(2)}</Text>
                </View>
                {getEfficiencyForEntry(entry) && (
                  <View style={styles.entryField}>
                    <Text style={styles.entryLabel}>Efficiency</Text>
                    <Text style={styles.entryValue}>{getEfficiencyForEntry(entry)} l/100{getUnitLabel()}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    fontSize: 16,
    color: '#4fb3ff',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  entryCountBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  entryCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4fb3ff',
  },
  periodSelector: {
    paddingHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
  },
  periodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2a2a2a',
    marginRight: 8,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#2a2a2a',
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
  costSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    marginBottom: 6,
  },
  costLabel: {
    fontSize: 12,
    color: '#aaa',
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4fb3ff',
  },
  totalCostBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  totalCostLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fb3ff',
  },
  entriesContainer: {
    padding: 20,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#fff',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#aaa',
  },
  entryCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    color: '#aaa',
  },
  deleteButton: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entryField: {
    flex: 1,
  },
  entryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  entryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
