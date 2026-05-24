import type { ComponentType } from 'react';
import { Platform } from 'react-native';
import type { DateTimePickerProps } from './DateTimePicker.types';

const Impl: ComponentType<DateTimePickerProps> =
  Platform.OS === 'web'
    ? require('./DateTimePicker.web').DateTimePicker
    : require('./DateTimePicker.native').DateTimePicker;

export function DateTimePicker(props: DateTimePickerProps) {
  return <Impl {...props} />;
}
