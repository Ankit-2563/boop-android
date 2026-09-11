import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {fetchApps, iconUrl} from '../services/api';
import {addDockItem, getDockItems} from '../services/storage';
import {DockItem, PairedMac, RemoteApp} from '../types';

export default function AddAppsScreen({
  mac,
  onDone,
}: {
  mac: PairedMac;
  onDone: () => void;
}) {
  const [apps, setApps] = useState<RemoteApp[]>([]);
  const [addedPaths, setAddedPaths] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [appList, dockItems] = await Promise.all([fetchApps(mac, mac.token), getDockItems()]);
        setApps(appList);
        setAddedPaths(new Set(dockItems.map(i => i.path)));
      } catch (e: any) {
        Alert.alert('Could not load apps', e.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [mac]);

  const filtered = useMemo(() => {
    if (!query.trim()) return apps;
    const q = query.toLowerCase();
    return apps.filter(a => a.name.toLowerCase().includes(q));
  }, [apps, query]);

  const handleAdd = async (app: RemoteApp) => {
    await addDockItem(app);
    setAddedPaths(prev => new Set(prev).add(app.path));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Apps</Text>
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.doneLink}>Done</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps..."
        placeholderTextColor="#666"
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.path}
          contentContainerStyle={{paddingBottom: 40}}
          renderItem={({item}) => {
            const isAdded = addedPaths.has(item.path);
            return (
              <View style={styles.row}>
                <Image
                  source={{uri: iconUrl(mac, item.path), headers: {'X-Dock-Token': mac.token}}}
                  style={styles.icon}
                />
                <Text style={styles.appName} numberOfLines={1}>
                  {item.name}
                </Text>
                <TouchableOpacity
                  style={[styles.addButton, isAdded && styles.addButtonDisabled]}
                  disabled={isAdded}
                  onPress={() => handleAdd(item)}>
                  <Text style={styles.addButtonText}>{isAdded ? 'Added' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000', padding: 24, paddingTop: 60},
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  title: {color: '#fff', fontSize: 24, fontWeight: '700'},
  doneLink: {color: '#d2fa00', fontSize: 16, fontWeight: '600'},
  search: {
    marginTop: 16,
    backgroundColor: '#111',
    color: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  icon: {width: 40, height: 40, borderRadius: 8, backgroundColor: '#111'},
  appName: {flex: 1, color: '#fff', fontSize: 16, marginLeft: 14},
  addButton: {
    backgroundColor: '#d2fa00',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonDisabled: {backgroundColor: '#333'},
  addButtonText: {color: '#000', fontWeight: '700', fontSize: 13},
});
