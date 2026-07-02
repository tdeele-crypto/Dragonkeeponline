import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '@/constants/colors';
import { CATEGORY_LABELS } from '@/constants/data';
import { api } from '@/utils/api';
import { useToast } from '@/context/OverlayContext';
import FormField from '@/components/FormField';
import PickerField from '@/components/PickerField';
import type { TaskCategory } from '@/types';

export default function ListItemFormScreen() {
  const router = useRouter();
  const showToast = useToast();
  const { category, id, currentName, currentTime } = useLocalSearchParams<{
    category: string;
    id?: string;
    currentName?: string;
    currentTime?: string;
  }>();
  const isTime = category === 'tider';
  const isEdit = !!id;

  const [name, setName] = useState(currentName || '');
  const [time, setTime] = useState(() => {
    if (currentTime) {
      const [hh, mm] = currentTime.split(':').map(Number);
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      return d;
    }
    return new Date();
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const titleLabel = isTime ? 'tidspunkt' : CATEGORY_LABELS[category as TaskCategory]?.toLowerCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isTime) {
        const hh = String(time.getHours()).padStart(2, '0');
        const mm = String(time.getMinutes()).padStart(2, '0');
        if (isEdit) {
          await api.put(`/times/${id}`, { time: `${hh}:${mm}` });
          showToast('Tidspunkt opdateret', 'success');
        } else {
          await api.post('/times', { time: `${hh}:${mm}` });
          showToast('Tidspunkt tilføjet', 'success');
        }
      } else {
        if (!name.trim()) {
          showToast('Angiv venligst et navn', 'error');
          setSaving(false);
          return;
        }
        if (isEdit) {
          await api.put(`/task-items/${id}`, { category, name: name.trim() });
          showToast('Emne opdateret', 'success');
        } else {
          await api.post('/task-items', { category, name: name.trim() });
          showToast('Emne tilføjet', 'success');
        }
      }
      router.back();
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke gemme', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="list-item-form-close-button" style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Rediger' : 'Tilføj'} {titleLabel}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.form}>
          {isTime ? (
            <PickerField
              label="Tidspunkt"
              value={time.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
              onPress={() => setShowTimePicker(true)}
              testID="list-item-form-time-picker"
              icon="time-outline"
            />
          ) : (
            <FormField
              label="Navn"
              testID="list-item-form-name-input"
              value={name}
              onChangeText={setName}
              placeholder="F.eks. Larver"
              autoFocus
            />
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            testID="list-item-form-save-button"
          >
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{isEdit ? 'Gem ændringer' : 'Tilføj'}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          minuteInterval={5}
          onChange={(_event, selectedDate) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (selectedDate) setTime(selectedDate);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
    textTransform: 'capitalize',
  },
  form: {
    padding: 20,
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
