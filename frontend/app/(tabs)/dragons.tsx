import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { AGE_CATEGORIES, MAX_DRAGONS } from '@/constants/data';
import { api } from '@/utils/api';
import { useConfirm, useToast } from '@/context/OverlayContext';
import { useAdminSettings } from '@/context/AdminSettingsContext';
import DragonAvatar from '@/components/DragonAvatar';
import PageBanner from '@/components/PageBanner';
import type { Dragon } from '@/types';

export default function DragonsScreen() {
  const router = useRouter();
  const showToast = useToast();
  const showConfirm = useConfirm();
  const { appBgColor, pageTitleColor } = useAdminSettings();
  const [dragons, setDragons] = useState<Dragon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDragons = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await api.get('/dragons');
      setDragons(data);
    } catch (e: any) {
      showToast(e.message || 'Kunne ikke hente agamer', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchDragons(dragons.length === 0);
    }, [fetchDragons])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDragons(false);
  };

  const handleDelete = (dragon: Dragon) => {
    showConfirm({
      title: `Slet ${dragon.name}?`,
      message: 'Alle registreringer for denne agame vil blive fjernet. Dette kan ikke fortrydes.',
      confirmLabel: 'Slet',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/dragons/${dragon.id}`);
          showToast('Agame slettet', 'success');
          fetchDragons(false);
        } catch (e: any) {
          showToast(e.message || 'Kunne ikke slette agame', 'error');
        }
      },
    });
  };

  const canAddMore = dragons.length < MAX_DRAGONS;

  return (
    <SafeAreaView style={[styles.safeArea, appBgColor ? { backgroundColor: appBgColor } : null]} edges={['top']}>
      <PageBanner />
      <View style={styles.header}>
        <Text style={[styles.title, pageTitleColor ? { color: pageTitleColor } : null]}>Agamer</Text>
        <Text style={styles.count}>{dragons.length} / {MAX_DRAGONS}</Text>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={COLORS.primary} size="large" testID="dragons-loading" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {dragons.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="paw-outline" size={44} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Ingen agamer tilføjet endnu</Text>
            </View>
          )}

          {dragons.map((dragon) => {
            const ageLabel = AGE_CATEGORIES.find((a) => a.value === dragon.age_category)?.label;
            return (
              <View key={dragon.id} style={styles.card} testID={`dragon-card-${dragon.id}`}>
                <DragonAvatar photoBase64={dragon.photo_base64} size={60} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} testID={`dragon-card-name-${dragon.id}`}>{dragon.name}</Text>
                  <Text style={styles.cardMeta}>{dragon.gender} · {dragon.color} · {dragon.morph}</Text>
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageBadgeText}>{ageLabel}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => router.push({ pathname: '/dragon-form', params: { id: dragon.id } })}
                    testID={`dragon-edit-button-${dragon.id}`}
                  >
                    <Ionicons name="create-outline" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDelete(dragon)}
                    testID={`dragon-delete-button-${dragon.id}`}
                  >
                    <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {canAddMore && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/dragon-form')}
          testID="add-dragon-fab"
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  count: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  ageBadge: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
