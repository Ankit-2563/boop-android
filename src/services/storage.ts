import AsyncStorage from '@react-native-async-storage/async-storage';
import {DockItem, PairedMac} from '../types';

const PAIRED_MAC_KEY = 'boop:pairedMac';
const DOCK_ITEMS_KEY = 'boop:dockItems';

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

export async function getDockItems(): Promise<DockItem[]> {
  const raw = await AsyncStorage.getItem(DOCK_ITEMS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveDockItems(items: DockItem[]): Promise<void> {
  await AsyncStorage.setItem(DOCK_ITEMS_KEY, JSON.stringify(items));
}
