import Zeroconf from 'react-native-zeroconf';
import {MacHost} from '../types';

const zeroconf = new Zeroconf();
const SERVICE_TYPE = 'boop';
const SERVICE_PROTOCOL = 'tcp';

type ResolvedListener = (host: MacHost) => void;

export function startDiscovery(onFound: ResolvedListener, onError?: (e: Error) => void) {
  zeroconf.removeAllListeners();

  zeroconf.on('resolved', service => {
    if (!service.addresses || service.addresses.length === 0) return;
    onFound({
      name: service.name,
      host: service.addresses[0],
      port: service.port,
    });
  });

  zeroconf.on('error', (err: Error) => {
    onError?.(err);
  });

  zeroconf.scan(SERVICE_TYPE, SERVICE_PROTOCOL, 'local.');
}

export function stopDiscovery() {
  zeroconf.stop();
  zeroconf.removeAllListeners();
}
