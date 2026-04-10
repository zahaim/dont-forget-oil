import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { CURRENCIES } from '@/constants/currencies';

const units = ['km', 'miles'] as const;

export default function SetupScreen() {
  const [carName, setCarName] = useState('');
  const [initialMileage, setInitialMileage] = useState('');
  const [error, setError] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<'km' | 'miles'>('km');
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const completeSetup = useSettingsStore((state) => state.completeSetup);
  const setUnit = useSettingsStore((state) => state.setUnit);
  const setDefaultCurrency = useSettingsStore((state) => state.setDefaultCurrency);

  const handleComplete = async () => {
    if (!carName.trim()) {
      setError('Please enter your car name');
      return;
    }

    if (!initialMileage.trim()) {
      setError('Please enter initial mileage');
      return;
    }

    const mileageNum = parseFloat(initialMileage);
    if (isNaN(mileageNum)) {
      setError('Initial mileage must be a valid number');
      return;
    }

    try {
      await completeSetup(carName.trim(), mileageNum);
      setUnit(selectedUnit);
      setDefaultCurrency(selectedCurrency);
      // Navigate to home instead of back
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Setup error:', err);
      setError('Failed to save setup: ' + String(err));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to don't-forget-oil!</Text>
        <Text style={styles.subtitle}>Let's set up your car</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Car Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. My Honda Civic"
              value={carName}
              onChangeText={setCarName}
            />
            <Text style={styles.hint}>Give your car a name or use the make/model</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Initial Mileage</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150000"
              value={initialMileage}
              onChangeText={setInitialMileage}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>The odometer reading right now</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Distance Unit</Text>
            <View style={styles.optionsContainer}>
              {units.map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.option,
                    selectedUnit === u && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedUnit(u)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedUnit === u && styles.optionTextSelected,
                    ]}
                  >
                    {u === 'km' ? 'Kilometers' : 'Miles'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Default Currency</Text>
            <View style={styles.optionsContainer}>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.option,
                    selectedCurrency === curr.code && styles.optionSelected,
                  ]}
                  onPress={() => setSelectedCurrency(curr.code)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedCurrency === curr.code && styles.optionTextSelected,
                    ]}
                  >
                    {curr.code} {curr.symbol}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleComplete}>
            <Text style={styles.buttonText}>Start Tracking</Text>
          </TouchableOpacity>

          <Text style={styles.info}>
            This helps us accurately calculate your fuel efficiency and distance traveled. You can change this later in settings.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 40,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444',
    color: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
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
});
