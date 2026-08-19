import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../api';
import { useAuth } from '../auth';
import { BrandMark, FeaturedCard, Loading, Segmented, StoryCard } from '../components';
import { postMatchesFollows } from '../format';
import { fonts, SECTIONS } from '../theme';

export default function HomeScreen({ navigation, colors }) {
  const insets = useSafeAreaInsets();
  const { user, follows } = useAuth();
  const [posts, setPosts] = useState([]);
  const [hero, setHero] = useState([]);
  const [tab, setTab] = useState('latest');
  const [section, setSection] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (soft = false) => {
    if (!soft) setLoading(true);
    setError('');
    try {
      const [list, front] = await Promise.all([
        endpoints.posts(),
        endpoints.frontpage().catch(() => null),
      ]);
      setPosts((Array.isArray(list) ? list : []).slice(0, 50));
      setHero(Array.isArray(front?.hero) ? front.hero.slice(0, 4) : []);
    } catch (err) {
      setError(err?.message || 'Could not load stories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load])
  );

  const openPost = (post) => navigation.navigate('Article', { id: post.id, preview: post });

  const filtered = useMemo(() => {
    let list = posts;
    if (tab === 'following') {
      list = user ? list.filter((p) => postMatchesFollows(p, follows)) : [];
    }
    if (section !== 'All') {
      list = list.filter((p) => p.bucket === section);
    }
    return list;
  }, [posts, tab, section, user, follows]);

  const featured = hero[0] || filtered[0] || posts[0];
  const rest = filtered.filter((p) => p.id !== featured?.id);

  if (loading && !posts.length) return <Loading colors={colors} />;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.line }]}>
        <BrandMark colors={colors} />
      </View>

      <FlatList
        data={rest}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor={colors.mint}
          />
        }
        ListHeaderComponent={
          <View>
            <Segmented
              colors={colors}
              value={tab}
              onChange={setTab}
              options={[
                { value: 'latest', label: 'LATEST' },
                { value: 'following', label: 'FOLLOWING' },
              ]}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {SECTIONS.map((name) => {
                const on = section === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => setSection(name)}
                    style={[
                      styles.chip,
                      {
                        borderColor: on ? colors.mint : colors.line,
                        backgroundColor: on ? colors.mintDim : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.sansSb,
                        fontSize: 12,
                        color: on ? colors.mint : colors.inkSecondary,
                      }}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {error ? (
              <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
            ) : null}

            {tab === 'following' && !user ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.inkSecondary }]}>
                  Sign in to follow writers and topics.
                </Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text style={{ color: colors.mint, fontFamily: fonts.sansBd, marginTop: 10 }}>
                    Sign in
                  </Text>
                </Pressable>
              </View>
            ) : tab === 'following' && !follows.length ? (
              <View style={styles.empty}>
                <Text style={[styles.emptyText, { color: colors.inkSecondary }]}>
                  You are not following anyone yet. Open a story and tap Follow.
                </Text>
              </View>
            ) : featured && tab === 'latest' && section === 'All' ? (
              <FeaturedCard
                post={featured}
                colors={colors}
                onPress={() => openPost(featured)}
              />
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <StoryCard post={item} colors={colors} onPress={() => openPost(item)} />
        )}
        ListEmptyComponent={
          tab === 'following' ? null : (
            <Text style={[styles.emptyText, { color: colors.inkTertiary, padding: 24 }]}>
              {error || 'No stories in this section yet.'}
            </Text>
          )
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chips: { gap: 8, paddingBottom: 12, paddingRight: 8 },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontFamily: fonts.mono, fontSize: 12, marginBottom: 10 },
  empty: { paddingVertical: 28, alignItems: 'center' },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
