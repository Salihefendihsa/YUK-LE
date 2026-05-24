import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { QrDeliveryScannerProps } from './QrDeliveryScanner.web';

const Impl: ComponentType<QrDeliveryScannerProps> =
  Platform.OS === 'web'
    ? require('./QrDeliveryScanner.web').QrDeliveryScanner
    : require('./QrDeliveryScanner.native').QrDeliveryScanner;

export function QrDeliveryScanner(props: QrDeliveryScannerProps) {
  return <Impl {...props} />;
}
