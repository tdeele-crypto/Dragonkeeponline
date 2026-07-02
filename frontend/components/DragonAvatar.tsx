import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/colors';

interface DragonAvatarProps {
  photoBase64?: string | null;
  size?: number;
}

export default function DragonAvatar({ photoBase64, size = 56 }: DragonAvatarProps) {
  const dimStyle = { width: size, height: size, borderRadius: size / 2 };
  if (photoBase64) {
    return <Image source={{ uri: photoBase64 }} style={[styles.image, dimStyle]} testID="dragon-avatar-image" />;
  }
  return (
    <View style={[styles.placeholder, dimStyle]} testID="dragon-avatar-placeholder">
      <Ionicons name="paw" size={size * 0.45} color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: COLORS.borderLight,
  },
  placeholder: {
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
