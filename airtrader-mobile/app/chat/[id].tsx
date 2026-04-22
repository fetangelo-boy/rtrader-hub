import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { chatMessages, chats } from '@/constants/mockData';

export default function ChatDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const chat = chats.find((item) => item.id === id);
  const messages = chatMessages[id ?? ''] ?? [];

  if (!chat) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chat' }} />
        <Text style={styles.title}>Chat not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: chat.title }} />
      <FlatList
        contentContainerStyle={styles.list}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.author}>{item.author}</Text>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
  },
  author: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 24,
  },
  title: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 20,
    fontWeight: '700',
  },
  backButton: {
    marginTop: 18,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#00D4FF',
  },
  backButtonText: {
    color: '#111827',
    fontWeight: '700',
  },
});
