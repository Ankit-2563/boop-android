import {parseBoopURI} from '../pairing';

describe('parseBoopURI', () => {
  it('parses valid boop URI with standard port and token', () => {
    const result = parseBoopURI('boop://192.168.1.50:8492?token=123456');
    expect(result).toEqual({
      host: '192.168.1.50',
      port: 8492,
      token: '123456',
    });
  });

  it('returns null for non-boop scheme', () => {
    expect(parseBoopURI('http://192.168.1.50:8492?token=123456')).toBeNull();
    expect(parseBoopURI('https://example.com')).toBeNull();
    expect(parseBoopURI('')).toBeNull();
  });

  it('returns null for missing token', () => {
    expect(parseBoopURI('boop://192.168.1.50:8492')).toBeNull();
    expect(parseBoopURI('boop://192.168.1.50:8492?token=')).toBeNull();
  });

  it('returns null for invalid port', () => {
    expect(parseBoopURI('boop://192.168.1.50:abc?token=123456')).toBeNull();
    expect(parseBoopURI('boop://192.168.1.50:0?token=123456')).toBeNull();
  });
});
