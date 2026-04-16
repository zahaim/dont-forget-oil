import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Modal, FlatList, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useFuelStore } from '@/store/fuelStore';
import { useSettingsStore } from '@/store/settingsStore';
import { CURRENCIES } from '@/constants/currencies';
import { extractMileage, extractPumpReading } from '@/utils/ocr';

export default function LogFuelScreen() {
  const [mileage, setMileage] = useState('');
  const [fuelAmount, setFuelAmount] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [odometerPhoto, setOdometerPhoto] = useState<string | null>(null);
  const [fuelPhoto, setFuelPhoto] = useState<string | null>(null);
  const [efficiency, setEfficiency] = useState<string | null>(null);
  const [makeDefault, setMakeDefault] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrHint, setOcrHint] = useState<string | null>(null);
  const [ocrDebug, setOcrDebug] = useState<string[] | null>(null);
  const [mileageCandidates, setMileageCandidates] = useState<number[]>([]);
  const [pumpCandidates, setPumpCandidates] = useState<number[]>([]);
  const [showMileagePicker, setShowMileagePicker] = useState(false);
  const [showPumpPicker, setShowPumpPicker] = useState<'fuel' | 'cost' | null>(null);

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

  const processPhoto = async (uri: string, target: 'odometer' | 'fuel') => {
    if (target === 'odometer') {
      setOdometerPhoto(uri);
      setOcrProcessing(true);
      setOcrHint(null);
      setOcrDebug(null);
      setMileageCandidates([]);
      try {
        const lastMil = getLastMileage();
        const res = await extractMileage(uri, lastMil);
        setOcrDebug(res.rawText);
        if (res.value !== null) {
          setMileage(String(res.value));
          const extra = res.candidates.length > 1 ? ` (${res.candidates.length} candidates)` : '';
          setOcrHint(`Detected mileage: ${res.value}${extra}`);
          if (res.candidates.length > 1) {
            setMileageCandidates(res.candidates);
          }
        } else {
          setOcrHint('Could not read mileage — enter manually');
        }
      } catch {
        setOcrHint('OCR failed — enter manually');
      } finally {
        setOcrProcessing(false);
      }
    } else {
      setFuelPhoto(uri);
      setOcrProcessing(true);
      setOcrHint(null);
      setOcrDebug(null);
      setPumpCandidates([]);
      try {
        const pump = await extractPumpReading(uri);
        setOcrDebug(pump.rawText);
        const parts: string[] = [];
        if (pump.fuelAmount !== null) {
          setFuelAmount(String(pump.fuelAmount));
          parts.push(`volume: ${pump.fuelAmount}`);
        }
        if (pump.cost !== null) {
          setCost(String(pump.cost));
          parts.push(`cost: ${pump.cost}`);
        }
        if (pump.pricePerUnit !== null) {
          parts.push(`price/l: ${pump.pricePerUnit}`);
        }
        if (parts.length > 0) {
          const extra = pump.allCandidates.length > 1 ? ` (${pump.allCandidates.length} values found)` : '';
          setOcrHint(`Detected ${parts.join(', ')}${extra}`);
        } else {
          setOcrHint('Could not read pump display — enter manually');
        }
        if (pump.allCandidates.length > 1) {
          setPumpCandidates(pump.allCandidates);
        }
      } catch {
        setOcrHint('OCR failed — enter manually');
      } finally {
        setOcrProcessing(false);
      }
    }
  };

  const capturePhoto = async (target: 'odometer' | 'fuel') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setError('Camera permission is required to take photos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 1.0,
    });
    if (!result.canceled) {
      await processPhoto(result.assets[0].uri, target);
    }
  };

  const pickPhoto = async (target: 'odometer' | 'fuel') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('Photo library permission is required');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1.0,
    });
    if (!result.canceled) {
      await processPhoto(result.assets[0].uri, target);
    }
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

      // Set as default if checkbox is checked
      if (makeDefault) {
        await setDefaultCurrency(selectedCurrency);
      }

      // Reset form
      setMileage('');
      setFuelAmount('');
      setCost('');
      setError('');
      setMakeDefault(false);

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
      keyboardVerticalOffset={130}
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
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setMakeDefault(!makeDefault)}
          >
            <Text style={styles.checkbox}>{makeDefault ? '☑' : '☐'}</Text>
            <Text style={styles.checkboxLabel}>Make it default</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Mileage ({getUnitLabel()})</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.cameraButton} onPress={() => capturePhoto('odometer')}>
                <Text style={styles.cameraButtonText}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={() => pickPhoto('odometer')}>
                <Text style={styles.cameraButtonText}>🖼 Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.photoTip}>Crop to numbers only, avoid glare</Text>
          <TextInput
            style={styles.input}
            placeholder={getLastMileage() !== null ? `Last: ${getLastMileage()}` : 'Enter odometer reading'}
            placeholderTextColor={getLastMileage() !== null ? '#4fb3ff' : '#666'}
            value={mileage}
            onChangeText={setMileage}
            keyboardType="decimal-pad"
          />
          {mileageCandidates.length > 1 && (
            <TouchableOpacity
              style={styles.pickValueButton}
              onPress={() => setShowMileagePicker(true)}
            >
              <Text style={styles.pickValueText}>
                Choose from {mileageCandidates.length} detected values ▼
              </Text>
            </TouchableOpacity>
          )}
          {odometerPhoto && (
            <TouchableOpacity onPress={() => setOdometerPhoto(null)}>
              <Image source={{ uri: odometerPhoto }} style={styles.photoThumbnail} />
              <Text style={styles.photoHint}>Tap to remove</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Fuel Amount (liters)</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.cameraButton} onPress={() => capturePhoto('fuel')}>
                <Text style={styles.cameraButtonText}>📷 Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cameraButton} onPress={() => pickPhoto('fuel')}>
                <Text style={styles.cameraButtonText}>🖼 Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.photoTip}>Include L/dm3 and price labels for best results</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter fuel amount"
            value={fuelAmount}
            onChangeText={setFuelAmount}
            keyboardType="decimal-pad"
          />
          {pumpCandidates.length > 1 && (
            <View style={styles.pickValueRow}>
              <TouchableOpacity
                style={styles.pickValueButton}
                onPress={() => setShowPumpPicker('fuel')}
              >
                <Text style={styles.pickValueText}>Pick volume ▼</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickValueButton}
                onPress={() => setShowPumpPicker('cost')}
              >
                <Text style={styles.pickValueText}>Pick cost ▼</Text>
              </TouchableOpacity>
            </View>
          )}
          {fuelPhoto && (
            <TouchableOpacity onPress={() => setFuelPhoto(null)}>
              <Image source={{ uri: fuelPhoto }} style={styles.photoThumbnail} />
              <Text style={styles.photoHint}>Tap to remove</Text>
            </TouchableOpacity>
          )}
        </View>

        {efficiency && (
          <View style={styles.efficiencyBox}>
            <Text style={styles.efficiencyLabel}>Estimated Efficiency</Text>
            <Text style={styles.efficiencyValue}>{efficiency} l/100{getUnitLabel()}</Text>
          </View>
        )}

        {ocrProcessing && (
          <View style={styles.ocrStatusBox}>
            <ActivityIndicator size="small" color="#4fb3ff" />
            <Text style={styles.ocrStatusText}>Reading photo...</Text>
          </View>
        )}

        {!ocrProcessing && ocrHint && (
          <View style={styles.ocrStatusBox}>
            <Text style={styles.ocrStatusText}>{ocrHint}</Text>
          </View>
        )}

        {!ocrProcessing && ocrDebug && ocrDebug.length > 0 && (
          <TouchableOpacity
            style={styles.ocrDebugBox}
            onPress={() => setOcrDebug(null)}
          >
            <Text style={styles.ocrDebugTitle}>OCR raw text (tap to dismiss):</Text>
            {ocrDebug.map((line, i) => (
              <Text key={i} style={styles.ocrDebugLine}>
                {i + 1}: {line}
              </Text>
            ))}
          </TouchableOpacity>
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
                    setShowCurrencyPicker(false);
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
          </View>
        </View>
      </Modal>
      {/* Mileage candidate picker */}
      <Modal
        visible={showMileagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMileagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Mileage</Text>
              <TouchableOpacity onPress={() => setShowMileagePicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={mileageCandidates}
              keyExtractor={(item) => String(item)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.candidateOption}
                  onPress={() => {
                    setMileage(String(item));
                    setShowMileagePicker(false);
                  }}
                >
                  <Text style={styles.candidateValue}>{item.toLocaleString()}</Text>
                  {String(item) === mileage && (
                    <Text style={styles.candidateSelected}>selected</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Pump candidate picker (fuel or cost) */}
      <Modal
        visible={showPumpPicker !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPumpPicker(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {showPumpPicker === 'fuel' ? 'Fuel Amount' : 'Cost'}
              </Text>
              <TouchableOpacity onPress={() => setShowPumpPicker(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={pumpCandidates}
              keyExtractor={(item) => String(item)}
              renderItem={({ item }) => {
                const current = showPumpPicker === 'fuel' ? fuelAmount : cost;
                return (
                  <TouchableOpacity
                    style={styles.candidateOption}
                    onPress={() => {
                      if (showPumpPicker === 'fuel') {
                        setFuelAmount(String(item));
                      } else {
                        setCost(String(item));
                      }
                      setShowPumpPicker(null);
                    }}
                  >
                    <Text style={styles.candidateValue}>{item}</Text>
                    {String(item) === current && (
                      <Text style={styles.candidateSelected}>selected</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      </ScrollView>

      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Save Fuel Entry</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 0,
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
  },
  footer: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  photoTip: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
  },
  cameraButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#444',
  },
  cameraButtonText: {
    color: '#aaa',
    fontSize: 13,
  },
  photoThumbnail: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'contain',
  },
  photoHint: {
    color: '#555',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 8,
  },
  checkbox: {
    fontSize: 18,
    color: '#4fb3ff',
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  ocrStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2a1e',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4fb3ff',
  },
  ocrStatusText: {
    color: '#ccc',
    fontSize: 13,
    flexShrink: 1,
  },
  ocrDebugBox: {
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9500',
  },
  ocrDebugTitle: {
    color: '#ff9500',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  ocrDebugLine: {
    color: '#999',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  pickValueButton: {
    backgroundColor: '#1a2a3a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4fb3ff',
  },
  pickValueText: {
    color: '#4fb3ff',
    fontSize: 13,
    fontWeight: '500',
  },
  pickValueRow: {
    flexDirection: 'row',
    gap: 10,
  },
  candidateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  candidateValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  candidateSelected: {
    fontSize: 12,
    color: '#4fb3ff',
    fontStyle: 'italic',
  },
});
