import React from 'react';
import { View, Text } from 'react-native';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#050608',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#FF6B00', fontSize: 48, fontWeight: 'bold' }}>
        YÜK-LE
      </Text>
      <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 16 }}>
        Bağlantı çalışıyor!
      </Text>
    </View>
  );
}
