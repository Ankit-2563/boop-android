import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  RefreshControl,
  AppState,
  AppStateStatus,
} from 'react-native';
import {launchApp, iconUrl, heartbeat, unpair} from '../services/api';
import {getDockItems, removeDockItem, clearPairedMac} from '../services/storage';
import {DockItem, PairedMac} from '../types';
import {getDeviceName} from '../utils/device';

const NUM_COLUMNS = 4;

export default function DockScreen({
  mac,
  onAddApps,
  onUnpaired,
}: {
  mac: PairedMac;
  onAddApps: () => void;
  onUnpaired: () => void;
}) {
  const [items, setItems] = useState<DockItem[]>([]);
  const [launchingPath, setLaunchingPath] = useState<string | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setItems(await getDockItems());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Heartbeat loop & AppState listener to keep Mac online status in sync
  useEffect(() => {
    const deviceName = getDeviceName();

    const sendHeartbeat = async () => {
      try {
        await heartbeat(mac, mac.token, deviceName);
      } catch (err: any) {
        if (err.message === 'Unpaired' || err.message?.includes('401')) {
          if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
          await clearPairedMac();
          Alert.alert('Unpaired', 'Your device was unpaired by the Mac.');
          onUnpaired();
        }
      }
    };

    // Initial heartbeat
    sendHeartbeat();

    // Start interval
    heartbeatTimer.current = setInterval(sendHeartbeat, 5000);

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        sendHeartbeat();
        if (!heartbeatTimer.current) {
          heartbeatTimer.current = setInterval(sendHeartbeat, 5000);
        }
      } else {
        if (heartbeatTimer.current) {
          clearInterval(heartbeatTimer.current);
          heartbeatTimer.current = null;
        }
      }
    });

    return () => {
      if (heartbeatTimer.current) {
        clearInterval(heartbeatTimer.current);
      }
      subscription.remove();
    };
  }, [mac, onUnpaired]);

  const handleLaunch = async (item: DockItem) => {
    setLaunchingPath(item.path);
    try {
      await launchApp(mac, mac.token, item.path, getDeviceName());
    } catch (e: any) {
      if (e.message === 'Pairing code incorrect or expired' || e.message?.includes('401')) {
        await clearPairedMac();
        Alert.alert('Session Expired', 'Your device is no longer paired with this Mac.');
        onUnpaired();
      } else {
        Alert.alert('Could not launch', e.message ?? 'Unknown error');
      }
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

  const handleUnpair = () => {
    Alert.alert('Unpair Mac?', `Disconnect from "${mac.name}"?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Unpair',
        style: 'destructive',
        onPress: async () => {
          try {
            await unpair(mac, mac.token);
          } catch (_) {}
          await clearPairedMac();
          onUnpaired();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dock</Text>
          <Text style={styles.macSubtitle}>Connected to {mac.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onAddApps} style={styles.headerBtn}>
            <Text style={styles.addLink}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUnpair} style={[styles.headerBtn, styles.unpairBtn]}>
            <Text style={styles.unpairLink}>Unpair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No apps yet — tap "+ Add" to get started.</Text>
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
  macSubtitle: {color: '#888', fontSize: 13, marginTop: 2},
  headerActions: {flexDirection: 'row', alignItems: 'center', gap: 12},
  headerBtn: {paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6},
  unpairBtn: {backgroundColor: '#222'},
  addLink: {color: '#d2fa00', fontSize: 14, fontWeight: '600'},
  unpairLink: {color: '#ff5555', fontSize: 13, fontWeight: '500'},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {color: '#666', textAlign: 'center', paddingHorizontal: 40},
  cell: {width: `${100 / NUM_COLUMNS}%`, alignItems: 'center', marginBottom: 24},
  icon: {width: ICON_SIZE, height: ICON_SIZE, borderRadius: 14, backgroundColor: '#111'},
  iconLaunching: {opacity: 0.4},
  label: {color: '#ccc', fontSize: 11, marginTop: 6, maxWidth: ICON_SIZE + 20, textAlign: 'center'},
});
