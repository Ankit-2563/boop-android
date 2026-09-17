import {Platform} from 'react-native';

export function getDeviceName(): string {
  if (Platform.OS === 'android') {
    const constants = Platform.constants as {
      Brand?: string;
      Manufacturer?: string;
      Model?: string;
    };
    const brand = constants?.Brand || constants?.Manufacturer || '';
    const model = constants?.Model || 'Android Device';
    if (!brand) return model;
    const formattedBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
    if (model.toLowerCase().startsWith(brand.toLowerCase())) {
      return model;
    }
    return `${formattedBrand} ${model}`;
  }
  if (Platform.OS === 'ios') {
    return 'iPhone';
  }
  return 'Mobile Device';
}
