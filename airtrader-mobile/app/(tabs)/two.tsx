import { FlatList, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { trpc } from '@/lib/trpc';

export default function TabTwoScreen() {
  const chatListQuery = trpc.chat.list.useQuery(undefined, {
    retry: 1,
  });
  const chats = chatListQuery.data ?? [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VIP Club Chats</Text>
      <Text style={styles.subtitle}>Open a room to read updates and continue discussion.</Text>
      {chatListQuery.isLoading ? <Text>Loading chats...</Text> : null}
      {chatListQuery.error ? <Text>Failed to load chats from API.</Text> : null}
      <FlatList
        data={chats}
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
            <Text style={styles.empty}>You are not a participant in any chats yet.</Text>
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
