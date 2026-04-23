import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { useMemo, useState } from 'react';

import { Text, View } from '@/components/Themed';
import { trpc } from '@/lib/trpc';

export default function ChatDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');
  const utils = trpc.useUtils();

  const chatInfoQuery = trpc.chat.getChatInfo.useQuery(
    { chatId: id ?? '' },
    { enabled: Boolean(id) }
  );
  const messagesQuery = trpc.chat.getMessages.useQuery(
    { chatId: id ?? '', limit: 100 },
    { enabled: Boolean(id) }
  );

  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: async () => {
      setNewMessage('');
      await utils.chat.getMessages.invalidate({ chatId: id ?? '', limit: 100 });
      await utils.chat.list.invalidate();
    },
  });

  const chat = chatInfoQuery.data;
  const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);
  const isLoading = chatInfoQuery.isLoading || messagesQuery.isLoading;
  const hasError = chatInfoQuery.isError || messagesQuery.isError;

  if (!chat) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Chat' }} />
        <Text style={styles.title}>
          {hasError ? 'Access denied or chat unavailable' : isLoading ? 'Loading chat...' : 'Chat not found'}
        </Text>
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
            <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet.</Text>}
      />
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
        />
        <Pressable
          style={styles.sendButton}
          onPress={() => sendMutation.mutate({ chatId: id ?? '', content: newMessage.trim() })}
          disabled={!newMessage.trim() || sendMutation.isPending}
        >
          <Text style={styles.sendButtonText}>{sendMutation.isPending ? '...' : 'Send'}</Text>
        </Pressable>
      </View>
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
  composer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f9fafb',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sendButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#00D4FF',
  },
  sendButtonText: {
    color: '#0b1120',
    fontWeight: '700',
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
