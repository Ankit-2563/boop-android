import {MacHost} from '../types';

function baseUrl(mac: MacHost): string {
  return `http://${mac.host}:${mac.port}`;
}

export async function ping(mac: MacHost): Promise<{deviceName: string}> {
  const res = await fetch(`${baseUrl(mac)}/ping`);
  if (!res.ok) throw new Error('Mac did not respond to ping');
  return res.json();
}
