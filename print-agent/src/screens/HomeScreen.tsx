import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from '../services/socket.service';
import { printerService, BluetoothDevice } from '../services/printer.service';
import { getOrCreateDeviceId } from '../utils/uuid';
import { DEFAULT_CONFIG } from '../config/agent.config';

interface HomeScreenProps {
  onOpenSettings: () => void;
}

interface LogItem {
  id: string;
  time: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenSettings }) => {
  const [deviceId, setDeviceId] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<{ connected: boolean; message: string }>({
    connected: false,
    message: 'Desconectado',
  });
  const [selectedPrinter, setSelectedPrinter] = useState<BluetoothDevice | null>(null);
  const [printerConnected, setPrinterConnected] = useState<boolean>(false);
  const [logs, setLogs] = useState<LogItem[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const newItem: LogItem = {
      id: Math.random().toString(),
      time: new Date().toLocaleTimeString('pt-BR'),
      message,
      type,
    };
    setLogs((prev) => [newItem, ...prev.slice(0, 49)]);
  };

  useEffect(() => {
    bootstrap();
    return () => {
      socketService.disconnect();
    };
  }, []);

  const bootstrap = async () => {
    const devId = await getOrCreateDeviceId();
    setDeviceId(devId);
    addLog(`Agent ID: ${devId}`, 'info');

    // Carregar configurações de backend e impressora salvas
    const savedBackendUrl = (await AsyncStorage.getItem('@backend_url')) || DEFAULT_CONFIG.backendUrl;
    const savedStoreId = (await AsyncStorage.getItem('@store_id')) || DEFAULT_CONFIG.storeId;
    const savedPrinterName = await AsyncStorage.getItem('@printer_name');
    const savedPrinterAddress = await AsyncStorage.getItem('@printer_address');

    if (savedPrinterAddress && savedPrinterName) {
      const device = { name: savedPrinterName, address: savedPrinterAddress };
      setSelectedPrinter(device);
      connectPrinter(device);
    }

    // Inicializar serviço Socket
    socketService.init({
      backendUrl: savedBackendUrl,
      storeId: savedStoreId,
      onStatusChange: (connected, message) => {
        setBackendStatus({ connected, message: message || (connected ? 'Conectado' : 'Desconectado') });
        addLog(`Backend: ${message}`, connected ? 'success' : 'error');
      },
      onJobReceived: (jobId, orderId) => {
        addLog(`Novo pedido recebido: #${orderId.substring(0, 8)}`, 'info');
      },
    });
  };

  const connectPrinter = async (device: BluetoothDevice) => {
    addLog(`Tentando conectar na impressora ${device.name}...`, 'info');
    const ok = await printerService.connect(device.address);
    setPrinterConnected(ok);
    if (ok) {
      addLog(`Impressora conectada: ${device.name}`, 'success');
    } else {
      addLog(`Falha ao conectar impressora: ${device.name}`, 'error');
    }
  };

  const handleTestPrint = async () => {
    try {
      addLog('Enviando teste de impressão...', 'info');
      await printerService.printOrder({
        id: 'TEST-123456',
        createdAt: new Date().toISOString(),
        user: {
          name: 'Teste de Impressao',
          phone: '(00) 90000-0000',
          address: 'Rua Principal',
          number: '100',
          neighborhood: 'Centro',
        },
        items: [
          {
            quantity: 1,
            product: { name: 'X-Burguer Especial' },
            price: 28.9,
            observation: 'Sem cebola',
          },
          {
            quantity: 1,
            product: { name: 'Batata Frita M' },
            price: 14.5,
          },
        ],
        total: 43.4,
      });
      addLog('Teste de impressão enviado com sucesso!', 'success');
    } catch (err: any) {
      Alert.alert('Erro de Impressão', err?.message || 'Falha ao enviar dados para a impressora');
      addLog(`Erro teste: ${err?.message}`, 'error');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121214" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>The Burguer</Text>
          <Text style={styles.subtitle}>Print Agent • KP-1025 (58mm)</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
          <Text style={styles.settingsButtonText}>⚙️ Config</Text>
        </TouchableOpacity>
      </View>

      {/* Cards de Status */}
      <View style={styles.statusGrid}>
        {/* Backend Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardLabel}>Backend WebSocket</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.indicator,
                { backgroundColor: backendStatus.connected ? '#04d361' : '#e5516b' },
              ]}
            />
            <Text style={styles.statusValue}>
              {backendStatus.connected ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <Text style={styles.statusDetails} numberOfLines={1}>
            {backendStatus.message}
          </Text>
        </View>

        {/* Impressora Status */}
        <View style={styles.statusCard}>
          <Text style={styles.cardLabel}>Impressora Bluetooth</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.indicator,
                { backgroundColor: printerConnected ? '#04d361' : '#ff9900' },
              ]}
            />
            <Text style={styles.statusValue}>
              {printerConnected ? 'PRONTA' : 'NÃO CONECTADA'}
            </Text>
          </View>
          <Text style={styles.statusDetails} numberOfLines={1}>
            {selectedPrinter ? selectedPrinter.name : 'Nenhuma selecionada'}
          </Text>
        </View>
      </View>

      {/* Ações rápidas */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleTestPrint}
        >
          <Text style={styles.primaryButtonText}>🖨️ Testar Impressão KP-1025</Text>
        </TouchableOpacity>
      </View>

      {/* Log de Atividades */}
      <View style={styles.logContainer}>
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>Histórico de Atividades</Text>
          <Text style={styles.logSub}>ID: {deviceId}</Text>
        </View>
        <ScrollView style={styles.logScroll}>
          {logs.map((item) => (
            <View key={item.id} style={styles.logRow}>
              <Text style={styles.logTime}>[{item.time}]</Text>
              <Text
                style={[
                  styles.logMessage,
                  item.type === 'success' && styles.logSuccess,
                  item.type === 'error' && styles.logError,
                ]}
              >
                {item.message}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FBA94C',
  },
  subtitle: {
    fontSize: 13,
    color: '#a8a8b3',
    marginTop: 2,
  },
  settingsButton: {
    backgroundColor: '#202024',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#323238',
  },
  settingsButtonText: {
    color: '#e1e1e6',
    fontWeight: '600',
    fontSize: 14,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#202024',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#29292e',
  },
  cardLabel: {
    fontSize: 12,
    color: '#8d8d99',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statusDetails: {
    fontSize: 11,
    color: '#7c7c8a',
  },
  actionRow: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#e51c44',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e51c44',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#202024',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#29292e',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#323238',
    paddingBottom: 8,
  },
  logTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e1e1e6',
  },
  logSub: {
    fontSize: 11,
    color: '#7c7c8a',
  },
  logScroll: {
    flex: 1,
  },
  logRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  logTime: {
    fontSize: 11,
    color: '#7c7c8a',
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  logMessage: {
    fontSize: 12,
    color: '#c4c4cc',
    flex: 1,
  },
  logSuccess: {
    color: '#04d361',
  },
  logError: {
    color: '#f75a68',
  },
});
