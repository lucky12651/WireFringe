import React, { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints, getApiBase, mediaUrl } from '../api';
import { useAuth } from '../auth';
import { Loading, MonoLabel } from '../components';
import { displayName, excerpt, htmlToBlocks, relativeTime } from '../format';
import { fonts } from '../theme';

export default function ArticleScreen({ route, navigation, colors }) {
  const { id, preview } = route.params || {};
  const insets = useSafeAreaInsets();
  const { user, token, follows, follow, unfollow, isAuthed } = useAuth();
  const [post, setPost] = useState(preview || null);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setError('');
    try {
      const [story, thread] = await Promise.all([
        endpoints.post(id),
        endpoints.comments(id).catch(() => []),
      ]);
      setPost(story);
      setComments(Array.isArray(thread) ? thread : []);
    } catch (err) {
      setError(err?.message || 'Could not load this story.');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const author = displayName(post);
  const topic = post?.bucket || '';
  const followingAuthor = follows.some(
    (f) => f.kind === 'author' && String(f.target).toLowerCase() === author.toLowerCase()
  );
  const followingTopic = follows.some(
    (f) => f.kind === 'topic' && String(f.target).toLowerCase() === topic.toLowerCase()
  );
  const blocks = useMemo(
    () => htmlToBlocks(post?.content || '', getApiBase()),
    [post?.content]
  );
  const hero = mediaUrl(post?.ogImg);

  const toggle = async (kind, target, on) => {
    if (!isAuthed) {
      navigation.navigate('Login');
      return;
    }
    try {
      if (on) await unfollow(kind, target);
      else await follow(kind, target);
    } catch (err) {
      setError(err?.message || 'Follow failed.');
    }
  };

  const submitComment = async () => {
    if (!draft.trim()) return;
    if (!isAuthed) {
      navigation.navigate('Login');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await endpoints.addComment(id, draft.trim(), token);
      setDraft('');
      const thread = await endpoints.comments(id);
      setComments(Array.isArray(thread) ? thread : []);
    } catch (err) {
      setError(err?.message || 'Could not post comment.');
    } finally {
      setBusy(false);
    }
  };

  if (!post) return <Loading colors={colors} />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={[styles.nav, { borderBottomColor: colors.line }]}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={{ color: colors.mint, fontFamily: fonts.sansSb }}>Back</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Share.share({
              message: `${post.title}\n${getApiBase().replace(':8000', ':3000')}/post/${post.id}`,
            }).catch(() => {})
          }
        >
          <Text style={{ color: colors.inkSecondary, fontFamily: fonts.sansSb }}>Share</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 + (insets.bottom || 24) }}>
        {hero ? <Image source={{ uri: hero }} style={styles.hero} resizeMode="cover" /> : null}
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          {topic ? (
            <MonoLabel colors={colors} style={{ color: colors.mint, marginBottom: 8 }}>
              {topic}
            </MonoLabel>
          ) : null}
          <Text style={[styles.title, { color: colors.ink }]}>{post.title}</Text>
          <Text style={[styles.byline, { color: colors.inkTertiary }]}>
            {author}
            {post.date ? `  ·  ${relativeTime(post.date)}` : ''}
            {post.readMinutes ? `  ·  ${post.readMinutes} min read` : ''}
          </Text>
          {excerpt(post, 180) && !blocks.length ? (
            <Text style={[styles.dek, { color: colors.inkSecondary }]}>{excerpt(post, 220)}</Text>
          ) : null}

          <View style={styles.followRow}>
            {author ? (
              <Pressable
                onPress={() => toggle('author', author, followingAuthor)}
                style={[
                  styles.followBtn,
                  {
                    borderColor: followingAuthor ? colors.mint : colors.line,
                    backgroundColor: followingAuthor ? colors.mintDim : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: followingAuthor ? colors.mint : colors.inkSecondary, fontFamily: fonts.sansSb, fontSize: 12 }}>
                  {followingAuthor ? 'Following author' : 'Follow author'}
                </Text>
              </Pressable>
            ) : null}
            {topic ? (
              <Pressable
                onPress={() => toggle('topic', topic, followingTopic)}
                style={[
                  styles.followBtn,
                  {
                    borderColor: followingTopic ? colors.mint : colors.line,
                    backgroundColor: followingTopic ? colors.mintDim : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: followingTopic ? colors.mint : colors.inkSecondary, fontFamily: fonts.sansSb, fontSize: 12 }}>
                  {followingTopic ? 'Following topic' : 'Follow topic'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}

          {blocks.map((block, i) =>
            block.type === 'image' && block.uri ? (
              <Image key={`img-${i}`} source={{ uri: block.uri }} style={styles.inlineImg} resizeMode="cover" />
            ) : (
              <Text key={`p-${i}`} style={[styles.body, { color: colors.ink }]}>
                {block.text}
              </Text>
            )
          )}

          <View style={[styles.comments, { borderTopColor: colors.line }]}>
            <Text style={[styles.commentTitle, { color: colors.ink }]}>
              Comments {comments.length ? `(${comments.length})` : ''}
            </Text>
            {isAuthed ? (
              <View>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={`Comment as ${user.displayName || user.username}`}
                  placeholderTextColor={colors.inkMuted}
                  multiline
                  style={[
                    styles.composer,
                    { color: colors.ink, borderColor: colors.line, backgroundColor: colors.bgElevated },
                  ]}
                />
                <Pressable onPress={submitComment} disabled={busy || !draft.trim()}>
                  <Text style={{ color: colors.mint, fontFamily: fonts.sansBd, marginBottom: 16 }}>
                    {busy ? 'Posting…' : 'Post comment'}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={() => navigation.navigate('Login')} style={{ marginBottom: 16 }}>
                <Text style={{ color: colors.mint, fontFamily: fonts.sansSb }}>Sign in to comment</Text>
              </Pressable>
            )}
            {comments.map((c) => (
              <View key={c.id} style={[styles.comment, { borderBottomColor: colors.line }]}>
                <Text style={{ color: colors.ink, fontFamily: fonts.sansSb, marginBottom: 4 }}>
                  {c.displayName || c.name || c.username || 'Reader'}
                </Text>
                <Text style={{ color: colors.inkSecondary, fontFamily: fonts.sans, lineHeight: 20 }}>
                  {c.comment || c.body || c.content}
                </Text>
              </View>
            ))}
            {!comments.length ? (
              <Text style={{ color: colors.inkMuted, fontFamily: fonts.sans }}>No comments yet.</Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111' },
  title: { fontFamily: fonts.sansBlack, fontSize: 28, lineHeight: 34, letterSpacing: -0.7, marginBottom: 10 },
  byline: { fontFamily: fonts.mono, fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 14 },
  dek: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, marginBottom: 14 },
  followRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  followBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  body: { fontFamily: fonts.sans, fontSize: 17, lineHeight: 27, marginBottom: 14 },
  inlineImg: { width: '100%', aspectRatio: 16 / 9, borderRadius: 8, marginBottom: 14, backgroundColor: '#111' },
  comments: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 18 },
  commentTitle: { fontFamily: fonts.sansBd, fontSize: 18, marginBottom: 12 },
  composer: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    marginBottom: 8,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  comment: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
});
