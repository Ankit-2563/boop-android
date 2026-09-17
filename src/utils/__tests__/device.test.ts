jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    constants: {
      Brand: 'google',
      Model: 'Pixel 8 Pro',
    },
  },
}));

import {Platform} from 'react-native';
import {getDeviceName} from '../device';

describe('getDeviceName', () => {
  const originalPlatform = Platform.OS;
  const originalConstants = Platform.constants;

  afterEach(() => {
    Platform.OS = originalPlatform;
    (Platform as any).constants = originalConstants;
  });

  it('formats Android Brand and Model properly', () => {
    Platform.OS = 'android';
    (Platform as any).constants = {
      Brand: 'google',
      Model: 'Pixel 8 Pro',
    };
    expect(getDeviceName()).toBe('Google Pixel 8 Pro');
  });

  it('avoids repeating brand if model already starts with brand', () => {
    Platform.OS = 'android';
    (Platform as any).constants = {
      Brand: 'google',
      Model: 'Google Pixel 8',
    };
    expect(getDeviceName()).toBe('Google Pixel 8');
  });

  it('falls back to iPhone on iOS', () => {
    Platform.OS = 'ios';
    expect(getDeviceName()).toBe('iPhone');
  });
});
