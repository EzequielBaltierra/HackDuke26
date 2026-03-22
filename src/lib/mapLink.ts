import { Linking, Platform } from 'react-native';

export function openInMaps(name: string, lat: number, lng: number) {
  const encodedName = encodeURIComponent(name);
  const primary = Platform.select({
    ios: `maps:?q=${encodedName}&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}(${encodedName})`,
    default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  })!;

  Linking.openURL(primary).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  });
}
