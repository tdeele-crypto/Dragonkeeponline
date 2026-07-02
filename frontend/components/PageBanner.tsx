import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';
import { useAdminSettings } from '@/context/AdminSettingsContext';

export default function PageBanner() {
  const { bannerImage, bannerText, bannerBgColor, headingColor } = useAdminSettings();

  if (!bannerImage && !bannerBgColor && !bannerText) return null;

  const titleColor = headingColor || '#FFFFFF';

  if (bannerImage) {
    return (
      <ImageBackground
        source={{ uri: bannerImage }}
        style={styles.banner}
        resizeMode="cover"
        testID="page-banner"
      >
        {!!bannerText && (
          <View style={styles.overlay}>
            <Text style={[styles.overlayText, { color: titleColor }]} testID="page-banner-text">
              {bannerText}
            </Text>
          </View>
        )}
      </ImageBackground>
    );
  }

  return (
    <View
      style={[styles.banner, { backgroundColor: bannerBgColor || COLORS.primary, justifyContent: 'center' }]}
      testID="page-banner"
    >
      {!!bannerText && (
        <Text style={[styles.overlayText, styles.overlayTextCentered, { color: titleColor }]} testID="page-banner-text">
          {bannerText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    aspectRatio: 4,
    justifyContent: 'flex-end',
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.32)',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  overlayText: {
    fontSize: 16,
    fontWeight: '800',
  },
  overlayTextCentered: {
    paddingHorizontal: 20,
    textAlign: 'center',
  },
});
