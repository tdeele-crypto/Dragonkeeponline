import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { COLORS } from '@/constants/colors';
import { formatDateISO } from '@/constants/data';
import { api } from '@/utils/api';
import { useConfirm, useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import PageBanner from '@/components/PageBanner';

const SWATCH_COLORS = [
  '#E07A5F',
  '#81B29A',
  '#3D405B',
  '#F2CC8F',
  '#5B8FB9',
  '#8E7DBE',
  '#D64545',
  '#1C1917',
  '#78716C',
  '#FFFFFF',
];

export default function AdminScreen() {
  const showToast = useToast();
  const showConfirm = useConfirm();
  const { bannerImage, bannerText, bannerBgColor, headingColor, refresh } = useAdminSettings();

  const [localImage, setLocalImage] = useState<string | null>(null);
  const [localText, setLocalText] = useState('');
  const [localBgColor, setLocalBgColor] = useState<string | null>(null);
  const [localHeadingColor, setLocalHeadingColor] = useState<string | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    setLocalImage(bannerImage);
    setLocalText(bannerText);
    setLocalBgColor(bannerBgColor);
    setLocalHeadingColor(headingColor);
  }, [bannerImage, bannerText, bannerBgColor, headingColor]);

  const pickBannerImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Tilladelse er nødvendig for at vælge billede', 'error');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      setLocalImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSaveBanner = async () => {
    setSavingBanner(true);
    try {
      await api.put('/admin/settings', {
        banner_image_base64: localImage,
        banner_text: localText.trim() || null,
        banner_bg_color: localBgColor,
        heading_color: localHeadingColor,
      });
      await refresh();
      showToast('Banner gemt', 'success');
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke gemme banner', 'error');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleRemoveBannerImage = () => {
    setLocalImage(null);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.get('/admin/export');
      const json = JSON.stringify(data, null, 2);
      const fileName = `skaegagame-backup-${formatDateISO(new Date())}.json`;
      const file = new File(Paths.document, fileName);
      await file.write(json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, { mimeType: 'application/json' });
      } else {
        showToast('Database eksporteret', 'success');
      }
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke eksportere database', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const file = new File(result.assets[0].uri);
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.dragons || !data.task_items) {
        showToast('Ugyldig backup-fil', 'error');
        return;
      }

      showConfirm({
        title: 'Importer database?',
        message: 'Dette overskriver ALLE nuværende agamer, opgaver og ugeplaner med indholdet af filen. Kan ikke fortrydes.',
        confirmLabel: 'Importer og overskriv',
        destructive: true,
        onConfirm: async () => {
          setImporting(true);
          try {
            await api.post('/admin/import', data);
            await refresh();
            showToast('Database importeret', 'success');
          } catch (e: any) {
            showToast(e.message || 'Kunne ikke importere database', 'error');
          } finally {
            setImporting(false);
          }
        },
      });
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke læse filen', 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <PageBanner />
      <View style={styles.header}>
        <Text style={styles.title}>Admin</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database</Text>
          <Text style={styles.sectionSubtitle}>
            Eksporter alle dine data til en fil, som du kan gemme og importere igen ved skift til en ny enhed.
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, styles.exportBtn]}
            onPress={handleExport}
            disabled={exporting}
            testID="admin-export-button"
          >
            {exporting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="download-outline" size={18} color={COLORS.white} />
                <Text style={styles.actionBtnText}>Eksporter database</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.importBtn]}
            onPress={handleImport}
            disabled={importing}
            testID="admin-import-button"
          >
            {importing ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color={COLORS.primary} />
                <Text style={styles.importBtnText}>Importer database</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banner</Text>
          <Text style={styles.sectionSubtitle}>
            Vælg et billede der vises som banner i toppen af alle sider, og en valgfri tekst der lægges over billedet.
          </Text>

          <TouchableOpacity style={styles.bannerPreview} onPress={pickBannerImage} testID="admin-banner-picker">
            {localImage ? (
              <Image source={{ uri: localImage }} style={styles.bannerPreviewImage} />
            ) : (
              <View style={[styles.bannerPlaceholder, localBgColor ? { backgroundColor: localBgColor, borderStyle: 'solid' } : null]}>
                <Ionicons name="image-outline" size={26} color={localBgColor ? COLORS.white : COLORS.textMuted} />
                <Text style={[styles.bannerPlaceholderText, localBgColor ? { color: COLORS.white } : null]}>Vælg banner-billede</Text>
              </View>
            )}
            {!!localText && (
              <View style={styles.bannerPreviewOverlay}>
                <Text style={[styles.bannerPreviewOverlayText, localHeadingColor ? { color: localHeadingColor } : null]} numberOfLines={1}>
                  {localText}
                </Text>
              </View>
            )}
            <View style={styles.bannerEditBadge}>
              <Ionicons name="pencil" size={13} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          {localImage && (
            <TouchableOpacity onPress={handleRemoveBannerImage} testID="admin-banner-remove-button">
              <Text style={styles.removeText}>Fjern billede</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Bannertekst (valgfri)</Text>
          <TextInput
            style={styles.input}
            value={localText}
            onChangeText={setLocalText}
            placeholder="F.eks. Velkommen til vores skægagamer"
            placeholderTextColor={COLORS.textMuted}
            testID="admin-banner-text-input"
          />

          <Text style={styles.label}>Baggrundsfarve (kun når intet billede er valgt)</Text>
          <View style={styles.swatchRow}>
            <TouchableOpacity
              style={[
                styles.swatchNone,
                !localBgColor && styles.swatchSelected,
              ]}
              onPress={() => setLocalBgColor(null)}
              testID="admin-bg-color-none"
            >
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            {SWATCH_COLORS.map((color) => (
              <TouchableOpacity
                key={`bg-${color}`}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  localBgColor === color && styles.swatchSelected,
                ]}
                onPress={() => setLocalBgColor(color)}
                testID={`admin-bg-color-${color}`}
              >
                {localBgColor === color && (
                  <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' ? COLORS.textPrimary : COLORS.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Overskriftsfarve</Text>
          <View style={styles.swatchRow}>
            <TouchableOpacity
              style={[
                styles.swatchNone,
                !localHeadingColor && styles.swatchSelected,
              ]}
              onPress={() => setLocalHeadingColor(null)}
              testID="admin-heading-color-none"
            >
              <Ionicons name="close" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
            {SWATCH_COLORS.map((color) => (
              <TouchableOpacity
                key={`heading-${color}`}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  localHeadingColor === color && styles.swatchSelected,
                ]}
                onPress={() => setLocalHeadingColor(color)}
                testID={`admin-heading-color-${color}`}
              >
                {localHeadingColor === color && (
                  <Ionicons name="checkmark" size={16} color={color === '#FFFFFF' ? COLORS.textPrimary : COLORS.white} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingBanner && styles.saveBtnDisabled]}
            onPress={handleSaveBanner}
            disabled={savingBanner}
            testID="admin-banner-save-button"
          >
            {savingBanner ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Gem banner</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: 14,
    marginBottom: 10,
  },
  exportBtn: {
    backgroundColor: COLORS.primary,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  importBtn: {
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  importBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: 15,
  },
  bannerPreview: {
    position: 'relative',
    marginBottom: 8,
  },
  bannerPreviewImage: {
    width: '100%',
    aspectRatio: 4,
    borderRadius: 16,
  },
  bannerPlaceholder: {
    width: '100%',
    aspectRatio: 4,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  bannerPlaceholderText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  bannerPreviewOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bannerPreviewOverlayText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
  bannerEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 16,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  swatchNone: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.textPrimary,
    minHeight: 50,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
});
