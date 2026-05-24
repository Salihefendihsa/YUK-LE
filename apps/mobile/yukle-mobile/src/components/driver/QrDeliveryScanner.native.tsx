import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../../theme/colors';
import { fontFamily, typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

import type { QrDeliveryScannerProps } from './QrDeliveryScanner.web';

export function QrDeliveryScanner({ onScan, disabled }: QrDeliveryScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <Text style={styles.hint}>Kamera izni kontrol ediliyor…</Text>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permBox}>
        <Text style={styles.hint}>Teslimat QR okutmak için kamera izni gerekir.</Text>
        <Pressable
          style={styles.permBtn}
          onPress={() => void requestPermission()}
          disabled={disabled}
        >
          <Text style={styles.permBtnText}>İzin Ver</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          scanned || disabled
            ? undefined
            : ({ data }) => {
                const token = data?.trim();
                if (!token) return;
                setScanned(true);
                onScan(token);
              }
        }
      />
      <Text style={styles.hint}>QR kodu çerçeve içine hizalayın</Text>
      {scanned ? (
        <Pressable style={styles.rescan} onPress={() => setScanned(false)}>
          <Text style={styles.rescanText}>Tekrar okut</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing[2] },
  camera: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.brandBorder,
  },
  hint: { ...typography.caption, textTransform: 'none', textAlign: 'center', color: palette.textMuted },
  permBox: { gap: spacing[3], alignItems: 'center', padding: spacing[3] },
  permBtn: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 8,
    backgroundColor: palette.brand,
  },
  permBtnText: { fontFamily: fontFamily.semiBold, fontSize: 14, color: '#fff' },
  rescan: { alignSelf: 'center' },
  rescanText: { fontFamily: fontFamily.semiBold, fontSize: 13, color: palette.brand },
});
