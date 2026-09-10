import {MacHost, RemoteApp} from '../types';

function baseUrl(mac: MacHost): string {
  return `http://${mac.host}:${mac.port}`;
}

export async function ping(mac: MacHost): Promise<{deviceName: string}> {
  const res = await fetch(`${baseUrl(mac)}/ping`);
  if (!res.ok) throw new Error('Mac did not respond to ping');
  return res.json();
}

export async function fetchApps(mac: MacHost, token: string): Promise<RemoteApp[]> {
  const res = await fetch(`${baseUrl(mac)}/apps`, {
    headers: {'X-Dock-Token': token},
  });
  if (res.status === 401) throw new Error('Pairing code incorrect or expired');
  if (!res.ok) throw new Error('Failed to fetch app list');
  return res.json();
}

export function iconUrl(mac: MacHost, appPath: string): string {
  return `${baseUrl(mac)}/icon?path=${encodeURIComponent(appPath)}`;
}

export async function launchApp(mac: MacHost, token: string, appPath: string): Promise<void> {
  const res = await fetch(`${baseUrl(mac)}/launch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dock-Token': token,
    },
    body: JSON.stringify({path: appPath}),
  });
  if (res.status === 401) throw new Error('Pairing code incorrect or expired');
  if (!res.ok) throw new Error('Failed to launch app');
}
