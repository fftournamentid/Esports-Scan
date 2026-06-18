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
import { signUp } from '@/services/authService';
import { useColors } from '@/hooks/useColors';

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !freeFireUid.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signUp(email, password, name, freeFireUid);
      router.replace('/' as never);
    } catch (e: unknown) {
      const msg = (e as { code?: string }).code ?? '';
      if (msg.includes('email-already-in-use')) {
        setError('This email is already registered. Please sign in instead.');
      } else if (msg.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else if (msg.includes('weak-password')) {
        setError('Password is too weak. Please use a stronger password.');
      } else {
        setError('Registration failed. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const s = makeStyles(colors);

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.logoWrap}>
          <Image source={require('@/assets/images/icon.png')} style={s.logo} />
          <Text style={[s.brand, { color: colors.primary }]}>FREE FIRE</Text>
          <Text style={[s.brandSub, { color: colors.mutedForeground }]}>TOURNAMENT HUB</Text>
        </View>

        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.title, { color: colors.foreground }]}>Create Account</Text>
          <Text style={[s.subtitle, { color: colors.mutedForeground }]}>Join the tournament community</Text>

          {!!error && (
            <View style={[s.errorBox, { backgroundColor: colors.destructive + '18', borderColor: colors.destructive + '44' }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[s.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          )}

          <Field
            label="FULL NAME"
            icon="user"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
            colors={colors}
          />
          <Field
            label="EMAIL"
            icon="mail"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            colors={colors}
          />
          <Field
            label="FREE FIRE UID"
            icon="hash"
            placeholder="Your in-game UID"
            value={freeFireUid}
            onChangeText={setFreeFireUid}
            keyboardType="numeric"
            colors={colors}
          />

          <View style={s.fieldGroup}>
            <Text style={[s.label, { color: colors.mutedForeground }]}>PASSWORD</Text>
            <View style={[s.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder="Min 6 characters"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>

          <Field
            label="CONFIRM PASSWORD"
            icon="lock"
            placeholder="Re-enter password"
            value={confirmPw}
            onChangeText={setConfirmPw}
            secureTextEntry={!showPass}
            colors={colors}
          />

          <TouchableOpacity
            style={[s.btn, { backgroundColor: loading ? colors.primary + '88' : colors.primary }]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color="#000" />
              : <Text style={s.btnText}>Create Account</Text>
            }
          </TouchableOpacity>

          <View style={s.dividerRow}>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.mutedForeground }]}>HAVE AN ACCOUNT?</Text>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            style={[s.outlineBtn, { borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => router.push('/auth/login' as never)}
          >
            <Text style={[s.outlineBtnText, { color: colors.foreground }]}>Sign In Instead</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, colors,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'words';
  secureTextEntry?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  const s = makeStyles(colors);
  return (
    <View style={s.fieldGroup}>
      <Text style={[s.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[s.inputWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Feather name={icon} size={16} color={colors.mutedForeground} style={s.inputIcon} />
        <TextInput
          style={[s.input, { color: colors.foreground }]}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType ?? 'default'}
          autoCapitalize={autoCapitalize ?? 'words'}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
        />
      </View>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { flexGrow: 1, paddingHorizontal: 24 },
    logoWrap: { alignItems: 'center', marginBottom: 24, gap: 6 },
    logo: { width: 60, height: 60, borderRadius: 14, marginBottom: 6 },
    brand: { fontSize: 20, fontWeight: '800', letterSpacing: 3 },
    brandSub: { fontSize: 10, letterSpacing: 4, marginTop: -4 },
    card: { borderRadius: 20, borderWidth: 1, padding: 24, gap: 14 },
    title: { fontSize: 22, fontWeight: '700' },
    subtitle: { fontSize: 13, marginTop: -6 },
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
      height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4,
    },
    btnText: { fontSize: 16, fontWeight: '700', color: '#000' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    divider: { flex: 1, height: 1 },
    dividerText: { fontSize: 10, fontWeight: '600' },
    outlineBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
    outlineBtnText: { fontSize: 15, fontWeight: '600' },
  });
}
