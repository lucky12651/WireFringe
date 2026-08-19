import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getApiBase } from '../api';
import { useAuth } from '../auth';
import { BrandMark, PrimaryButton } from '../components';
import { fonts } from '../theme';

export default function AccountScreen({ navigation, colors }) {
  const insets = useSafeAreaInsets();
  const { user, follows, logout, themeName, setThemeName, isAuthed } = useAuth();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.line }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Account</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <BrandMark colors={colors} size={30} />
        <Text style={[styles.tag, { color: colors.inkTertiary }]}>
          Tech, science, culture — and how technology makes us feel.
        </Text>

        {isAuthed ? (
          <View style={[styles.card, { borderColor: colors.line, backgroundColor: colors.bgElevated }]}>
            <Text style={[styles.name, { color: colors.ink }]}>
              {user.displayName || user.username}
            </Text>
            <Text style={[styles.meta, { color: colors.inkTertiary }]}>{user.email || user.username}</Text>
            <Text style={[styles.meta, { color: colors.inkMuted, marginTop: 8 }]}>
              Following {follows.length} {follows.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        ) : (
          <View style={[styles.card, { borderColor: colors.line, backgroundColor: colors.bgElevated }]}>
            <Text style={[styles.name, { color: colors.ink }]}>Read signed in</Text>
            <Text style={[styles.meta, { color: colors.inkSecondary, marginBottom: 14 }]}>
              Follow authors, personalize For You, and join comments.
            </Text>
            <PrimaryButton colors={colors} label="Sign in" onPress={() => navigation.navigate('Login')} />
          </View>
        )}

        <Text style={[styles.label, { color: colors.inkTertiary }]}>Appearance</Text>
        <View style={styles.row}>
          {['dark', 'light'].map((name) => {
            const on = themeName === name;
            return (
              <Pressable
                key={name}
                onPress={() => setThemeName(name)}
                style={[
                  styles.themeBtn,
                  {
                    borderColor: on ? colors.mint : colors.line,
                    backgroundColor: on ? colors.mintDim : colors.bgElevated,
                  },
                ]}
              >
                <Text style={{ color: on ? colors.mint : colors.inkSecondary, fontFamily: fonts.sansSb }}>
                  {name === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.hint, { color: colors.inkMuted }]}>API {getApiBase()}</Text>

        {isAuthed ? (
          <Pressable onPress={logout} style={{ marginTop: 20 }}>
            <Text style={{ color: colors.danger, fontFamily: fonts.sansBd }}>Sign out</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: fonts.sansBlack, fontSize: 28, letterSpacing: -0.6 },
  body: { padding: 16, paddingBottom: 40 },
  tag: { fontFamily: fonts.sans, fontSize: 13, marginTop: 8, marginBottom: 20, maxWidth: 320, lineHeight: 19 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 22 },
  name: { fontFamily: fonts.sansBd, fontSize: 18, marginBottom: 4 },
  meta: { fontFamily: fonts.sans, fontSize: 13 },
  label: {
    fontFamily: fonts.monoBd,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontFamily: fonts.mono, fontSize: 11, marginTop: 28 },
});
