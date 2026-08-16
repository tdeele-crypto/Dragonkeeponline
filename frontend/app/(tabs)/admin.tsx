import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/colors';
import { api } from '@/utils/api';
import { useConfirm, useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import { useAuth } from '@/context/AuthContext';
import type { Language, WeightUnit, TimeFormat } from '@/i18n/translations';
import PageBanner from '@/components/PageBanner';
import PickerField from '@/components/PickerField';
import WebDateInput from '@/components/WebDateInput';
import { buildGuidePdfHtml } from '@/utils/guidePdf';

function monthDayToDate(mmdd: string): Date {
  const [m, d] = (mmdd || '03-01').split('-').map((n) => parseInt(n, 10));
  const dt = new Date();
  dt.setMonth((Number.isFinite(m) ? m : 1) - 1, Number.isFinite(d) ? d : 1);
  dt.setHours(12, 0, 0, 0);
  return dt;
}

function dateToMonthDay(dt: Date): string {
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

function formatDayMonth(dt: Date): string {
  const d = String(dt.getDate()).padStart(2, '0');
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  return `${d}-${m}`;
}

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
  const router = useRouter();
  const {
    bannerImage,
    bannerText,
    bannerBgColor,
    headingColor,
    appBgColor,
    pageTitleColor,
    language,
    weightUnit,
    timeFormat,
    lightSummerStart,
    lightWinterStart,
    t,
    refresh,
  } = useAdminSettings();

  const [localImage, setLocalImage] = useState<string | null>(null);
  const [localText, setLocalText] = useState('');
  const [localBgColor, setLocalBgColor] = useState<string | null>(null);
  const [localHeadingColor, setLocalHeadingColor] = useState<string | null>(null);
  const [savingBanner, setSavingBanner] = useState(false);
  const [generatingGuide, setGeneratingGuide] = useState(false);

  const { user, logout } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [invites, setInvites] = useState<{ id: string; email: string; code: string; accepted: boolean }[]>([]);
  const [members, setMembers] = useState<{ id: string; email: string; display_name: string | null; is_me: boolean }[]>([]);

  const [localAppBgColor, setLocalAppBgColor] = useState<string | null>(null);
  const [localPageTitleColor, setLocalPageTitleColor] = useState<string | null>(null);
  const [savingAppearance, setSavingAppearance] = useState(false);

  const [localLanguage, setLocalLanguage] = useState<Language>('en');
  const [localWeightUnit, setLocalWeightUnit] = useState<WeightUnit>('g');
  const [localTimeFormat, setLocalTimeFormat] = useState<TimeFormat>('12h');
  const [savingLang, setSavingLang] = useState(false);

  const [summerDate, setSummerDate] = useState<Date>(() => monthDayToDate('03-01'));
  const [winterDate, setWinterDate] = useState<Date>(() => monthDayToDate('09-01'));
  const [showSummerPicker, setShowSummerPicker] = useState(false);
  const [showWinterPicker, setShowWinterPicker] = useState(false);
  const [savingSeason, setSavingSeason] = useState(false);

  const [careplanModalVisible, setCareplanModalVisible] = useState(false);
  const [careplanConfirmInput, setCareplanConfirmInput] = useState('');
  const [resettingCareplan, setResettingCareplan] = useState(false);

  useEffect(() => {
    setLocalImage(bannerImage);
    setLocalText(bannerText);
    setLocalBgColor(bannerBgColor);
    setLocalHeadingColor(headingColor);
  }, [bannerImage, bannerText, bannerBgColor, headingColor]);

  useEffect(() => {
    setLocalAppBgColor(appBgColor);
    setLocalPageTitleColor(pageTitleColor);
  }, [appBgColor, pageTitleColor]);

  useEffect(() => {
    setLocalLanguage(language);
    setLocalWeightUnit(weightUnit);
    setLocalTimeFormat(timeFormat);
  }, [language, weightUnit, timeFormat]);

  useEffect(() => {
    setSummerDate(monthDayToDate(lightSummerStart));
    setWinterDate(monthDayToDate(lightWinterStart));
  }, [lightSummerStart, lightWinterStart]);

  const saveSeasonSetting = async (payload: Record<string, string | number>) => {
    setSavingSeason(true);
    try {
      await api.put('/admin/settings', payload);
      await refresh();
      showToast(t('admin.seasonUpdateSuccess'), 'success');
    } catch (e: any) {
      showToast(e.message || t('admin.seasonUpdateError'), 'error');
    } finally {
      setSavingSeason(false);
    }
  };

  const onSummerDateChange = (event: any, selectedDate?: Date) => {
    setShowSummerPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !selectedDate) return;
    setSummerDate(selectedDate);
    saveSeasonSetting({ light_summer_start: dateToMonthDay(selectedDate) });
  };

  const onWinterDateChange = (event: any, selectedDate?: Date) => {
    setShowWinterPicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !selectedDate) return;
    setWinterDate(selectedDate);
    saveSeasonSetting({ light_winter_start: dateToMonthDay(selectedDate) });
  };

  const pickBannerImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(t('admin.bannerPermissionError'), 'error');
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
      showToast(t('admin.bannerSaveSuccess'), 'success');
    } catch (e: any) {
      showToast(e.message || t('admin.bannerSaveError'), 'error');
    } finally {
      setSavingBanner(false);
    }
  };

  const handleRemoveBannerImage = () => {
    setLocalImage(null);
  };

  const handleSaveAppearance = async () => {
    setSavingAppearance(true);
    try {
      await api.put('/admin/settings', {
        app_bg_color: localAppBgColor,
        page_title_color: localPageTitleColor,
      });
      await refresh();
      showToast(t('admin.appearanceSaveSuccess'), 'success');
    } catch (e: any) {
      showToast(e.message || t('admin.appearanceSaveError'), 'error');
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleSaveLangSettings = async () => {
    setSavingLang(true);
    try {
      await api.put('/admin/settings', {
        language: localLanguage,
        weight_unit: localWeightUnit,
        time_format: localTimeFormat,
      });
      await refresh();
      showToast(t('admin.langSaveSuccess'), 'success');
    } catch (e: any) {
      showToast(e.message || t('admin.langSaveError'), 'error');
    } finally {
      setSavingLang(false);
    }
  };

  const careplanConfirmWord = t('admin.careplanConfirmWord');

  const openCareplanModal = () => {
    setCareplanConfirmInput('');
    setCareplanModalVisible(true);
  };

  const handleConfirmResetCareplan = async () => {
    if (careplanConfirmInput.trim().toUpperCase() !== careplanConfirmWord.toUpperCase()) {
      showToast(t('admin.careplanConfirmMismatch'), 'error');
      return;
    }
    setResettingCareplan(true);
    try {
      const res = await api.post('/admin/reset-careplan', {});
      showToast(
        t('admin.careplanResetSuccess', {
          times: res.times_count,
          items: res.items_count,
          slots: res.schedule_slots_count,
        }),
        'success'
      );
      setCareplanModalVisible(false);
      setCareplanConfirmInput('');
    } catch (e: any) {
      showToast(e.message || t('admin.careplanResetError'), 'error');
    } finally {
      setResettingCareplan(false);
    }
  };

  const loadSharing = useCallback(async () => {
    try {
      const [inv, mem] = await Promise.all([
        api.get('/invites'),
        api.get('/workspace/members'),
      ]);
      setInvites(inv);
      setMembers(mem);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => {
    loadSharing();
  }, [loadSharing]);

  const handleCreateInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      showToast(t('admin.inviteInvalidEmail'), 'error');
      return;
    }
    setInviting(true);
    try {
      await api.post('/invites', { email });
      setInviteEmail('');
      await loadSharing();
      showToast(t('admin.inviteCreated'), 'success');
    } catch (e: any) {
      showToast(e.message || t('admin.inviteError'), 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleShareCode = async (code: string, email: string) => {
    try {
      await Share.share({
        message: t('admin.inviteShareMessage', { code, email }),
      });
    } catch {
      // user cancelled
    }
  };

  const handleDeleteInvite = (id: string) => {
    showConfirm({
      title: t('admin.inviteDeleteTitle'),
      confirmLabel: t('admin.inviteDeleteConfirm'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/invites/${id}`);
          await loadSharing();
          showToast(t('admin.inviteDeleted'), 'success');
        } catch (e: any) {
          showToast(e.message || t('admin.inviteError'), 'error');
        }
      },
    });
  };

  const handleLogout = () => {
    showConfirm({
      title: t('admin.logoutTitle'),
      message: t('admin.logoutMessage'),
      confirmLabel: t('admin.logoutButton'),
      cancelLabel: t('common.cancel'),
      onConfirm: async () => {
        await logout();
      },
    });
  };

  const handleDownloadGuide = async () => {
    if (Platform.OS === 'web') {
      showToast(t('admin.webUnsupported'), 'error');
      return;
    }
    setGeneratingGuide(true);
    try {
      const lang = language === 'da' ? 'da' : 'en';
      const html = buildGuidePdfHtml(lang);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: t('admin.helpPdfButton'),
        });
      }
    } catch (e: any) {
      showToast(e.message || t('admin.helpPdfError'), 'error');
    } finally {
      setGeneratingGuide(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, appBgColor ? { backgroundColor: appBgColor } : null]} edges={['top']}>
      <PageBanner />
      <View style={styles.header}>
        <Text style={[styles.title, pageTitleColor ? { color: pageTitleColor } : null]}>{t('admin.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.helpSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('admin.helpSectionSubtitle')}</Text>

          <TouchableOpacity
            style={[styles.actionBtn, styles.exportBtn]}
            onPress={() => router.push('/help')}
            testID="admin-help-faq-button"
          >
            <Ionicons name="help-circle-outline" size={18} color={COLORS.white} />
            <Text style={styles.actionBtnText}>{t('admin.helpFaqButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.importBtn]}
            onPress={handleDownloadGuide}
            disabled={generatingGuide}
            testID="admin-help-pdf-button"
          >
            {generatingGuide ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                <Text style={styles.importBtnText}>{t('admin.helpPdfButton')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.seasonSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('admin.seasonSectionSubtitle')}</Text>

          {Platform.OS === 'web' ? (
            <WebDateInput
              type="date"
              label={t('admin.seasonSummerLabel')}
              value={`${summerDate.getFullYear()}-${String(summerDate.getMonth() + 1).padStart(2, '0')}-${String(summerDate.getDate()).padStart(2, '0')}`}
              onChangeValue={(v) => {
                if (v) {
                  const d = new Date(v + 'T12:00:00');
                  setSummerDate(d);
                  saveSeasonSetting({ light_summer_start: dateToMonthDay(d) });
                }
              }}
              testID="admin-season-summer-picker"
            />
          ) : (
            <PickerField
              label={t('admin.seasonSummerLabel')}
              value={formatDayMonth(summerDate)}
              onPress={() => setShowSummerPicker(true)}
              testID="admin-season-summer-picker"
              icon="sunny-outline"
            />
          )}

          {Platform.OS === 'web' ? (
            <WebDateInput
              type="date"
              label={t('admin.seasonWinterLabel')}
              value={`${winterDate.getFullYear()}-${String(winterDate.getMonth() + 1).padStart(2, '0')}-${String(winterDate.getDate()).padStart(2, '0')}`}
              onChangeValue={(v) => {
                if (v) {
                  const d = new Date(v + 'T12:00:00');
                  setWinterDate(d);
                  saveSeasonSetting({ light_winter_start: dateToMonthDay(d) });
                }
              }}
              testID="admin-season-winter-picker"
            />
          ) : (
            <PickerField
              label={t('admin.seasonWinterLabel')}
              value={formatDayMonth(winterDate)}
              onPress={() => setShowWinterPicker(true)}
              testID="admin-season-winter-picker"
              icon="snow-outline"
            />
          )}

          {savingSeason && (
            <ActivityIndicator color={COLORS.primary} size="small" testID="admin-season-saving-indicator" />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.bannerSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('admin.bannerSectionSubtitle')}
          </Text>

          <TouchableOpacity style={styles.bannerPreview} onPress={pickBannerImage} testID="admin-banner-picker">
            {localImage ? (
              <Image source={{ uri: localImage }} style={styles.bannerPreviewImage} />
            ) : (
              <View style={[styles.bannerPlaceholder, localBgColor ? { backgroundColor: localBgColor, borderStyle: 'solid' } : null]}>
                <Ionicons name="image-outline" size={26} color={localBgColor ? COLORS.white : COLORS.textMuted} />
                <Text style={[styles.bannerPlaceholderText, localBgColor ? { color: COLORS.white } : null]}>{t('admin.bannerChoosePlaceholder')}</Text>
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
              <Text style={styles.removeText}>{t('admin.bannerRemoveImage')}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.label}>{t('admin.bannerTextLabel')}</Text>
          <TextInput
            style={styles.input}
            value={localText}
            onChangeText={setLocalText}
            placeholder={t('admin.bannerTextPlaceholder')}
            placeholderTextColor={COLORS.textMuted}
            testID="admin-banner-text-input"
          />

          <Text style={styles.label}>{t('admin.bgColorLabel')}</Text>
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

          <Text style={styles.label}>{t('admin.headingColorLabel')}</Text>
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
            {savingBanner ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{t('admin.saveBannerButton')}</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.appearanceSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>
            {t('admin.appearanceSectionSubtitle')}
          </Text>

          <View style={styles.appearancePreview} testID="admin-appearance-preview">
            <View
              style={[
                styles.appearancePreviewBg,
                localAppBgColor ? { backgroundColor: localAppBgColor } : null,
              ]}
            >
              <Text
                style={[
                  styles.appearancePreviewTitle,
                  localPageTitleColor ? { color: localPageTitleColor } : null,
                ]}
              >
                {t('tabs.dragons')}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>{t('admin.appBgColorLabel')}</Text>
          <View style={styles.swatchRow}>
            <TouchableOpacity
              style={[
                styles.swatch,
                styles.swatchWhite,
                localAppBgColor === '#FFFFFF' && styles.swatchSelected,
              ]}
              onPress={() => setLocalAppBgColor('#FFFFFF')}
              testID="admin-app-bg-color-white"
            >
              {localAppBgColor === '#FFFFFF' && <Ionicons name="checkmark" size={16} color={COLORS.textPrimary} />}
            </TouchableOpacity>
            {SWATCH_COLORS.filter((c) => c !== '#FFFFFF').map((color) => (
              <TouchableOpacity
                key={`app-bg-${color}`}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  localAppBgColor === color && styles.swatchSelected,
                ]}
                onPress={() => setLocalAppBgColor(color)}
                testID={`admin-app-bg-color-${color}`}
              >
                {localAppBgColor === color && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('admin.pageTitleColorLabel')}</Text>
          <View style={styles.swatchRow}>
            <TouchableOpacity
              style={[
                styles.swatch,
                styles.swatchWhite,
                localPageTitleColor === '#FFFFFF' && styles.swatchSelected,
              ]}
              onPress={() => setLocalPageTitleColor('#FFFFFF')}
              testID="admin-page-title-color-white"
            >
              {localPageTitleColor === '#FFFFFF' && <Ionicons name="checkmark" size={16} color={COLORS.textPrimary} />}
            </TouchableOpacity>
            {SWATCH_COLORS.filter((c) => c !== '#FFFFFF').map((color) => (
              <TouchableOpacity
                key={`page-title-${color}`}
                style={[
                  styles.swatch,
                  { backgroundColor: color },
                  localPageTitleColor === color && styles.swatchSelected,
                ]}
                onPress={() => setLocalPageTitleColor(color)}
                testID={`admin-page-title-color-${color}`}
              >
                {localPageTitleColor === color && <Ionicons name="checkmark" size={16} color={COLORS.white} />}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingAppearance && styles.saveBtnDisabled]}
            onPress={handleSaveAppearance}
            disabled={savingAppearance}
            testID="admin-appearance-save-button"
          >
            {savingAppearance ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>{t('admin.saveAppearanceButton')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.langSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('admin.langSectionSubtitle')}</Text>

          <Text style={styles.label}>{t('admin.languageLabel')}</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionChip, localLanguage === 'da' && styles.optionChipActive]}
              onPress={() => setLocalLanguage('da')}
              testID="admin-language-da"
            >
              <Text style={[styles.optionChipText, localLanguage === 'da' && styles.optionChipTextActive]}>
                {t('admin.languageDanish')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionChip, localLanguage === 'en' && styles.optionChipActive]}
              onPress={() => setLocalLanguage('en')}
              testID="admin-language-en"
            >
              <Text style={[styles.optionChipText, localLanguage === 'en' && styles.optionChipTextActive]}>
                {t('admin.languageEnglish')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('admin.weightUnitLabel')}</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionChip, localWeightUnit === 'g' && styles.optionChipActive]}
              onPress={() => setLocalWeightUnit('g')}
              testID="admin-weight-unit-g"
            >
              <Text style={[styles.optionChipText, localWeightUnit === 'g' && styles.optionChipTextActive]}>g</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionChip, localWeightUnit === 'oz' && styles.optionChipActive]}
              onPress={() => setLocalWeightUnit('oz')}
              testID="admin-weight-unit-oz"
            >
              <Text style={[styles.optionChipText, localWeightUnit === 'oz' && styles.optionChipTextActive]}>oz</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('admin.timeFormatLabel')}</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[styles.optionChip, localTimeFormat === '12h' && styles.optionChipActive]}
              onPress={() => setLocalTimeFormat('12h')}
              testID="admin-time-format-12h"
            >
              <Text style={[styles.optionChipText, localTimeFormat === '12h' && styles.optionChipTextActive]}>
                {t('admin.timeFormat12h')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionChip, localTimeFormat === '24h' && styles.optionChipActive]}
              onPress={() => setLocalTimeFormat('24h')}
              testID="admin-time-format-24h"
            >
              <Text style={[styles.optionChipText, localTimeFormat === '24h' && styles.optionChipTextActive]}>
                {t('admin.timeFormat24h')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, savingLang && styles.saveBtnDisabled]}
            onPress={handleSaveLangSettings}
            disabled={savingLang}
            testID="admin-lang-save-button"
          >
            {savingLang ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>{t('admin.saveLangButton')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.dangerSection]}>
          <Text style={styles.sectionTitle}>{t('admin.careplanSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('admin.careplanSectionSubtitle')}</Text>

          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={openCareplanModal}
            testID="admin-careplan-reset-button"
          >
            <Ionicons name="refresh-outline" size={18} color={COLORS.white} />
            <Text style={styles.dangerBtnText}>{t('admin.careplanResetButton')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.shareSectionTitle')}</Text>
          <Text style={styles.sectionSubtitle}>{t('admin.shareSectionSubtitle')}</Text>

          <Text style={styles.label}>{t('admin.inviteEmailLabel')}</Text>
          <TextInput
            style={styles.input}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder={t('admin.inviteEmailPlaceholder')}
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="admin-invite-email-input"
          />
          <TouchableOpacity
            style={[styles.saveBtn, inviting && styles.saveBtnDisabled]}
            onPress={handleCreateInvite}
            disabled={inviting}
            testID="admin-invite-button"
          >
            {inviting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>{t('admin.inviteButton')}</Text>
            )}
          </TouchableOpacity>

          {invites.filter((i) => !i.accepted).length > 0 && (
            <View style={styles.listBlock}>
              <Text style={styles.listHeading}>{t('admin.invitePendingHeading')}</Text>
              {invites
                .filter((i) => !i.accepted)
                .map((inv) => (
                  <View key={inv.id} style={styles.inviteRow} testID={`admin-invite-row-${inv.id}`}>
                    <View style={styles.flex1}>
                      <Text style={styles.inviteEmail} numberOfLines={1}>{inv.email}</Text>
                      <Text style={styles.inviteCode}>{t('admin.inviteCodeLabel')}: {inv.code}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.inviteIconBtn}
                      onPress={() => handleShareCode(inv.code, inv.email)}
                      testID={`admin-invite-share-${inv.id}`}
                    >
                      <Ionicons name="share-social-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.inviteIconBtn}
                      onPress={() => handleDeleteInvite(inv.id)}
                      testID={`admin-invite-delete-${inv.id}`}
                    >
                      <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          )}

          {members.length > 0 && (
            <View style={styles.listBlock}>
              <Text style={styles.listHeading}>{t('admin.shareMembersHeading')}</Text>
              {members.map((m) => (
                <View key={m.id} style={styles.memberRow} testID={`admin-member-row-${m.id}`}>
                  <Ionicons name="person-circle-outline" size={22} color={COLORS.textSecondary} />
                  <Text style={styles.memberEmail} numberOfLines={1}>
                    {m.email}
                    {m.is_me ? ` (${t('admin.shareMemberYou')})` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('admin.accountSectionTitle')}</Text>
          <View style={styles.accountRow}>
            <Ionicons
              name={user?.role === 'superadmin' ? 'shield-checkmark' : 'person-circle-outline'}
              size={26}
              color={COLORS.primary}
            />
            <View style={styles.flex1}>
              <Text style={styles.accountEmail} numberOfLines={1}>{user?.email}</Text>
              <Text style={styles.accountRole}>
                {user?.role === 'superadmin' ? t('admin.accountSuperadmin') : t('admin.accountUser')}
              </Text>
            </View>
          </View>

          {user?.role === 'superadmin' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.exportBtn]}
              onPress={() => router.push('/users')}
              testID="admin-manage-users-button"
            >
              <Ionicons name="people-outline" size={18} color={COLORS.white} />
              <Text style={styles.actionBtnText}>{t('admin.manageUsersButton')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionBtn, styles.importBtn]}
            onPress={handleLogout}
            testID="admin-logout-button"
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.primary} />
            <Text style={styles.importBtnText}>{t('admin.logoutButton')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showSummerPicker && (
        <DateTimePicker
          value={summerDate}
          mode="date"
          display="default"
          onChange={onSummerDateChange}
        />
      )}

      {showWinterPicker && (
        <DateTimePicker
          value={winterDate}
          mode="date"
          display="default"
          onChange={onWinterDateChange}
        />
      )}

      <Modal
        visible={careplanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCareplanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard} testID="admin-careplan-confirm-modal">
            <Ionicons name="warning" size={32} color={COLORS.danger} style={{ alignSelf: 'center' }} />
            <Text style={styles.modalTitle}>{t('admin.careplanConfirmTitle')}</Text>
            <Text style={styles.modalMessage}>{t('admin.careplanConfirmMessage')}</Text>
            <TextInput
              style={styles.modalInput}
              value={careplanConfirmInput}
              onChangeText={setCareplanConfirmInput}
              placeholder={t('admin.careplanConfirmPlaceholder')}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              testID="admin-careplan-confirm-input"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancelBtn]}
                onPress={() => setCareplanModalVisible(false)}
                testID="admin-careplan-confirm-cancel"
              >
                <Text style={styles.modalCancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.modalConfirmBtn,
                  careplanConfirmInput.trim().toUpperCase() !== careplanConfirmWord.toUpperCase() &&
                    styles.modalConfirmBtnDisabled,
                ]}
                onPress={handleConfirmResetCareplan}
                disabled={resettingCareplan}
                testID="admin-careplan-confirm-button"
              >
                {resettingCareplan ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>{t('admin.careplanResetButton')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  swatchWhite: {
    backgroundColor: '#FFFFFF',
    borderColor: COLORS.borderLight,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  appearancePreview: {
    marginBottom: 16,
  },
  appearancePreviewBg: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  appearancePreviewTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  optionChip: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  optionChipTextActive: {
    color: COLORS.white,
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: COLORS.dangerLight,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.danger,
  },
  dangerBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  flex1: { flex: 1 },
  listBlock: {
    marginTop: 16,
  },
  listHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inviteEmail: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  inviteCode: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 2,
    letterSpacing: 1,
  },
  inviteIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  memberEmail: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  accountEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  accountRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    backgroundColor: COLORS.danger,
  },
  modalConfirmBtnDisabled: {
    opacity: 0.4,
  },
  modalConfirmBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
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
