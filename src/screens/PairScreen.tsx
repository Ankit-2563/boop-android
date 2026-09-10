import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {startDiscovery, stopDiscovery} from '../services/discovery';
import {MacHost} from '../types';

export default function PairScreen({onPaired}: {onPaired: () => void}) {
  const [found, setFound] = useState<MacHost[]>([]);

  useEffect(() => {
    startDiscovery(
      host => {
        setFound(prev => (prev.some(h => h.host === host.host) ? prev : [...prev, host]));
      },
      err => Alert.alert('Discovery error', err.message),
    );
    return () => stopDiscovery();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find your Mac</Text>
      <Text style={styles.subtitle}>Make sure Boop is running on your MacBook and you're on the same WiFi.</Text>
      <FlatList
        data={found}
        keyExtractor={item => item.host}
        style={{marginTop: 20}}
        ListEmptyComponent={<ActivityIndicator style={{marginTop: 40}} />}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.macRow}>
            <Text style={styles.macName}>{item.name}</Text>
            <Text style={styles.macHost}>{item.host}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000', padding: 24, paddingTop: 60},
  title: {color: '#fff', fontSize: 24, fontWeight: '700'},
  subtitle: {color: '#999', fontSize: 14, marginTop: 8},
  macRow: {paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222'},
  macName: {color: '#fff', fontSize: 17},
  macHost: {color: '#666', fontSize: 13, marginTop: 2},
});
