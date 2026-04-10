import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useFuelStore } from '@/store/fuelStore';
import { useSettingsStore } from '@/store/settingsStore';
import { CURRENCIES } from '@/constants/currencies';

export default function LogFuelScreen() {
  const [mileage, setMileage] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [efficiency, setEfficiency] = useState<string | null>(null);

  const addFuel = useFuelStore((state) => state.addFuel);
  const unit = useSettingsStore((state) => state.unit);
  const defaultCurrency = useSettingsStore((state) => state.defaultCurrency);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const setDefaultCurrency = useSettingsStore((state) => state.setDefaultCurrency);
  const [selectedCurrency, setSelectedCurrency] = useState('EUR');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then(() => {
      setSelectedCurrency(useSettingsStore.getState().defaultCurrency);
      setIsLoaded(true);
    });
  }, []);

  // Calculate efficiency in real-time
  useEffect(() => {
    const mileageNum = parseFloat(mileage);
    const fuelNum = parseFloat(fuelAmount);

    if (!isNaN(mileageNum) && !isNaN(fuelNum) && mileageNum > 0 && fuelNum > 0) {
      const lastMileage = getLastMileage();
      if (lastMileage !== null && mileageNum > lastMileage) {
        const distance = mileageNum - lastMileage;
        const eff = ((fuelNum / distance) * 100).toFixed(2);
        setEfficiency(eff);
      } else {
        setEfficiency(null);
      }
    } else {
      setEfficiency(null);
    }
  }, [mileage, fuelAmount]);

  const getCurrencySymbol = (code: string) => {
    const curr = CURRENCIES.find((c) => c.code === code);
    return curr?.symbol || code;
  };

  const getCurrencyLabel = (code: string) => {
    const curr = CURRENCIES.find((c) => c.code === code);
    return curr?.code || code;
  };

  const getUnitLabel = () => unit === 'km' ? 'km' : 'miles';

  const getLastMileage = () => {
    const entries = useFuelStore.getState().entries;
    if (entries.length === 0) return null;
    return Math.max(...entries.map(e => e.mileage));
  };

  const handleSubmit = async () => {
    // Validation
    if (!mileage || !fuelAmount || !cost) {
      setError('All fields are required');
      return;
    }

    const mileageNum = parseFloat(mileage);
    const fuelNum = parseFloat(fuelAmount);
    const costNum = parseFloat(cost);

    if (isNaN(mileageNum) || isNaN(fuelNum) || isNaN(costNum)) {
      setError('All fields must be valid numbers');
      return;
    }

    // Check if mileage is not less than the last entry
    const entries = useFuelStore.getState().entries;
    if (entries.length > 0) {
      const lastMileage = Math.max(...entries.map(e => e.mileage));
      if (mileageNum < lastMileage) {
        setError(`Mileage must be at least ${lastMileage} ${unit === 'km' ? 'km' : 'miles'} (last entry)`);
        return;
      }
    }

    try {
      // Add to store
      await addFuel({
        date: new Date().toISOString(),
        mileage: mileageNum,
        fuelAmount: fuelNum,
        cost: costNum,
        currency: selectedCurrency,
      });

      // Reset form
      setMileage('');
      setFuelAmount('');
      setCost('');
      setError('');

      // Navigate to home
      router.back();
    } catch (err) {
      setError('Failed to save entry');
    }
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Currency</Text>
          <TouchableOpacity
            style={styles.currencyButton}
            onPress={() => setShowCurrencyPicker(true)}
          >
            <Text style={styles.currencyButtonText}>
              {getCurrencyLabel(selectedCurrency)} ({getCurrencySymbol(selectedCurrency)})
            </Text>
            <Text style={styles.currencyButtonArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mileage ({getUnitLabel()})</Text>
          <TextInput
            style={styles.input}
            placeholder={getLastMileage() !== null ? `Last: ${getLastMileage()}` : 'Enter odometer reading'}
            placeholderTextColor={getLastMileage() !== null ? '#4fb3ff' : '#666'}
            value={mileage}
            onChangeText={setMileage}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Fuel Amount (liters)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter fuel amount"
            value={fuelAmount}
            onChangeText={setFuelAmount}
            keyboardType="decimal-pad"
          />
        </View>

        {efficiency && (
          <View style={styles.efficiencyBox}>
            <Text style={styles.efficiencyLabel}>Estimated Efficiency</Text>
            <Text style={styles.efficiencyValue}>{efficiency} l/100{getUnitLabel()}</Text>
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.label}>Cost ({getCurrencySymbol(selectedCurrency)})</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter cost"
            value={cost}
            onChangeText={setCost}
            keyboardType="decimal-pad"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Save Fuel Entry</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCurrencyPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={CURRENCIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.currencyOption}
                  onPress={() => {
                    setSelectedCurrency(item.code);
                  }}
                >
                  <View>
                    <Text style={styles.currencyOptionCode}>{item.code}</Text>
                    <Text style={styles.currencyOptionName}>{item.name}</Text>
                  </View>
                  <Text style={styles.currencyOptionSymbol}>{item.symbol}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.makeDefaultButton}
              onPress={() => {
                setDefaultCurrency(selectedCurrency);
                setShowCurrencyPicker(false);
              }}
            >
              <Text style={styles.makeDefaultText}>✓ Set as default currency</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
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
  form: {
    padding: 20,
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
  currencyButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#444',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  currencyButtonArrow: {
    color: '#aaa',
    fontSize: 12,
  },
  error: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: -10,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  modalClose: {
    fontSize: 20,
    color: '#aaa',
  },
  currencyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  currencyOptionCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  currencyOptionName: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  currencyOptionSymbol: {
    fontSize: 14,
    color: '#4fb3ff',
  },
  efficiencyBox: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4fb3ff',
  },
  efficiencyLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  efficiencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fb3ff',
  },
  makeDefaultButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  makeDefaultText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
