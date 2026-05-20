import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import type { PickedDocumentFile } from '../types/document';

export async function pickDocumentImage(): Promise<PickedDocumentFile | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      throw new Error('Galeri izni verilmedi.');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const uri = asset.uri;
  const name = asset.fileName ?? `belge-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? 'image/jpeg';

  return { uri, name, mimeType };
}
