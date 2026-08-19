import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { endpoints } from '../api';
import { StoryCard } from '../components';
import { fonts } from '../theme';

export default function SearchScreen({ navigation, colors }) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setResults([]);
      setError('');
      return undefined;
    }
    const t = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const data = await endpoints.search(query);
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || 'Search failed.');
      } finally {
        setBusy(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.ink }]}>Search</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search stories, tags, authors…"
          placeholderTextColor={colors.inkMuted}
          autoCorrect={false}
          style={[
            styles.input,
            {
              color: colors.ink,
              backgroundColor: colors.bgElevated,
              borderColor: colors.line,
            },
          ]}
        />
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StoryCard
            post={item}
            colors={colors}
            onPress={() => navigation.navigate('Article', { id: item.id, preview: item })}
          />
        )}
        ListEmptyComponent={
          <Text style={{ color: colors.inkTertiary, padding: 24, fontFamily: fonts.sans }}>
            {error
              ? error
              : q.trim().length < 2
                ? 'Type at least two characters.'
                : busy
                  ? 'Searching…'
                  : 'No matching stories.'}
          </Text>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 28 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  title: { fontFamily: fonts.sansBlack, fontSize: 28, letterSpacing: -0.6, marginBottom: 12 },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
});
