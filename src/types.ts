export interface MacHost {
  name: string;
  host: string; // IP address
  port: number;
}

export interface PairedMac extends MacHost {
  token: string;
}

export interface RemoteApp {
  name: string;
  path: string;
  bundleId: string;
}

export interface DockItem extends RemoteApp {
  addedAt: number;
}
