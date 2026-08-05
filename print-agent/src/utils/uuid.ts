import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@print_agent_device_id';

/**
 * Obtém o deviceId persistido ou gera um novo UUID v4
 * para identificar exclusivamente este Print Agent.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  try {
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      return storedId;
    }
    const newId = `agent-${uuidv4().substring(0, 8)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('Erro ao acessar AsyncStorage para deviceId:', error);
    return `agent-${Math.random().toString(36).substring(2, 10)}`;
  }
}
