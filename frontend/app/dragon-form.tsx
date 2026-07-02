import React, { useEffect, useState } from 'react';
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
import { AGE_CATEGORIES, GENDERS } from '@/constants/data';
import { api } from '@/utils/api';
import { useToast } from '@/context/OverlayContext';
import FormField from '@/components/FormField';
import PickerField from '@/components/PickerField';
import SelectSheet from '@/components/SelectSheet';
import type { Dragon } from '@/types';

export default function DragonFormScreen() {
  const router = useRouter();
  const showToast = useToast();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [color, setColor] = useState('');
  const [morph, setMorph] = useState('');
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [ageCategory, setAgeCategory] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const [genderSheetVisible, setGenderSheetVisible] = useState(false);
  const [ageSheetVisible, setAgeSheetVisible] = useState(false);
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
          setAgeCategory(d.age_category);
          setPhoto(d.photo_base64 || null);
        })
        .catch((e: any) => showToast(e.message || 'Kunne ikke hente agame', 'error'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, showToast]);

  const pickPhoto = async (source: string[]) => {
    const isCamera = source[0] === 'camera';
    const permission = isCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast('Tilladelse er nødvendig for at tilføje billede', 'error');
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
    if (!name.trim() || !gender || !color.trim() || !morph.trim() || !ageCategory) {
      showToast('Udfyld venligst alle felter', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      name: name.trim(),
      gender,
      color: color.trim(),
      morph: morph.trim(),
      birthday: birthday.toISOString().split('T')[0],
      age_category: ageCategory,
      photo_base64: photo,
    };
    try {
      if (isEdit) {
        await api.put(`/dragons/${id}`, payload);
        showToast('Agame opdateret', 'success');
      } else {
        await api.post('/dragons', payload);
        showToast('Agame tilføjet', 'success');
      }
      router.back();
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke gemme agame', 'error');
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
        <Text style={styles.headerTitle}>{isEdit ? 'Rediger agame' : 'Ny agame'}</Text>
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

          <FormField label="Navn" testID="dragon-form-name-input" value={name} onChangeText={setName} placeholder="F.eks. Spike" />

          <PickerField
            label="Køn"
            value={gender}
            placeholder="Vælg køn"
            onPress={() => setGenderSheetVisible(true)}
            testID="dragon-form-gender-picker"
          />

          <FormField label="Farve" testID="dragon-form-color-input" value={color} onChangeText={setColor} placeholder="F.eks. Orange" />

          <FormField label="Morph" testID="dragon-form-morph-input" value={morph} onChangeText={setMorph} placeholder="F.eks. Hypo Leatherback" />

          <PickerField
            label="Fødselsdag"
            value={birthday.toLocaleDateString('da-DK')}
            onPress={() => setShowDatePicker(true)}
            testID="dragon-form-birthday-picker"
            icon="calendar-outline"
          />

          <PickerField
            label="Alderskategori"
            value={AGE_CATEGORIES.find((a) => a.value === ageCategory)?.label || ''}
            placeholder="Vælg alderskategori"
            onPress={() => setAgeSheetVisible(true)}
            testID="dragon-form-age-category-picker"
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            testID="dragon-form-save-button"
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveBtnText}>{isEdit ? 'Gem ændringer' : 'Tilføj agame'}</Text>
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
        title="Vælg køn"
        options={GENDERS.map((g) => ({ value: g, label: g }))}
        selected={gender ? [gender] : []}
        onSelect={(v) => setGender(v[0])}
        onClose={() => setGenderSheetVisible(false)}
        testIDPrefix="dragon-form-gender-sheet"
      />

      <SelectSheet
        visible={ageSheetVisible}
        title="Vælg alderskategori"
        options={AGE_CATEGORIES}
        selected={ageCategory ? [ageCategory] : []}
        onSelect={(v) => setAgeCategory(v[0])}
        onClose={() => setAgeSheetVisible(false)}
        testIDPrefix="dragon-form-age-sheet"
      />

      <SelectSheet
        visible={photoSheetVisible}
        title="Tilføj billede"
        options={[
          { value: 'camera', label: 'Tag foto', icon: 'camera-outline' },
          { value: 'gallery', label: 'Vælg fra galleri', icon: 'images-outline' },
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
