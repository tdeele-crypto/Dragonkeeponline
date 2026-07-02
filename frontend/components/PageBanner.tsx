import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { useAdminSettings } from '@/context/AdminSettingsContext';

export default function PageBanner() {
  const { bannerImage, bannerText } = useAdminSettings();

  if (!bannerImage) return null;

  return (
    <ImageBackground
      source={{ uri: bannerImage }}
      style={styles.banner}
      resizeMode="cover"
      testID="page-banner"
    >
      {!!bannerText && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText} testID="page-banner-text">
            {bannerText}
          </Text>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
