export interface MacHost {
  name: string;
  host: string;
  port: number;
}

export interface PairedMac extends MacHost {
  token: string;
}
