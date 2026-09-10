import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {startDiscovery, stopDiscovery} from '../services/discovery';
import {ping} from '../services/api';
import {savePairedMac} from '../services/storage';
import {MacHost} from '../types';

export default function PairScreen({onPaired}: {onPaired: () => void}) {
  const [found, setFound] = useState<MacHost[]>([]);
  const [selected, setSelected] = useState<MacHost | null>(null);
  const [code, setCode] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    startDiscovery(
      host => {
        setFound(prev => (prev.some(h => h.host === host.host) ? prev : [...prev, host]));
      },
      err => Alert.alert('Discovery error', err.message),
    );
    return () => stopDiscovery();
  }, []);

  const confirmPair = async () => {
    if (!selected) return;
    if (code.trim().length !== 6) {
      Alert.alert('Enter the 6-digit code shown on your Mac');
      return;
    }
    setConnecting(true);
    try {
      await ping(selected); // confirm reachable
      await savePairedMac({...selected, token: code.trim()});
      onPaired();
    } catch (e: any) {
      Alert.alert('Could not connect', e.message ?? 'Unknown error');
    } finally {
      setConnecting(false);
    }
  };

  if (selected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Pair with {selected.name}</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code from the Mac's menu bar</Text>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="000000"
          placeholderTextColor="#666"
        />
        {connecting ? (
          <ActivityIndicator style={{marginTop: 20}} />
        ) : (
          <TouchableOpacity style={styles.primaryButton} onPress={confirmPair}>
            <Text style={styles.primaryButtonText}>Connect</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => setSelected(null)}>
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
          <TouchableOpacity style={styles.macRow} onPress={() => setSelected(item)}>
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
  macRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  macName: {color: '#fff', fontSize: 17},
  macHost: {color: '#666', fontSize: 13, marginTop: 2},
  codeInput: {
    marginTop: 24,
    color: '#fff',
    fontSize: 32,
    letterSpacing: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#d2fa00',
    paddingVertical: 8,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 32,
    backgroundColor: '#d2fa00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {color: '#000', fontWeight: '700', fontSize: 16},
  backLink: {color: '#666', textAlign: 'center', marginTop: 20},
});
