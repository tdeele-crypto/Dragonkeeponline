import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { api } from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useToast, useConfirm } from '@/context/OverlayContext';

interface ManagedUser {
  id: string;
  email: string;
  display_name: string | null;
  role: 'superadmin' | 'user';
  is_active: boolean;
  workspace_name?: string;
  last_login: string | null;
  created_at: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '-';
  }
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch (e: any) {
      toast(e?.message || 'Could not load users', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const toggleActive = async (u: ManagedUser, next: boolean) => {
    try {
      await api.put(`/users/${u.id}/active`, { is_active: next });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: next } : x)));
      toast(next ? 'User reactivated' : 'User deactivated', 'success');
    } catch (e: any) {
      toast(e?.message || 'Update failed', 'error');
    }
  };

  const removeUser = (u: ManagedUser) => {
    confirm({
      title: 'Delete user?',
      message: `Permanently delete ${u.email}? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/users/${u.id}`);
          setUsers((prev) => prev.filter((x) => x.id !== u.id));
          toast('User deleted', 'success');
        } catch (e: any) {
          toast(e?.message || 'Delete failed', 'error');
        }
      },
    });
  };

  if (user?.role !== 'superadmin') {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Superadmin access only.</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity testID="users-back-button" onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage users</Text>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.subtitle}>
            Deactivate accounts that are no longer active, or delete them entirely.
          </Text>
          {users.map((u) => (
            <View key={u.id} style={styles.card} testID={`user-card-${u.id}`}>
              <View style={styles.cardTop}>
                <View style={styles.avatarWrap}>
                  <Ionicons
                    name={u.role === 'superadmin' ? 'shield-checkmark' : 'person'}
                    size={20}
                    color={u.role === 'superadmin' ? COLORS.primary : COLORS.textSecondary}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.email} numberOfLines={1}>
                    {u.email}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {u.display_name ? `${u.display_name} · ` : ''}
                    {u.role === 'superadmin' ? 'Superadmin' : 'User'}
                    {u.is_active ? '' : ' · Inactive'}
                  </Text>
                  <Text style={styles.metaSmall}>Last login: {formatDate(u.last_login)}</Text>
                </View>
              </View>

              {u.role !== 'superadmin' && (
                <View style={styles.actionsRow}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{u.is_active ? 'Active' : 'Inactive'}</Text>
                    <Switch
                      testID={`user-active-switch-${u.id}`}
                      value={u.is_active}
                      onValueChange={(v) => toggleActive(u, v)}
                      trackColor={{ true: COLORS.success, false: COLORS.border }}
                    />
                  </View>
                  <TouchableOpacity
                    testID={`user-delete-button-${u.id}`}
                    style={styles.deleteBtn}
                    onPress={() => removeUser(u)}
                  >
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16, lineHeight: 20 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
  backLink: { marginTop: 16 },
  backLinkText: { color: COLORS.primary, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex1: { flex: 1 },
  email: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  meta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  metaSmall: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10 },
  deleteText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
});
