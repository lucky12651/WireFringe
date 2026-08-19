import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../api';
import { useAuth } from '../auth';
import { Loading, StoryCard } from '../components';
import { fonts } from '../theme';

export default function ForYouScreen({ navigation, colors }) {
  const insets = useSafeAreaInsets();
  const { user, ready } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await endpoints.forYou(30);
      setPosts(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.message || 'Could not load For You.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!ready) return;
      load();
    }, [ready, load])
  );

  if (!ready || (loading && !posts.length)) return <Loading colors={colors} />;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.line }]}>
        <Text style={[styles.title, { color: colors.ink }]}>For You</Text>
        <Text style={[styles.sub, { color: colors.inkTertiary }]}>
          {user ? 'Stories matched to what you follow.' : 'Latest desk. Sign in for a personal feed.'}
        </Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.mint}
          />
        }
        renderItem={({ item }) => (
          <StoryCard
            post={item}
            colors={colors}
            onPress={() => navigation.navigate('Article', { id: item.id, preview: item })}
          />
        )}
        ListHeaderComponent={
          !user ? (
            <Pressable
              onPress={() => navigation.navigate('Login')}
              style={[styles.banner, { borderColor: colors.line, backgroundColor: colors.bgElevated }]}
            >
              <Text style={{ color: colors.ink, fontFamily: fonts.sansSb, fontSize: 14 }}>
                Sign in for a personal For You feed
              </Text>
              <Text style={{ color: colors.mint, fontFamily: fonts.sansBd, marginTop: 6 }}>
                Continue
              </Text>
            </Pressable>
          ) : error ? (
            <Text style={{ color: colors.danger, fontFamily: fonts.mono, fontSize: 12, marginBottom: 10 }}>
              {error}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={{ color: colors.inkTertiary, padding: 24, fontFamily: fonts.sans }}>
            {error || 'No recommendations yet. Follow a topic or author from a story.'}
          </Text>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28, paddingTop: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontFamily: fonts.sansBlack, fontSize: 28, letterSpacing: -0.6 },
  sub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 4 },
  banner: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 8 },
});
