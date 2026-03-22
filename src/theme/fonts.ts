import {
  CrimsonText_400Regular,
  CrimsonText_600SemiBold,
  CrimsonText_700Bold,
} from '@expo-google-fonts/crimson-text';
import { Faustina_600SemiBold } from '@expo-google-fonts/faustina';
import { useFonts } from 'expo-font';

/** Load design fonts before rendering app UI */
export function useRootFonts() {
  return useFonts({
    Faustina_600SemiBold,
    CrimsonText_400Regular,
    CrimsonText_600SemiBold,
    CrimsonText_700Bold,
  });
}
