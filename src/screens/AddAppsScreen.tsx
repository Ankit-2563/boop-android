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
        <TouchableOpacity style={styles.doneButton} activeOpacity={0.7} onPress={onDone}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search apps..."
        placeholderTextColor="#666666"
        autoCapitalize="none"
      />

      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} color="#ffffff" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.path}
          contentContainerStyle={{paddingBottom: 24}}
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
                  activeOpacity={0.7}
                  onPress={() => handleAdd(item)}>
                  <Text style={[styles.addButtonText, isAdded && styles.addButtonTextDisabled]}>
                    {isAdded ? 'Added' : '+ Add'}
                  </Text>
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
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  doneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  search: {
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#141416',
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#161618',
  },
  appName: {
    flex: 1,
    color: '#f5f5f7',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
  },
  addButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  addButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 12,
  },
  addButtonTextDisabled: {
    color: '#636366',
  },
});
