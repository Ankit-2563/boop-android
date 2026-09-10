import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import {iconUrl} from '../services/api';
import {getDockItems} from '../services/storage';
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
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No apps yet — tap "Add Apps" to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.path}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{paddingTop: 20}}
          renderItem={({item}) => (
            <TouchableOpacity style={styles.cell}>
              <Image
                source={{uri: iconUrl(mac, item.path), headers: {'X-Dock-Token': mac.token}}}
                style={styles.icon}
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
  label: {color: '#ccc', fontSize: 11, marginTop: 6, maxWidth: ICON_SIZE + 20, textAlign: 'center'},
});
