export interface ParsedPairingURI {
  host: string;
  port: number;
  token: string;
}

/**
 * Parses a boop:// pairing URI into its host, port, and token components.
 * Expected format: boop://<HOST>:<PORT>?token=<TOKEN>
 *
 * @param uri Raw QR code string or URI
 * @returns Parsed host, port, and token or null if malformed
 */
export function parseBoopURI(uri: string): ParsedPairingURI | null {
  try {
    if (!uri || !uri.startsWith('boop://')) {
      return null;
    }
    const withoutScheme = uri.slice(7); // remove "boop://"
    const [hostPort, queryString] = withoutScheme.split('?');
    if (!hostPort) return null;

    const [host, portStr] = hostPort.split(':');
    const port = parseInt(portStr, 10);
    if (!host || isNaN(port) || port <= 0) {
      return null;
    }

    if (!queryString) return null;
    const params = new URLSearchParams(queryString);
    const token = params.get('token');
    if (!token || token.trim().length === 0) {
      return null;
    }

    return {host, port, token: token.trim()};
  } catch {
    return null;
  }
}
