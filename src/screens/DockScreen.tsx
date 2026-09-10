import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import {launchApp, iconUrl} from '../services/api';
import {getDockItems, removeDockItem} from '../services/storage';
import {DockItem, PairedMac} from '../types';

const NUM_COLUMNS = 4;

export default function DockScreen({
  mac,
  onAddApps,
}: {
  mac: PairedMac;
  onAddApps: () => void;
}) {
  const [items, setItems] = useState<DockItem[]>([]);
  const [launchingPath, setLaunchingPath] = useState<string | null>(null);

  const load = useCallback(async () => {
    setItems(await getDockItems());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleLaunch = async (item: DockItem) => {
    setLaunchingPath(item.path);
    try {
      await launchApp(mac, mac.token, item.path);
    } catch (e: any) {
      Alert.alert('Could not launch', e.message ?? 'Unknown error');
    } finally {
      setLaunchingPath(null);
    }
  };

  const handleRemove = (item: DockItem) => {
    Alert.alert('Remove from dock?', item.name, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => setItems(await removeDockItem(item.path)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dock</Text>
        <TouchableOpacity onPress={onAddApps}>
          <Text style={styles.addLink}>+ Add Apps</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No apps yet — tap "Add Apps" to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.path}
          numColumns={NUM_COLUMNS}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor="#fff" />}
          contentContainerStyle={{paddingTop: 20}}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.cell}
              onPress={() => handleLaunch(item)}
              onLongPress={() => handleRemove(item)}
              disabled={launchingPath === item.path}>
              <Image
                source={{uri: iconUrl(mac, item.path), headers: {'X-Dock-Token': mac.token}}}
                style={[styles.icon, launchingPath === item.path && styles.iconLaunching]}
              />
              <Text style={styles.label} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const ICON_SIZE = 60;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000', padding: 20, paddingTop: 60},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {color: '#fff', fontSize: 26, fontWeight: '700'},
  addLink: {color: '#d2fa00', fontSize: 15, fontWeight: '600'},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {color: '#666', textAlign: 'center', paddingHorizontal: 40},
  cell: {width: `${100 / NUM_COLUMNS}%`, alignItems: 'center', marginBottom: 24},
  icon: {width: ICON_SIZE, height: ICON_SIZE, borderRadius: 14, backgroundColor: '#111'},
  iconLaunching: {opacity: 0.4},
  label: {color: '#ccc', fontSize: 11, marginTop: 6, maxWidth: ICON_SIZE + 20, textAlign: 'center'},
});
