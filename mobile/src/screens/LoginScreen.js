import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiBase } from '../api';
import { useAuth } from '../auth';
import { BrandMark, PrimaryButton } from '../components';
import { fonts } from '../theme';

export default function LoginScreen({ navigation, colors }) {
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signup(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err?.message || 'Could not sign in.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const field = (extra = {}) => ({
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bgElevated,
    color: colors.ink,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 16,
    marginBottom: 10,
    ...extra,
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom || 24 }}>
        <Pressable onPress={() => navigation.goBack()} style={{ paddingVertical: 8 }}>
          <Text style={{ color: colors.mint, fontFamily: fonts.sansSb }}>Back</Text>
        </Pressable>
        <BrandMark colors={colors} size={32} />
        <Text style={[styles.lead, { color: colors.inkSecondary }]}>
          {mode === 'login' ? 'Sign in to follow desks and join the conversation.' : 'Create a reader account.'}
        </Text>

        {mode === 'signup' ? (
          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Display name"
            placeholderTextColor={colors.inkMuted}
            style={field()}
          />
        ) : null}
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          placeholderTextColor={colors.inkMuted}
          style={field()}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor={colors.inkMuted}
          style={field()}
        />
        {error ? <Text style={{ color: colors.danger, marginBottom: 10, fontFamily: fonts.sans }}>{error}</Text> : null}
        <PrimaryButton
          colors={colors}
          disabled={busy || !email.trim() || !password}
          label={busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          onPress={submit}
        />
        <Pressable
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: colors.inkSecondary, fontFamily: fonts.sans }}>
            {mode === 'login' ? 'Need an account? Create one' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
        <Text style={{ color: colors.inkMuted, fontFamily: fonts.mono, fontSize: 11, marginTop: 22 }}>
          Server {getApiBase()}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginTop: 10, marginBottom: 22, maxWidth: 320 },
});
