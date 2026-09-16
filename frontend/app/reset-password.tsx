import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { api } from '@/utils/api';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!token) {
      setError('Linket mangler en gyldig nulstillingskode.');
      return;
    }
    if (password.length < 6) {
      setError('Adgangskoden skal være mindst 6 tegn.');
      return;
    }
    if (password !== confirm) {
      setError('De to adgangskoder er ikke ens.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, new_password: password });
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Kunne ikke nulstille adgangskoden.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoWrap}>
          <Ionicons name="key-outline" size={44} color={COLORS.primary} />
          <Text style={styles.title}>Vælg ny adgangskode</Text>
        </View>

        {done ? (
          <View style={styles.successBox} testID="reset-success">
            <Ionicons name="checkmark-circle-outline" size={44} color={COLORS.success} />
            <Text style={styles.successText}>Din adgangskode er nulstillet. Du kan nu logge ind med den nye adgangskode.</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Gå til login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Ny adgangskode</Text>
              <TextInput
                testID="reset-password-input"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mindst 6 tegn"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Gentag adgangskode</Text>
              <TextInput
                testID="reset-confirm-input"
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                placeholder="Gentag ny adgangskode"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              testID="reset-submit-button"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Nulstil adgangskode</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/login')}>
              <Text style={styles.link}>Tilbage til login</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginTop: 12, textAlign: 'center' },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  error: { color: COLORS.danger, fontSize: 14, marginBottom: 12, fontWeight: '600' },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 },
  link: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  successBox: { alignItems: 'center', gap: 16, paddingHorizontal: 8 },
  successText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
