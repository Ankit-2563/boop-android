import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {fetchApps, iconUrl} from '../services/api';
import {PairedMac, RemoteApp} from '../types';

export default function AddAppsScreen({
  mac,
  onDone,
}: {
  mac: PairedMac;
  onDone: () => void;
}) {
  const [apps, setApps] = useState<RemoteApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const appList = await fetchApps(mac, mac.token);
        setApps(appList);
      } catch (e: any) {
        Alert.alert('Could not load apps', e.message ?? 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, [mac]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Add Apps</Text>
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.doneLink}>Done</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{marginTop: 40}} />
      ) : (
        <FlatList
          data={apps}
          keyExtractor={item => item.path}
          renderItem={({item}) => (
            <View style={styles.row}>
              <Image
                source={{uri: iconUrl(mac, item.path), headers: {'X-Dock-Token': mac.token}}}
                style={styles.icon}
              />
              <Text style={styles.appName} numberOfLines={1}>{item.name}</Text>
            </View>
          )}
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
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a'},
  icon: {width: 40, height: 40, borderRadius: 8, backgroundColor: '#111'},
  appName: {flex: 1, color: '#fff', fontSize: 16, marginLeft: 14},
});
