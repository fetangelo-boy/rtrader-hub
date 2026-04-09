import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "@/services/chatApi";
import type { SendMessagePayload } from "@/types/chat";

export const useCurrentUser = () =>
  useQuery({
    queryKey: ["currentUser"],
    queryFn: chatApi.getCurrentUser,
    staleTime: Infinity,
  });

export const useChannels = () =>
  useQuery({
    queryKey: ["channels"],
    queryFn: chatApi.getChannels,
    staleTime: 30_000,
  });

export const useMessages = (channelId: string | null) =>
  useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => chatApi.getMessages(channelId!),
    enabled: !!channelId,
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatApi.sendMessage(payload),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ["messages", newMessage.channelId],
        (prev: ReturnType<typeof useMessages>["data"]) =>
          prev ? [...prev, newMessage] : [newMessage]
      );
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: (_data, messageId) => {
      queryClient.setQueriesData({ queryKey: ["messages"] }, (prev: ReturnType<typeof useMessages>["data"]) =>
        prev ? prev.filter((m) => m.id !== messageId) : prev
      );
    },
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (channelId: string) => chatApi.markAsRead(channelId),
    onSuccess: (_data, channelId) => {
      queryClient.setQueryData(["channels"], (prev: ReturnType<typeof useChannels>["data"]) =>
        prev?.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
      );
    },
  });
};