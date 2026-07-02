import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/colors';
import { computeAgeCategory } from '@/constants/data';
import { getAgeLabel, getGenders, getGenderLabel } from '@/i18n/translations';
import { api } from '@/utils/api';
import { useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import FormField from '@/components/FormField';
import PickerField from '@/components/PickerField';
import SelectSheet from '@/components/SelectSheet';
import type { Dragon } from '@/types';

export default function DragonFormScreen() {
  const router = useRouter();
  const showToast = useToast();
  const { language, t } = useAdminSettings();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [color, setColor] = useState('');
  const [morph, setMorph] = useState('');
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [photo, setPhoto] = useState<string | null>(null);

  const [genderSheetVisible, setGenderSheetVisible] = useState(false);
  const [photoSheetVisible, setPhotoSheetVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api
        .get(`/dragons/${id}`)
        .then((d: Dragon) => {
          setName(d.name);
          setGender(d.gender);
          setColor(d.color);
          setMorph(d.morph);
          setBirthday(new Date(d.birthday));
          setPhoto(d.photo_base64 || null);
        })
        .catch((e: any) => showToast(e.message || t('dragonForm.fetchError'), 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, showToast]);

  const computedAgeCategory = useMemo(() => computeAgeCategory(birthday), [birthday]);
  const computedAgeLabel = getAgeLabel(computedAgeCategory, language);

  const pickPhoto = async (source: string[]) => {
    const isCamera = source[0] === 'camera';
    const permission = isCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(t('dragonForm.permissionError'), 'error');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    };
    const result = isCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]?.base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !gender || !color.trim() || !morph.trim()) {
      showToast(t('dragonForm.validationError'), 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      gender,
      color: color.trim(),
      morph: morph.trim(),
      birthday: birthday.toISOString().split('T')[0],
      photo_base64: photo,
    };
    try {
      if (isEdit) {
        await api.put(`/dragons/${id}`, payload);
        showToast(t('dragonForm.updateSuccess'), 'success');
      } else {
        await api.post('/dragons', payload);
        showToast(t('dragonForm.addSuccess'), 'success');
      }
      router.back();
    } catch (e: any) {
      showToast(e.message || t('dragonForm.saveError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerBox}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="dragon-form-close-button" style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? t('dragonForm.editTitle') : t('dragonForm.newTitle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            style={styles.photoPicker}
            onPress={() => setPhotoSheetVisible(true)}
            testID="dragon-form-photo-picker"
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={28} color={COLORS.primary} />
              </View>
            )}
            <View style={styles.photoEditBadge}>
              <Ionicons name="pencil" size={14} color={COLORS.white} />
            </View>
          </TouchableOpacity>

          <FormField label={t('dragonForm.nameLabel')} testID="dragon-form-name-input" value={name} onChangeText={setName} placeholder={t('dragonForm.namePlaceholder')} />

          <PickerField
            label={t('dragonForm.genderLabel')}
            value={gender ? getGenderLabel(gender, language) : ''}
            placeholder={t('dragonForm.genderPlaceholder')}
            onPress={() => setGenderSheetVisible(true)}
            testID="dragon-form-gender-picker"
          />

          <FormField label={t('dragonForm.colorLabel')} testID="dragon-form-color-input" value={color} onChangeText={setColor} placeholder={t('dragonForm.colorPlaceholder')} />

          <FormField label={t('dragonForm.morphLabel')} testID="dragon-form-morph-input" value={morph} onChangeText={setMorph} placeholder={t('dragonForm.morphPlaceholder')} />

          <PickerField
            label={t('dragonForm.birthdayLabel')}
            value={birthday.toLocaleDateString(language === 'da' ? 'da-DK' : 'en-US')}
            onPress={() => setShowDatePicker(true)}
            testID="dragon-form-birthday-picker"
            icon="calendar-outline"
          />

          <Text style={styles.label}>{t('dragonForm.ageAutoLabel')}</Text>
          <View style={styles.ageAutoBox} testID="dragon-form-age-category-computed">
            <Ionicons name="hourglass-outline" size={16} color={COLORS.primaryDark} />
            <Text style={styles.ageAutoText}>{computedAgeLabel}</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            testID="dragon-form-save-button"
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>{isEdit ? t('dragonForm.saveChanges') : t('dragonForm.addDragon')}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <DateTimePicker
          value={birthday}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setBirthday(selectedDate);
          }}
        />
      )}

      <SelectSheet
        visible={genderSheetVisible}
        title={t('dragonForm.genderPlaceholder')}
        options={getGenders(language)}
        selected={gender ? [gender] : []}
        onSelect={(v) => setGender(v[0])}
        onClose={() => setGenderSheetVisible(false)}
        testIDPrefix="dragon-form-gender-sheet"
      />

      <SelectSheet
        visible={photoSheetVisible}
        title={t('dragonForm.addPhotoTitle')}
        options={[
          { value: 'camera', label: t('dragonForm.takePhoto'), icon: 'camera-outline' },
          { value: 'gallery', label: t('dragonForm.chooseFromGallery'), icon: 'images-outline' },
        ]}
        selected={[]}
        onSelect={(v) => {
          setPhotoSheetVisible(false);
          pickPhoto(v);
        }}
        onClose={() => setPhotoSheetVisible(false)}
        testIDPrefix="dragon-form-photo-sheet"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  form: {
    padding: 20,
    paddingBottom: 60,
  },
  photoPicker: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  ageAutoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  ageAutoText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
  },
});
