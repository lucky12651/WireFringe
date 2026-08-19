import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { mediaUrl } from './api';
import { fonts } from './theme';
import { displayName, excerpt, relativeTime } from './format';

export function BrandMark({ colors, size = 26 }) {
  return (
    <Text style={{ fontWeight: '800', fontSize: size, letterSpacing: -0.8, color: colors.ink }}>
      Wire<Text style={{ color: colors.mint, fontStyle: 'italic' }}>F</Text>ringe
    </Text>
  );
}

export function MonoLabel({ children, colors, style }) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.monoBd,
          fontSize: 10,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: colors.inkTertiary,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function ScreenState({ colors, children }) {
  const body =
    typeof children === 'string' ? (
      <Text style={{ color: colors.inkSecondary, fontSize: 14 }}>{children}</Text>
    ) : (
      children || null
    );
  return (
    <View style={[styles.center, { backgroundColor: colors.bg }]}>{body}</View>
  );
}

export function Loading({ colors }) {
  return (
    <ScreenState colors={colors}>
      <ActivityIndicator color={colors.mint} />
    </ScreenState>
  );
}

export function FeaturedCard({ post, colors, onPress }) {
  if (!post) return null;
  const img = mediaUrl(post.ogImg);
  return (
    <Pressable onPress={onPress} style={[styles.featured, { backgroundColor: colors.bgCard }]}>
      {img ? (
        <Image source={{ uri: img }} style={styles.featuredImg} resizeMode="cover" />
      ) : (
        <View style={[styles.featuredImg, { backgroundColor: colors.bgHover }]} />
      )}
      <View style={[styles.featuredCopy, { backgroundColor: colors.bgElevated }]}>
        {post.bucket ? (
          <MonoLabel colors={colors} style={{ color: colors.mint, marginBottom: 8 }}>
            {String(post.bucket)}
          </MonoLabel>
        ) : null}
        <Text style={[styles.featuredTitle, { color: colors.ink }]} numberOfLines={4}>
          {String(post.title || '')}
        </Text>
        <Text style={[styles.featuredMeta, { color: colors.inkTertiary }]}>
          {displayName(post)}
          {post.date ? `  ·  ${relativeTime(post.date)}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

export function StoryCard({ post, colors, onPress }) {
  const img = mediaUrl(post.ogImg);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.line }]}
    >
      <View style={styles.rowCopy}>
        {post.bucket ? (
          <MonoLabel colors={colors} style={{ color: colors.mint, marginBottom: 6 }}>
            {post.bucket}
          </MonoLabel>
        ) : null}
        <Text style={[styles.rowTitle, { color: colors.ink }]} numberOfLines={3}>
          {String(post.title || '')}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.inkTertiary }]}>
          {displayName(post)}
          {post.date ? `  ·  ${relativeTime(post.date)}` : ''}
          {post.readMinutes ? `  ·  ${post.readMinutes} MIN` : ''}
        </Text>
      </View>
      {img ? (
        <Image source={{ uri: img }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, { backgroundColor: colors.bgHover }]} />
      )}
    </Pressable>
  );
}

export function Segmented({ colors, value, options, onChange }) {
  return (
    <View
      style={[
        styles.seg,
        { backgroundColor: colors.bgSecondary, borderColor: colors.line },
      ]}
    >
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segBtn,
              on && { backgroundColor: colors.mint },
            ]}
          >
            <Text
              style={{
                fontFamily: fonts.monoBd,
                fontSize: 10,
                letterSpacing: 1.4,
                color: on ? colors.mintInk : colors.inkMuted,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PrimaryButton({ colors, label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.primary,
        { backgroundColor: colors.ink, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      <Text style={{ color: colors.bg, fontFamily: fonts.sansBd, fontSize: 13, letterSpacing: 0.4 }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  featured: { borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  featuredImg: { width: '100%', height: 210, backgroundColor: '#111' },
  featuredCopy: { padding: 16 },
  featuredTitle: {
    fontWeight: '800',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  featuredDek: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  featuredMeta: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  rowMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  thumb: { width: 96, height: 72, borderRadius: 6, backgroundColor: '#111' },
  seg: {
    flexDirection: 'row',
    alignSelf: 'center',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
    marginVertical: 10,
  },
  segBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  primary: {
    height: 46,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
