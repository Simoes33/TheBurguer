import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { printerService, BluetoothDevice } from '../services/printer.service';
import { DEFAULT_CONFIG } from '../config/agent.config';

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [backendUrl, setBackendUrl] = useState<string>(DEFAULT_CONFIG.backendUrl);
  const [storeId, setStoreId] = useState<string>(DEFAULT_CONFIG.storeId);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const url = await AsyncStorage.getItem('@backend_url');
    const store = await AsyncStorage.getItem('@store_id');
    const printerAddr = await AsyncStorage.getItem('@printer_address');

    if (url) setBackendUrl(url);
    if (store) setStoreId(store);
    if (printerAddr) setSelectedAddress(printerAddr);

    fetchBluetoothDevices();
  };

  const fetchBluetoothDevices = async () => {
    setLoadingDevices(true);
    try {
      const list = await printerService.getPairedDevices();
      setDevices(list);
    } catch (err) {
      console.error('Erro ao listar impressoras Bluetooth:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSelectPrinter = (device: BluetoothDevice) => {
    setSelectedAddress(device.address);
    AsyncStorage.setItem('@printer_name', device.name);
    AsyncStorage.setItem('@printer_address', device.address);
  };

  const handleSave = async () => {
    if (!backendUrl.trim()) {
      Alert.alert('Atenção', 'Informe a URL do backend NestJS');
      return;
    }

    try {
      await AsyncStorage.setItem('@backend_url', backendUrl.trim());
      await AsyncStorage.setItem('@store_id', storeId.trim() || 'default');

      Alert.alert('Sucesso', 'Configurações salvas. Reinicie a conexão no painel principal.', [
        { text: 'OK', onPress: onBack },
      ]);
    } catch (err) {
      Alert.alert('Erro', 'Falha ao salvar configurações');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações do Agent</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Seção 1: Backend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Conexão com Backend (NestJS)</Text>
          
          <Text style={styles.label}>URL do Backend (HTTPS / HTTP):</Text>
          <TextInput
            style={styles.input}
            value={backendUrl}
            onChangeText={setBackendUrl}
            placeholder="https://the-burguer-backend.onrender.com"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>ID da Loja (Store ID):</Text>
          <TextInput
            style={styles.input}
            value={storeId}
            onChangeText={setStoreId}
            placeholder="default"
            placeholderTextColor="#666"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Seção 2: Impressora Bluetooth KP-1025 */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>2. Impressora Bluetooth (Knup KP-1025)</Text>
            <TouchableOpacity onPress={fetchBluetoothDevices}>
              <Text style={styles.reloadText}>🔄 Atualizar</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            Certifique-se de que a Knup KP-1025 está ligada e pareada no Bluetooth do Android (PIN padrão: 0000).
          </Text>

          {loadingDevices ? (
            <ActivityIndicator size="small" color="#FBA94C" style={{ marginVertical: 12 }} />
          ) : devices.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhum dispositivo Bluetooth pareado encontrado. Pareie a impressora nas configurações de Bluetooth do dispositivo Android.
            </Text>
          ) : (
            devices.map((item) => {
              const isSelected = item.address === selectedAddress;
              return (
                <TouchableOpacity
                  key={item.address}
                  style={[styles.deviceCard, isSelected && styles.deviceCardSelected]}
                  onPress={() => handleSelectPrinter(item)}
                >
                  <View>
                    <Text style={[styles.deviceName, isSelected && styles.deviceNameSelected]}>
                      {item.name}
                    </Text>
                    <Text style={styles.deviceAddress}>{item.address}</Text>
                  </View>
                  {isSelected && <Text style={styles.selectedBadge}>✓ Selecionada</Text>}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Salvar Configurações</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#29292e',
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    color: '#FBA94C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#202024',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#29292e',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FBA94C',
    marginBottom: 12,
  },
  reloadText: {
    color: '#04d361',
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 13,
    color: '#c4c4cc',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#121214',
    borderWidth: 1,
    borderColor: '#323238',
    borderRadius: 8,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  helperText: {
    fontSize: 12,
    color: '#8d8d99',
    marginBottom: 12,
    lineHeight: 16,
  },
  emptyText: {
    color: '#7c7c8a',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 10,
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#121214',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#323238',
    marginBottom: 8,
  },
  deviceCardSelected: {
    borderColor: '#04d361',
    backgroundColor: '#19221b',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e1e1e6',
  },
  deviceNameSelected: {
    color: '#04d361',
  },
  deviceAddress: {
    fontSize: 11,
    color: '#7c7c8a',
    marginTop: 2,
  },
  selectedBadge: {
    color: '#04d361',
    fontWeight: 'bold',
    fontSize: 13,
  },
  saveButton: {
    backgroundColor: '#04d361',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#09090a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
