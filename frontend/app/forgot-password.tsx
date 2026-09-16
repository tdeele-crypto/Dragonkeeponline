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
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/colors';
import { api } from '@/utils/api';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!email.trim()) {
      setError('Indtast din e-mailadresse.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (e: any) {
      setError(e?.message || 'Noget gik galt. Prøv igen senere.');
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
          <Ionicons name="lock-closed-outline" size={44} color={COLORS.primary} />
          <Text style={styles.title}>Glemt adgangskode?</Text>
          <Text style={styles.subtitle}>Vi sender dig et link til at nulstille den</Text>
        </View>

        {sent ? (
          <View style={styles.successBox} testID="forgot-success">
            <Ionicons name="mail-unread-outline" size={40} color={COLORS.success} />
            <Text style={styles.successText}>
              Hvis der findes en konto med denne e-mail, har vi sendt et nulstillingslink. Tjek din indbakke
              (og evt. spam-mappen).
            </Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')} activeOpacity={0.85}>
              <Text style={styles.buttonText}>Tilbage til login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                testID="forgot-email-input"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="dig@eksempel.dk"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              testID="forgot-submit-button"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Send nulstillingslink</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkRow} onPress={() => router.replace('/login')}>
              <Ionicons name="chevron-back" size={16} color={COLORS.primary} />
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
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
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
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22, gap: 4 },
  link: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  successBox: { alignItems: 'center', gap: 16, paddingHorizontal: 8 },
  successText: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
});
