import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {getDockItems} from '../services/storage';
import {DockItem, PairedMac} from '../types';

export default function DockScreen({
  mac,
  onAddApps,
}: {
  mac: PairedMac;
  onAddApps: () => void;
}) {
  const [items, setItems] = useState<DockItem[]>([]);

  const load = useCallback(async () => {
    setItems(await getDockItems());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dock</Text>
        <TouchableOpacity onPress={onAddApps}>
          <Text style={styles.addLink}>+ Add Apps</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No apps yet — tap "Add Apps" to get started.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {color: '#fff', fontSize: 26, fontWeight: '700'},
  addLink: {color: '#d2fa00', fontSize: 15, fontWeight: '600'},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {color: '#666', textAlign: 'center', paddingHorizontal: 40},
});
