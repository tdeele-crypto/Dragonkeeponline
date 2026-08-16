import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import WebDateInput from '@/components/WebDateInput';
import { COLORS } from '@/constants/colors';
import { getCategoryLabel, formatTimeDisplay } from '@/i18n/translations';
import { api } from '@/utils/api';
import { useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import FormField from '@/components/FormField';
import PickerField from '@/components/PickerField';
import type { TaskCategory } from '@/types';

export default function ListItemFormScreen() {
  const router = useRouter();
  const showToast = useToast();
  const { language, timeFormat, t } = useAdminSettings();
  const { category, id, currentName, currentTime, currentWinterTime, currentAutomatic } = useLocalSearchParams<{
    category: string;
    id?: string;
    currentName?: string;
    currentTime?: string;
    currentWinterTime?: string;
    currentAutomatic?: string;
  }>();
  const isTime = category === 'tider';
  const isLys = category === 'lys';
  const isEdit = !!id;

  const [name, setName] = useState(currentName || '');
  const [isAutomatic, setIsAutomatic] = useState(currentAutomatic === 'true');
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
  const [winterTimeEnabled, setWinterTimeEnabled] = useState(!!currentWinterTime);
  const [winterTime, setWinterTime] = useState(() => {
    if (currentWinterTime) {
      const [hh, mm] = currentWinterTime.split(':').map(Number);
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      return d;
    }
    return new Date();
  });
  const [showWinterTimePicker, setShowWinterTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const titleLabel = isTime ? t('listItemForm.timeWord') : getCategoryLabel(category as TaskCategory, language).toLowerCase();

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isTime) {
        const hh = String(time.getHours()).padStart(2, '0');
        const mm = String(time.getMinutes()).padStart(2, '0');
        const winterHh = String(winterTime.getHours()).padStart(2, '0');
        const winterMm = String(winterTime.getMinutes()).padStart(2, '0');
        const payload = {
          time: `${hh}:${mm}`,
          winter_time: winterTimeEnabled ? `${winterHh}:${winterMm}` : null,
        };
        if (isEdit) {
          await api.put(`/times/${id}`, payload);
          showToast(t('listItemForm.timeUpdated'), 'success');
        } else {
          await api.post('/times', payload);
          showToast(t('listItemForm.timeAdded'), 'success');
        }
      } else {
        if (!name.trim()) {
          showToast(t('listItemForm.nameRequired'), 'error');
          setSaving(false);
          return;
        }
        const payload = {
          category,
          name: name.trim(),
          is_automatic: isLys ? isAutomatic : false,
          source_language: language,
        };
        if (isEdit) {
          await api.put(`/task-items/${id}`, payload);
          showToast(t('listItemForm.itemUpdated'), 'success');
        } else {
          await api.post('/task-items', payload);
          showToast(t('listItemForm.itemAdded'), 'success');
        }
      }
      router.back();
    } catch (e: any) {
      showToast(e.message || t('listItemForm.saveError'), 'error');
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
        <Text style={styles.headerTitle}>{isEdit ? t('listItemForm.editPrefix') : t('listItemForm.addPrefix')} {titleLabel}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.form}>
          {isTime ? (
            <>
              {Platform.OS === 'web' ? (
                <WebDateInput
                  type="time"
                  label={t('listItemForm.timeLabel')}
                  value={`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`}
                  onChangeValue={(v) => {
                    const [hh, mm] = v.split(':').map(Number);
                    if (!isNaN(hh)) {
                      const d = new Date(time);
                      d.setHours(hh, mm || 0, 0, 0);
                      setTime(d);
                    }
                  }}
                  testID="list-item-form-time-picker"
                />
              ) : (
                <PickerField
                  label={t('listItemForm.timeLabel')}
                  value={formatTimeDisplay(`${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`, timeFormat)}
                  onPress={() => setShowTimePicker(true)}
                  testID="list-item-form-time-picker"
                  icon="time-outline"
                />
              )}

              <View style={styles.autoRow} testID="list-item-form-winter-time-row">
                <View style={{ flex: 1 }}>
                  <Text style={styles.autoLabel}>{t('listItemForm.winterTimeToggleLabel')}</Text>
                  <Text style={styles.autoSubLabel}>{t('listItemForm.winterTimeToggleSubLabel')}</Text>
                </View>
                <Switch
                  value={winterTimeEnabled}
                  onValueChange={setWinterTimeEnabled}
                  trackColor={{ false: COLORS.border, true: COLORS.categories.lys.bg }}
                  testID="list-item-form-winter-time-toggle"
                />
              </View>

              {winterTimeEnabled && (
                Platform.OS === 'web' ? (
                  <WebDateInput
                    type="time"
                    label={t('listItemForm.winterTimeLabel')}
                    value={`${String(winterTime.getHours()).padStart(2, '0')}:${String(winterTime.getMinutes()).padStart(2, '0')}`}
                    onChangeValue={(v) => {
                      const [hh, mm] = v.split(':').map(Number);
                      if (!isNaN(hh)) {
                        const d = new Date(winterTime);
                        d.setHours(hh, mm || 0, 0, 0);
                        setWinterTime(d);
                      }
                    }}
                    testID="list-item-form-winter-time-picker"
                  />
                ) : (
                  <PickerField
                    label={t('listItemForm.winterTimeLabel')}
                    value={formatTimeDisplay(`${String(winterTime.getHours()).padStart(2, '0')}:${String(winterTime.getMinutes()).padStart(2, '0')}`, timeFormat)}
                    onPress={() => setShowWinterTimePicker(true)}
                    testID="list-item-form-winter-time-picker"
                    icon="snow-outline"
                  />
                )
              )}
            </>
          ) : (
            <FormField
              label={t('listItemForm.nameLabel')}
              testID="list-item-form-name-input"
              value={name}
              onChangeText={setName}
              placeholder={t('listItemForm.namePlaceholder')}
              autoFocus
            />
          )}

          {isLys && (
            <View style={styles.autoRow} testID="list-item-form-automatic-row">
              <View style={{ flex: 1 }}>
                <Text style={styles.autoLabel}>{t('listItemForm.automaticLabel')}</Text>
                <Text style={styles.autoSubLabel}>{t('listItemForm.automaticSubLabel')}</Text>
              </View>
              <Switch
                value={isAutomatic}
                onValueChange={setIsAutomatic}
                trackColor={{ false: COLORS.border, true: COLORS.categories.lys.bg }}
                testID="list-item-form-automatic-switch"
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            testID="list-item-form-save-button"
          >
            {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>{isEdit ? t('listItemForm.saveChanges') : t('listItemForm.add')}</Text>}
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

      {showWinterTimePicker && (
        <DateTimePicker
          value={winterTime}
          mode="time"
          display="default"
          minuteInterval={5}
          onChange={(_event, selectedDate) => {
            setShowWinterTimePicker(Platform.OS === 'ios');
            if (selectedDate) setWinterTime(selectedDate);
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
  autoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  autoLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  autoSubLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
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
