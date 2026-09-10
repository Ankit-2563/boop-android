import AsyncStorage from '@react-native-async-storage/async-storage';
import {PairedMac} from '../types';

const PAIRED_MAC_KEY = 'boop:pairedMac';

export async function getPairedMac(): Promise<PairedMac | null> {
  const raw = await AsyncStorage.getItem(PAIRED_MAC_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function savePairedMac(mac: PairedMac): Promise<void> {
  await AsyncStorage.setItem(PAIRED_MAC_KEY, JSON.stringify(mac));
}

export async function clearPairedMac(): Promise<void> {
  await AsyncStorage.removeItem(PAIRED_MAC_KEY);
}
