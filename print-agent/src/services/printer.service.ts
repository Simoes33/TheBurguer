import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import { buildReceiptText, PrintableOrder } from '../utils/escpos.builder';

const { BluetoothManager, BluetoothEscposPrinter } = NativeModules;

export interface BluetoothDevice {
  name: string;
  address: string;
}

export class PrinterService {
  private isConnected = false;
  private connectedAddress: string | null = null;
  
  // Fila FIFO assíncrona para garantir execução sequencial no Bluetooth SPP
  private printQueue: Array<{
    order: PrintableOrder;
    resolve: (val: boolean) => void;
    reject: (err: any) => void;
  }> = [];
  private isProcessingQueue = false;

  /**
   * Solicita permissões de Bluetooth para Android 12+ (BLUETOOTH_CONNECT, BLUETOOTH_SCAN, ACCESS_FINE_LOCATION)
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (err) {
      console.warn('Erro ao solicitar permissões Bluetooth:', err);
      return false;
    }
  }

  /**
   * Obtém a lista de dispositivos Bluetooth pareados
   */
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    const hasPerm = await this.requestPermissions();
    if (!hasPerm) return [];

    try {
      if (BluetoothManager?.scanDevices) {
        const res = await BluetoothManager.scanDevices();
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        const paired = parsed?.paired || [];
        return paired.map((d: any) => ({
          name: d.name || 'Dispositivo Desconhecido',
          address: d.address,
        }));
      }
    } catch (err) {
      console.error('Erro ao buscar dispositivos Bluetooth pareados:', err);
    }
    return [];
  }

  /**
   * Conecta ao dispositivo Bluetooth especificado pelo endereço MAC
   */
  async connect(address: string): Promise<boolean> {
    try {
      if (BluetoothManager?.connect) {
        await BluetoothManager.connect(address);
        this.isConnected = true;
        this.connectedAddress = address;
        return true;
      }
    } catch (err) {
      console.error(`Falha ao conectar no Bluetooth (${address}):`, err);
      this.isConnected = false;
      this.connectedAddress = null;
    }
    return false;
  }

  /**
   * Tenta reconectar a impressora até N vezes se a conexão tiver caído.
   */
  private async ensureConnection(retries = 3): Promise<boolean> {
    if (this.isConnected) return true;
    if (!this.connectedAddress) return false;

    for (let i = 1; i <= retries; i++) {
      console.log(`[PrinterService] Tentativa ${i}/${retries} de reconectar à impressora Bluetooth...`);
      const ok = await this.connect(this.connectedAddress);
      if (ok) return true;
      await new Promise((res) => setTimeout(() => res(true), 2000));
    }
    return false;
  }

  /**
   * Enfileira o pedido na fila sequencial (FIFO) para evitar colisão no socket Bluetooth SPP.
   */
  printOrder(order: PrintableOrder): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.printQueue.push({ order, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Processa a fila de impressão sequencialmente um por um.
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.printQueue.length === 0) return;

    this.isProcessingQueue = true;
    const task = this.printQueue.shift();

    if (!task) {
      this.isProcessingQueue = false;
      return;
    }

    try {
      await this.ensureConnection(2);

      const receiptText = buildReceiptText(task.order);

      if (BluetoothEscposPrinter?.printRaw) {
        await BluetoothEscposPrinter.printRaw(receiptText, {});
      } else if (BluetoothEscposPrinter?.printText) {
        await BluetoothEscposPrinter.printText(receiptText, {});
      } else {
        console.log('--- SIMULAÇÃO DE IMPRESSÃO (Bluetooth escpos não nativo) ---');
        console.log(receiptText);
      }

      task.resolve(true);
    } catch (err) {
      console.error('Erro durante o processo de impressão na fila:', err);
      task.reject(err);
    } finally {
      // Pequena pausa entre cupons para dar tempo à cabeça térmica e ao buffer da KP-1025
      await new Promise((res) => setTimeout(() => res(true), 1000));
      this.isProcessingQueue = false;
      this.processQueue();
    }
  }

  getConnectedAddress(): string | null {
    return this.connectedAddress;
  }
}

export const printerService = new PrinterService();
