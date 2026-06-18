import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTournament } from '@/context/TournamentContext';
import { useColors } from '@/hooks/useColors';

export default function AdminLoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { authenticateAdmin, isAdminAuthenticated } = useTournament();
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;

  if (isAdminAuthenticated) {
    return <Redirect href="/admin-dashboard" />;
  }

  const handleLogin = () => {
    if (authenticateAdmin(password)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/admin-dashboard' as never);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>ADMIN ACCESS</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.center}>
        <View style={[styles.lockIcon, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]}>
          <Feather name="shield" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>Admin Panel</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Enter admin password to continue</Text>

        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: error ? colors.destructive : colors.border }]}>
            <TextInput
              value={password}
              onChangeText={(v) => { setPassword(v); setError(''); }}
              placeholder="Enter password"
              placeholderTextColor={colors.mutedForeground + '88'}
              secureTextEntry={!showPass}
              style={[styles.input, { color: colors.foreground }]}
              onSubmitEditing={handleLogin}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, { backgroundColor: password ? colors.primary : colors.muted }]}
          onPress={handleLogin}
          disabled={!password}
          activeOpacity={0.85}
        >
          <Feather name="log-in" size={16} color={password ? colors.primaryForeground : colors.mutedForeground} />
          <Text style={[styles.loginBtnText, { color: password ? colors.primaryForeground : colors.mutedForeground }]}>
            LOGIN
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  backBtn: { padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 },
  lockIcon: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, textAlign: 'center' },
  inputCard: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 16, gap: 8 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  input: { flex: 1, padding: 12, fontSize: 15, fontWeight: '500' },
  eyeBtn: { padding: 12 },
  error: { fontSize: 12 },
  loginBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12 },
  loginBtnText: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
});
