import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-gifted-charts';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { COLORS } from '@/constants/colors';
import { formatDateISO } from '@/constants/data';
import {
  formatDateLabel,
  formatDateShort,
  formatWeightDisplay,
  gramsToDisplay,
  displayToGrams,
  weightUnitLabel,
} from '@/i18n/translations';
import { api } from '@/utils/api';
import { useConfirm, useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import FormField from '@/components/FormField';
import PickerField from '@/components/PickerField';
import { buildWeightPdfHtml, computeExactAge } from '@/utils/weightPdf';
import type { Dragon, WeightEntry } from '@/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = Math.max(SCREEN_WIDTH - 90, 260);

export default function DragonWeightScreen() {
  const router = useRouter();
  const showToast = useToast();
  const showConfirm = useConfirm();
  const { language, weightUnit, t } = useAdminSettings();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [dragon, setDragon] = useState<Dragon | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [weightInput, setWeightInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchEntries = async () => {
    try {
      const [entriesData, dragonData]: [WeightEntry[], Dragon] = await Promise.all([
        api.get(`/dragons/${id}/weights`),
        api.get(`/dragons/${id}`),
      ]);
      setEntries(entriesData);
      setDragon(dragonData);
    } catch (e: any) {
      showToast(e.message || t('weight.fetchError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sortedDesc = useMemo(
    () => [...entries].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [entries]
  );
  const latest = sortedDesc[0];

  const chartData = useMemo(() => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const cutoff = formatDateISO(twelveMonthsAgo);
    const recent = entries.filter((e) => e.date >= cutoff).sort((a, b) => (a.date < b.date ? -1 : 1));
    return recent.map((e) => ({
      value: gramsToDisplay(e.weight_grams, weightUnit),
      label: formatDateShort(new Date(e.date)),
      dataPointText: String(gramsToDisplay(e.weight_grams, weightUnit)),
    }));
  }, [entries, weightUnit]);

  const handleAddWeight = async () => {
    const rawValue = parseFloat(weightInput.replace(',', '.'));
    if (!rawValue || rawValue <= 0) {
      showToast(t('weight.invalidWeight'), 'error');
      return;
    }
    const weightValue = displayToGrams(rawValue, weightUnit);
    setSaving(true);
    try {
      await api.post(`/dragons/${id}/weights`, {
        weight_grams: weightValue,
        note: noteInput.trim() || null,
        date: formatDateISO(date),
      });
      setWeightInput('');
      setNoteInput('');
      setDate(new Date());
      showToast(t('weight.registerSuccess'), 'success');
      fetchEntries();
    } catch (e: any) {
      showToast(e.message || t('weight.registerError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = (entry: WeightEntry) => {
    showConfirm({
      title: t('weight.deleteTitle'),
      message: t('weight.deleteMessage', {
        weight: formatWeightDisplay(entry.weight_grams, weightUnit),
        date: formatDateLabel(new Date(entry.date), language),
      }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/weights/${entry.id}`);
          showToast(t('weight.deleteSuccess'), 'success');
          fetchEntries();
        } catch (e: any) {
          showToast(e.message || t('weight.deleteError'), 'error');
        }
      },
    });
  };

  const handleExportPdf = async () => {
    if (entries.length === 0) {
      showToast(t('weight.exportPdfNoData'), 'error');
      return;
    }
    if (Platform.OS === 'web') {
      showToast(t('weight.exportPdfWebUnsupported'), 'error');
      return;
    }
    setExportingPdf(true);
    try {
      const ageText = dragon
        ? computeExactAge(dragon.birthday, {
            years: t('weight.pdfAgeYears'),
            months: t('weight.pdfAgeMonths'),
            month: t('weight.pdfAgeMonth'),
            underMonth: t('weight.pdfAgeUnderMonth'),
          })
        : '';
      const html = buildWeightPdfHtml({
        dragonName: name || dragon?.name || '',
        birthday: dragon?.birthday || formatDateISO(new Date()),
        ageText,
        entries,
        weightUnit,
        language,
        labels: {
          birthdayLabel: t('weight.pdfBirthdayLabel'),
          ageLabel: t('weight.pdfAgeLabel'),
          tableDate: t('weight.pdfTableDate'),
          tableWeight: t('weight.pdfTableWeight'),
          tableNotes: t('weight.pdfTableNotes'),
          noEntries: t('weight.pdfNoEntries'),
          chartTitle: t('weight.pdfChartTitle'),
          chartEmpty: t('weight.pdfChartEmpty'),
          generatedOn: t('weight.pdfGeneratedOn'),
          historyTitle: t('weight.pdfHistoryTitle'),
        },
      });

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `${name || dragon?.name || ''} - ${t('weight.headerSuffix')}`,
        });
      } else {
        showToast(t('weight.exportPdfSuccess'), 'success');
      }
    } catch (e: any) {
      showToast(e.message || t('weight.exportPdfError'), 'error');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} testID="dragon-weight-close-button" style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{name || 'Dragon'} - {t('weight.headerSuffix')}</Text>
        <TouchableOpacity
          onPress={handleExportPdf}
          disabled={exportingPdf || loading}
          testID="weight-export-pdf-button"
          style={styles.exportBtn}
        >
          {exportingPdf ? (
            <ActivityIndicator color={COLORS.primaryDark} size="small" />
          ) : (
            <Ionicons name="share-outline" size={22} color={COLORS.primaryDark} />
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.latestCard} testID="weight-latest-card">
              <View style={styles.latestIconBox}>
                <Ionicons name="scale-outline" size={22} color={COLORS.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.latestLabel}>{t('weight.latestLabel')}</Text>
                {latest ? (
                  <>
                    <Text style={styles.latestValue}>{formatWeightDisplay(latest.weight_grams, weightUnit)}</Text>
                    <Text style={styles.latestDate}>{formatDateLabel(new Date(latest.date), language)}</Text>
                  </>
                ) : (
                  <Text style={styles.latestEmpty}>{t('weight.noneYet')}</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('weight.registerNew')}</Text>
              <FormField
                label={t('weight.weightLabel', { unit: weightUnitLabel(weightUnit) })}
                testID="weight-form-weight-input"
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder={t('weight.weightPlaceholder', { example: weightUnit === 'oz' ? '11.3' : '320' })}
                keyboardType="decimal-pad"
              />
              <PickerField
                label={t('weight.dateLabel')}
                value={formatDateLabel(date, language)}
                onPress={() => setShowDatePicker(true)}
                testID="weight-form-date-picker"
                icon="calendar-outline"
              />
              <FormField
                label={t('weight.noteLabel')}
                testID="weight-form-note-input"
                value={noteInput}
                onChangeText={setNoteInput}
                placeholder={t('weight.notePlaceholder')}
                multiline
              />
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleAddWeight}
                disabled={saving}
                testID="weight-form-save-button"
              >
                {saving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.saveBtnText}>{t('weight.registerButton')}</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('weight.chartTitle')}</Text>
              {chartData.length >= 2 ? (
                <View style={styles.chartBox} testID="weight-chart">
                  <LineChart
                    data={chartData}
                    width={CHART_WIDTH}
                    height={180}
                    color={COLORS.primary}
                    thickness={3}
                    dataPointsColor={COLORS.primaryDark}
                    dataPointsRadius={4}
                    curved
                    areaChart
                    startFillColor={COLORS.primaryLight}
                    startOpacity={0.5}
                    endOpacity={0.05}
                    yAxisTextStyle={{ color: COLORS.textMuted, fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: COLORS.textMuted, fontSize: 9 }}
                    yAxisColor={COLORS.border}
                    xAxisColor={COLORS.border}
                    noOfSections={4}
                    spacing={Math.max(36, CHART_WIDTH / (chartData.length + 1))}
                    initialSpacing={16}
                    rulesType="solid"
                    rulesColor={COLORS.borderLight}
                    isAnimated
                  />
                </View>
              ) : (
                <View style={styles.chartEmpty} testID="weight-chart-empty">
                  <Ionicons name="stats-chart-outline" size={28} color={COLORS.textMuted} />
                  <Text style={styles.chartEmptyText}>
                    {t('weight.chartEmpty')}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('weight.historyTitle')}</Text>
              {sortedDesc.length === 0 ? (
                <Text style={styles.emptyHistoryText}>{t('weight.historyEmpty')}</Text>
              ) : (
                sortedDesc.map((entry) => (
                  <View key={entry.id} style={styles.historyRow} testID={`weight-history-row-${entry.id}`}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.historyRowTop}>
                        <Text style={styles.historyWeight}>{formatWeightDisplay(entry.weight_grams, weightUnit)}</Text>
                        <Text style={styles.historyDate}>{formatDateLabel(new Date(entry.date), language)}</Text>
                      </View>
                      {!!entry.note && <Text style={styles.historyNote}>{entry.note}</Text>}
                    </View>
                    <TouchableOpacity
                      style={styles.historyDeleteBtn}
                      onPress={() => handleDeleteEntry(entry)}
                      testID={`weight-history-delete-${entry.id}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) setDate(selectedDate);
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
  exportBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 20,
  },
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 18,
    padding: 16,
  },
  latestIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  latestValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  latestDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  latestEmpty: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 14,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveBtnText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 15,
  },
  chartBox: {
    alignItems: 'center',
    paddingTop: 8,
  },
  chartEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  chartEmptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  historyRowTop: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  historyWeight: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  historyNote: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  historyDeleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
