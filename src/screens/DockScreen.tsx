import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  AppState,
  AppStateStatus,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {launchApp, iconUrl, heartbeat, unpair} from '../services/api';
import {getDockItems, removeDockItem, clearPairedMac} from '../services/storage';
import {DockItem, PairedMac} from '../types';
import {getDeviceName} from '../utils/device';

const APPS_PER_PAGE = 8; // 2 rows × 4 columns

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
  const [activePage, setActivePage] = useState(0);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const {width, height} = useWindowDimensions();

  // Responsive icon sizing: slightly larger on taller viewports
  const iconSize = height < 380 ? 74 : 82;
  const numColumns = 4;
  const cellWidth = Math.floor((width - 48) / numColumns);

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

  // Split apps into pages of 8 (2 rows × 4 columns)
  const pages = useMemo(() => {
    const chunked: DockItem[][] = [];
    for (let i = 0; i < items.length; i += APPS_PER_PAGE) {
      chunked.push(items.slice(i, i + APPS_PER_PAGE));
    }
    return chunked;
  }, [items]);

  // Keep activePage in range if items are removed
  useEffect(() => {
    if (activePage >= pages.length && pages.length > 0) {
      setActivePage(pages.length - 1);
      flatListRef.current?.scrollToIndex({index: pages.length - 1, animated: true});
    }
  }, [pages.length, activePage]);

  return (
    <View style={styles.container}>
      {/* Minimal Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Dock</Text>
          <View style={styles.titleDivider} />
          <View style={styles.statusBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.macName} numberOfLines={1}>
              {mac.name}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onAddApps}
            style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>+ Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleUnpair}
            style={[styles.actionBtn, styles.unpairBtn]}>
            <Text style={styles.unpairBtnText}>Unpair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content: Empty State or Paged Grid */}
      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No apps in dock</Text>
          <Text style={styles.emptySubtitle}>Tap "+ Add" to choose apps from your Mac</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onAddApps}
            style={styles.emptyAddBtn}>
            <Text style={styles.emptyAddBtnText}>+ Add Apps</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <FlatList
            ref={flatListRef}
            data={pages}
            keyExtractor={(_, index) => `dock-page-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width}
            snapToAlignment="start"
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onMomentumScrollEnd={e => {
              const offset = e.nativeEvent.contentOffset.x;
              const pageIdx = Math.round(offset / width);
              setActivePage(pageIdx);
            }}
            renderItem={({item: pageItems}) => (
              <View style={[styles.page, {width}]}>
                <View style={styles.grid}>
                  {pageItems.map((item: DockItem) => {
                    const isLaunching = launchingPath === item.path;
                    return (
                      <View key={item.path} style={[styles.cell, {width: cellWidth}]}>
                        <TouchableOpacity
                          activeOpacity={0.6}
                          style={styles.cellButton}
                          onPress={() => handleLaunch(item)}
                          onLongPress={() => handleRemove(item)}
                          disabled={isLaunching}>
                          <View
                            style={[
                              styles.iconWrapper,
                              {width: iconSize, height: iconSize, borderRadius: Math.round(iconSize * 0.24)},
                              isLaunching && styles.iconLaunching,
                            ]}>
                            <Image
                              source={{
                                uri: iconUrl(mac, item.path),
                                headers: {'X-Dock-Token': mac.token},
                              }}
                              style={[
                                styles.icon,
                                {width: iconSize, height: iconSize, borderRadius: Math.round(iconSize * 0.24)},
                              ]}
                              resizeMode="contain"
                            />
                            {isLaunching && (
                              <View style={styles.launchingOverlay}>
                                <ActivityIndicator size="small" color="#ffffff" />
                              </View>
                            )}
                          </View>
                          <Text
                            style={[styles.label, {maxWidth: cellWidth - 8}]}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {item.name}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          />

          {/* Minimal Pagination Indicator Dots */}
          {pages.length > 1 && (
            <View style={styles.pagination}>
              {pages.map((_, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => flatListRef.current?.scrollToIndex({index: idx, animated: true})}
                  hitSlop={{top: 10, bottom: 10, left: 6, right: 6}}>
                  <View
                    style={[
                      styles.dot,
                      idx === activePage ? styles.dotActive : styles.dotInactive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 8,
    height: 44,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  titleDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#333333',
    marginHorizontal: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30d158',
    marginRight: 6,
  },
  macName: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 220,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnText: {
    color: '#f5f5f7',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  unpairBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  unpairBtnText: {
    color: '#8e8e93',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cellButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    backgroundColor: '#161618',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  icon: {
    backgroundColor: 'transparent',
  },
  iconLaunching: {
    opacity: 0.5,
  },
  launchingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#d1d1d6',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#ffffff',
  },
  dotInactive: {
    width: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: '#f5f5f7',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#636366',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyAddBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
