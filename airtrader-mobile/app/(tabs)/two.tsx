import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { trpc } from '@/lib/trpc';

export default function TabTwoScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const chatListQuery = trpc.chat.list.useQuery(undefined, {
    retry: 1,
  });
  const chats = chatListQuery.data ?? [];
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredChats = useMemo(() => {
    if (!normalizedQuery) {
      return chats;
    }
    return chats.filter((chat) => {
      const name = chat.name.toLowerCase();
      const lastMessage = chat.lastMessage.toLowerCase();
      return name.includes(normalizedQuery) || lastMessage.includes(normalizedQuery);
    });
  }, [chats, normalizedQuery]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VIP Club Chats</Text>
      <Text style={styles.subtitle}>Open a room to read updates and continue discussion.</Text>
      <TextInput
        style={styles.searchInput}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by chat name or message..."
        placeholderTextColor="#9ca3af"
        autoCapitalize="none"
      />
      {chatListQuery.isLoading ? <Text>Loading chats...</Text> : null}
      {chatListQuery.error ? <Text>Failed to load chats from API.</Text> : null}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Link href={`../chat/${item.id}` as const} asChild>
            <Pressable style={styles.chatCard}>
              <Text style={styles.chatName}>{item.name}</Text>
              <Text style={styles.chatLastMessage}>{item.lastMessage}</Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          !chatListQuery.isLoading && !chatListQuery.error ? (
            <Text style={styles.empty}>
              {normalizedQuery
                ? 'No chats found for your search query.'
                : 'You are not a participant in any chats yet.'}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    opacity: 0.8,
  },
  searchInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  chatCard: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.4)',
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
  },
  chatLastMessage: {
    marginTop: 4,
    opacity: 0.8,
  },
  empty: {
    opacity: 0.75,
    textAlign: 'center',
    marginTop: 20,
  },
});
