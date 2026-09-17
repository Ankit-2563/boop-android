import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {Camera, CameraType} from 'react-native-camera-kit';
import {ping, pair} from '../services/api';
import {savePairedMac} from '../services/storage';
import {MacHost} from '../types';
import {parseBoopURI} from '../utils/pairing';
import {getDeviceName} from '../utils/device';

type Mode = 'qr' | 'manual';

export default function PairScreen({onPaired}: {onPaired: () => void}) {
  const [mode, setMode] = useState<Mode>('qr');
  const [cameraReady, setCameraReady] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Manual pairing state
  const [manualHost, setManualHost] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (mode === 'qr') {
      requestCameraPermission();
    }
  }, [mode]);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      setCameraReady(granted === PermissionsAndroid.RESULTS.GRANTED);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert('Camera permission required', 'Boop needs camera access to scan QR codes.');
        setMode('manual');
      }
    } else {
      setCameraReady(true);
    }
  };

  const handleQRRead = async (event: {nativeEvent: {codeStringValue: string}}) => {
    if (connecting) return;
    const qrValue = event.nativeEvent.codeStringValue;
    const parsed = parseBoopURI(qrValue);
    if (!parsed) return;

    setConnecting(true);
    try {
      const mac: MacHost = {name: 'Mac', host: parsed.host, port: parsed.port};
      const result = await ping(mac);
      const myDeviceName = getDeviceName();
      await pair(mac, parsed.token, myDeviceName);
      const deviceName = result.deviceName || 'Mac';
      await savePairedMac({...mac, name: deviceName, token: parsed.token});
      onPaired();
    } catch (e: any) {
      Alert.alert('Could not connect', e.message ?? 'Unknown error');
      setConnecting(false);
    }
  };

  const confirmManualPair = async () => {
    const rawHost = manualHost.trim();
    const rawCode = code.trim();
    if (!rawHost) {
      Alert.alert('Please enter your Mac’s IP address');
      return;
    }
    if (rawCode.length !== 6) {
      Alert.alert('Enter the 6-digit code shown on your Mac');
      return;
    }

    let host = rawHost;
    let port = 8492;
    if (rawHost.includes(':')) {
      const parts = rawHost.split(':');
      host = parts[0];
      const parsedPort = parseInt(parts[1], 10);
      if (!isNaN(parsedPort) && parsedPort > 0) {
        port = parsedPort;
      }
    }

    setConnecting(true);
    try {
      const mac: MacHost = {name: 'Mac', host, port};
      const result = await ping(mac);
      const myDeviceName = getDeviceName();
      await pair(mac, rawCode, myDeviceName);
      const deviceName = result.deviceName || 'Mac';
      await savePairedMac({...mac, name: deviceName, token: rawCode});
      onPaired();
    } catch (e: any) {
      Alert.alert(
        'Could not connect',
        e.message ?? 'Check the IP address and code, and verify your Mac and phone are on the same Wi-Fi.',
      );
    } finally {
      setConnecting(false);
    }
  };

  // ── QR Scanner View ──
  if (mode === 'qr') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scan QR Code</Text>
        <Text style={styles.subtitle}>
          Open Boop on your Mac and click "Show QR Code" in the menu bar.
        </Text>

        {connecting ? (
          <View style={styles.scannerPlaceholder}>
            <ActivityIndicator color="#d2fa00" size="large" />
            <Text style={styles.connectingText}>Connecting…</Text>
          </View>
        ) : cameraReady ? (
          <View style={styles.scannerContainer}>
            <Camera
              style={styles.scanner}
              cameraType={CameraType.Back}
              scanBarcode={true}
              onReadCode={handleQRRead}
              showFrame={true}
              laserColor="#d2fa00"
              frameColor="#d2fa00"
            />
          </View>
        ) : (
          <View style={styles.scannerPlaceholder}>
            <ActivityIndicator color="#fff" />
          </View>
        )}

        <TouchableOpacity onPress={() => setMode('manual')}>
          <Text style={styles.backLink}>Connect manually instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Manual: IP + code entry ──
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect Manually</Text>
      <Text style={styles.subtitle}>
        Enter the IP address and 6-digit code shown on your Mac.
      </Text>

      <Text style={styles.fieldLabel}>Mac IP Address</Text>
      <TextInput
        style={styles.textInput}
        value={manualHost}
        onChangeText={setManualHost}
        placeholder="192.168.1.x or 192.168.1.x:8492"
        placeholderTextColor="#666"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>Pairing Code</Text>
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
        <ActivityIndicator style={{marginTop: 32}} color="#d2fa00" size="large" />
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={confirmManualPair}>
          <Text style={styles.primaryButtonText}>Connect</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => setMode('qr')}>
        <Text style={styles.backLink}>← Scan QR code instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#000', padding: 24, paddingTop: 60},
  title: {color: '#fff', fontSize: 24, fontWeight: '700'},
  subtitle: {color: '#999', fontSize: 14, marginTop: 8, marginBottom: 16},
  scannerContainer: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    aspectRatio: 1,
    width: '100%',
  },
  scanner: {
    flex: 1,
  },
  scannerPlaceholder: {
    marginTop: 24,
    aspectRatio: 1,
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingText: {color: '#d2fa00', marginTop: 12, fontSize: 16, fontWeight: '600'},
  fieldLabel: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  codeInput: {
    backgroundColor: '#161616',
    borderRadius: 8,
    color: '#fff',
    fontSize: 28,
    letterSpacing: 8,
    paddingVertical: 10,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButton: {
    marginTop: 32,
    backgroundColor: '#d2fa00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {color: '#000', fontWeight: '700', fontSize: 16},
  backLink: {color: '#666', textAlign: 'center', marginTop: 24, paddingVertical: 10},
});
