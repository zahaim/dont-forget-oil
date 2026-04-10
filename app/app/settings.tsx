import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useFuelStore } from '@/store/fuelStore';
import { CURRENCIES } from '@/constants/currencies';

const units = ['km', 'miles'] as const;

export default function SettingsScreen() {
  const unit = useSettingsStore((state) => state.unit);
  const setUnit = useSettingsStore((state) => state.setUnit);
  const defaultCurrency = useSettingsStore((state) => state.defaultCurrency);
  const setDefaultCurrency = useSettingsStore((state) => state.setDefaultCurrency);
  const resetSetup = useSettingsStore((state) => state.resetSetup);
  const clearAll = useFuelStore((state) => state.clearAll);
  const addSampleData = useFuelStore((state) => state.addSampleData);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    useSettingsStore.getState().loadSettings().then(() => setIsLoaded(true));
  }, []);

  const handleNewCar = async () => {
    Alert.alert(
      'Get a New Car?',
      'This will clear all fuel entries and reset your car setup. This cannot be undone.',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel'
        },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              // Clear localStorage for web
              if (typeof localStorage !== 'undefined') {
                localStorage.clear();
              }

              await clearAll();
              await resetSetup();

              // Wait a bit for storage to sync
              await new Promise(resolve => setTimeout(resolve, 200));

              router.replace('/setup');
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
              console.error('New car error:', error);
              Alert.alert(
                'Reset Failed',
                `Could not reset your car setup: ${errorMsg}\n\nTry again or contact support.`,
                [{ text: 'OK' }]
              );
            }
          },
          style: 'destructive'
        },
      ]
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Currency</Text>
        <View style={styles.optionsContainer}>
          {CURRENCIES.map((curr) => (
            <TouchableOpacity
              key={curr.code}
              style={[
                styles.option,
                defaultCurrency === curr.code && styles.optionSelected,
              ]}
              onPress={() => setDefaultCurrency(curr.code)}
            >
              <Text
                style={[
                  styles.optionText,
                  defaultCurrency === curr.code && styles.optionTextSelected,
                ]}
              >
                {curr.code} {curr.symbol}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Distance Unit</Text>
        <View style={styles.optionsContainer}>
          {units.map((u) => (
            <TouchableOpacity
              key={u}
              style={[
                styles.option,
                unit === u && styles.optionSelected,
              ]}
              onPress={() => setUnit(u)}
            >
              <Text
                style={[
                  styles.optionText,
                  unit === u && styles.optionTextSelected,
                ]}
              >
                {u === 'km' ? 'Kilometers' : 'Miles'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            addSampleData().then(() => {
              Alert.alert('Success', 'Sample data added. Go back to see the entries.');
              useSettingsStore.getState().loadSettings();
            });
          }}
        >
          <Text style={styles.buttonText}>📝 Add Sample Data</Text>
        </TouchableOpacity>
        <Text style={styles.infoText}>
          Adds entries from different months for testing filters
        </Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleNewCar}
        >
          <Text style={styles.dangerButtonText}>🚗 I Have a New Car</Text>
        </TouchableOpacity>
        <Text style={styles.warningText}>
          This will clear all entries and reset your car setup
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 10,
  },
  option: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#2a2a2a',
  },
  optionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#1a3a4a',
  },
  optionText: {
    fontSize: 16,
    color: '#aaa',
  },
  optionTextSelected: {
    color: '#4fb3ff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    color: '#666',
    fontSize: 12,
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#3a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#FF3B30',
    alignItems: 'center',
    marginTop: 20,
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
});
