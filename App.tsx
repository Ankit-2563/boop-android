import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet} from 'react-native';
import {getPairedMac} from './src/services/storage';
import {PairedMac} from './src/types';
import PairScreen from './src/screens/PairScreen';
import DockScreen from './src/screens/DockScreen';
import AddAppsScreen from './src/screens/AddAppsScreen';

type Screen = 'loading' | 'pair' | 'dock' | 'addApps';

export default function App() {
  const [screen, setScreen] = useState<Screen>('loading');
  const [mac, setMac] = useState<PairedMac | null>(null);

  useEffect(() => {
    (async () => {
      const paired = await getPairedMac();
      if (paired) {
        setMac(paired);
        setScreen('dock');
      } else {
        setScreen('pair');
      }
    })();
  }, []);

  if (screen === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  if (screen === 'pair' || !mac) {
    return (
      <PairScreen
        onPaired={async () => {
          const paired = await getPairedMac();
          setMac(paired);
          setScreen('dock');
        }}
      />
    );
  }

  if (screen === 'addApps') {
    return <AddAppsScreen mac={mac} onDone={() => setScreen('dock')} />;
  }

  return <DockScreen mac={mac} onAddApps={() => setScreen('addApps')} />;
}

const styles = StyleSheet.create({
  loading: {flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center'},
});
