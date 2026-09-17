import {MacHost, RemoteApp} from '../types';

function baseUrl(mac: MacHost): string {
  return `http://${mac.host}:${mac.port}`;
}

export async function ping(mac: MacHost): Promise<{deviceName: string}> {
  const res = await fetch(`${baseUrl(mac)}/ping`);
  if (!res.ok) throw new Error('Mac did not respond to ping');
  return res.json();
}

export async function pair(
  mac: MacHost,
  token: string,
  deviceName: string,
): Promise<{status: string; macName: string}> {
  const res = await fetch(`${baseUrl(mac)}/pair`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dock-Token': token,
      'X-Device-Name': deviceName,
    },
    body: JSON.stringify({deviceName}),
  });
  if (res.status === 401) throw new Error('Pairing code incorrect or expired');
  if (!res.ok) throw new Error('Failed to pair with Mac');
  return res.json();
}

export async function heartbeat(
  mac: MacHost,
  token: string,
  deviceName: string,
): Promise<{status: string; paired: boolean}> {
  const res = await fetch(`${baseUrl(mac)}/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dock-Token': token,
      'X-Device-Name': deviceName,
    },
    body: JSON.stringify({deviceName}),
  });
  if (res.status === 401) throw new Error('Unpaired');
  if (!res.ok) throw new Error('Heartbeat failed');
  return res.json();
}

export async function unpair(mac: MacHost, token: string): Promise<void> {
  const res = await fetch(`${baseUrl(mac)}/unpair`, {
    method: 'POST',
    headers: {'X-Dock-Token': token},
  });
  if (!res.ok && res.status !== 401) {
    throw new Error('Failed to unpair');
  }
}

export async function fetchApps(
  mac: MacHost,
  token: string,
  deviceName?: string,
): Promise<RemoteApp[]> {
  const headers: Record<string, string> = {'X-Dock-Token': token};
  if (deviceName) headers['X-Device-Name'] = deviceName;

  const res = await fetch(`${baseUrl(mac)}/apps`, {headers});
  if (res.status === 401) throw new Error('Pairing code incorrect or expired');
  if (!res.ok) throw new Error('Failed to fetch app list');
  return res.json();
}

export function iconUrl(mac: MacHost, appPath: string): string {
  return `${baseUrl(mac)}/icon?path=${encodeURIComponent(appPath)}`;
}

export async function launchApp(
  mac: MacHost,
  token: string,
  appPath: string,
  deviceName?: string,
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Dock-Token': token,
  };
  if (deviceName) headers['X-Device-Name'] = deviceName;

  const res = await fetch(`${baseUrl(mac)}/launch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({path: appPath}),
  });
  if (res.status === 401) throw new Error('Pairing code incorrect or expired');
  if (!res.ok) throw new Error('Failed to launch app');
}
