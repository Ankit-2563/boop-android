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
  ScrollView,
  useWindowDimensions,
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

  const {width, height} = useWindowDimensions();

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
      Alert.alert('Connection failed', e.message ?? 'Could not pair with Mac.');
    } finally {
      setConnecting(false);
    }
  };

  const confirmManualPair = async () => {
    const trimmedHost = manualHost.trim();
    const rawCode = code.trim();

    if (!trimmedHost) {
      Alert.alert('IP required', 'Enter the IP address shown on your Mac.');
      return;
    }
    if (rawCode.length !== 6) {
      Alert.alert('Invalid code', 'Enter the 6-digit code shown on your Mac.');
      return;
    }

    let host = trimmedHost;
    let port = 8492;
    if (trimmedHost.includes(':')) {
      const [h, p] = trimmedHost.split(':');
      host = h;
      const parsedPort = parseInt(p, 10);
      if (!isNaN(parsedPort)) {
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

  const isLandscape = width > height;
  const scannerSize = Math.min(height - 48, 280);

  // ── QR Scanner View ──
  if (mode === 'qr') {
    return (
      <View style={styles.container}>
        <View style={isLandscape ? styles.landscapeRow : styles.portraitCol}>
          <View style={isLandscape ? styles.landscapeInfo : styles.portraitInfo}>
            <Text style={styles.title}>Scan QR Code</Text>
            <Text style={styles.subtitle}>
              Open Boop on your Mac and click "Show QR Code" in the menu bar.
            </Text>

            <TouchableOpacity
              style={styles.switchButton}
              activeOpacity={0.7}
              onPress={() => setMode('manual')}>
              <Text style={styles.switchButtonText}>Connect manually instead</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.scannerWrapper, {width: scannerSize, height: scannerSize}]}>
            {connecting ? (
              <View style={styles.scannerPlaceholder}>
                <ActivityIndicator color="#ffffff" size="large" />
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
                  laserColor="#ffffff"
                  frameColor="#ffffff"
                />
              </View>
            ) : (
              <View style={styles.scannerPlaceholder}>
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ── Manual: IP + code entry ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.manualScroll}>
      <View style={styles.manualCard}>
        <Text style={styles.title}>Connect Manually</Text>
        <Text style={styles.subtitle}>
          Enter the IP address and 6-digit code shown on your Mac.
        </Text>

        <View style={styles.inputRow}>
          <View style={{flex: 2}}>
            <Text style={styles.fieldLabel}>Mac IP Address</Text>
            <TextInput
              style={styles.textInput}
              value={manualHost}
              onChangeText={setManualHost}
              placeholder="192.168.1.x or 192.168.1.x:8492"
              placeholderTextColor="#555555"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="numeric"
            />
          </View>

          <View style={{flex: 1, marginLeft: 16}}>
            <Text style={styles.fieldLabel}>Pairing Code</Text>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="000000"
              placeholderTextColor="#555555"
            />
          </View>
        </View>

        {connecting ? (
          <ActivityIndicator style={{marginTop: 20}} color="#ffffff" size="small" />
        ) : (
          <View style={styles.manualActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.7}
              onPress={confirmManualPair}>
              <Text style={styles.primaryButtonText}>Connect</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchButton}
              activeOpacity={0.7}
              onPress={() => setMode('qr')}>
              <Text style={styles.switchButtonText}>← Scan QR code instead</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  landscapeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  portraitCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  landscapeInfo: {
    flex: 1,
    paddingRight: 32,
    justifyContent: 'center',
  },
  portraitInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#8e8e93',
    fontSize: 13,
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  scannerWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111113',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scannerContainer: {
    flex: 1,
  },
  scanner: {
    flex: 1,
  },
  scannerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  switchButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  switchButtonText: {
    color: '#f5f5f7',
    fontSize: 12,
    fontWeight: '500',
  },
  manualScroll: {
    paddingVertical: 10,
    justifyContent: 'center',
  },
  manualCard: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  fieldLabel: {
    color: '#8e8e93',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#141416',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  codeInput: {
    backgroundColor: '#141416',
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 20,
    letterSpacing: 4,
    paddingVertical: 7,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  manualActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 13,
  },
});
