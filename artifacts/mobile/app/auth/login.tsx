import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signIn } from '@/services/authService';
import { useColors } from '@/hooks/useColors';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      // Do NOT navigate here — AuthGate reads userProfile.role and routes
      // admin → /admin-dashboard, user → /
    } catch (e: unknown) {
      setLoading(false);
      const msg = (e as { code?: string; message?: string }).code ?? '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('too-many-requests')) {
        setError('Too many attempts. Please wait and try again.');
      } else {
        setError('Login failed. Please check your connection and try again.');
      }
    }
  }

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.logoWrap}>
          <Image source={require('@/assets/images/icon.png')} style={s.logo} />
          <Text style={[s.brand, { color: colors.primary }]}>FIRST BOOYAH</Text>
          <Text style={[s.brandSub, { color: colors.mutedForeground }]}>TOURNAMENT HUB</Text>
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.title, { color: colors.foreground }]}>Welcome Back</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Sign in to your account</Text>

          {!!error && (
            <View style={[s.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[s.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>EMAIL</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder="your@email.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                editable={!loading}
              />
            </View>
          </View>

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn} disabled={loading}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, { backgroundColor: loading ? colors.primary + '88' : colors.primary }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={s.btnText}>Sign In</Text>
            }
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.mutedForeground }]}>OR</Text>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[s.outlineBtn, { borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/auth/signup' as never)}
            disabled={loading}
          >
            <Text style={[s.outlineBtnText, { color: colors.foreground }]}>Create New Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={[s.footerNote, { color: colors.mutedForeground }]}>
          By continuing, you agree to our terms of service.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24 },
    logoWrap: { alignItems: 'center', marginBottom: 32, gap: 6 },
    logo: { width: 72, height: 72, borderRadius: 16, marginBottom: 8 },
    brand: { fontSize: 22, fontWeight: '800', letterSpacing: 3 },
    brandSub: { fontSize: 11, letterSpacing: 4, marginTop: -4 },
    card: {
      borderRadius: 20, borderWidth: 1, padding: 24, gap: 16,
    },
    title: { fontSize: 22, fontWeight: '700' },
    subtitle: { fontSize: 13, marginTop: -8 },
    errorBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      padding: 12, borderRadius: 10, borderWidth: 1,
    },
    errorText: { fontSize: 13, flex: 1 },
    fieldGroup: { gap: 6 },
    label: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
      paddingHorizontal: 12, height: 50,
    },
    inputIcon: { marginRight: 8 },
    input: { flex: 1, fontSize: 15 },
    eyeBtn: { padding: 4 },
    btn: {
      height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
      marginTop: 4,
    },
    btnText: { fontSize: 16, fontWeight: '700', color: '#000' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    divider: { flex: 1, height: 1 },
    dividerText: { fontSize: 11, fontWeight: '600' },
    outlineBtn: {
      height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
    },
    outlineBtnText: { fontSize: 15, fontWeight: '600' },
    footerNote: { textAlign: 'center', fontSize: 11, marginTop: 20 },
  });
}
