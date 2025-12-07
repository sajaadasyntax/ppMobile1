import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { socketService } from "../services/socketService";

interface Message {
  id: string;
  text: string;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    memberDetails?: {
      fullName: string;
    };
  };
}

export default function ChatConversationScreen() {
  const { roomId, title } = useLocalSearchParams<{ roomId: string; title: string }>();
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isLoadingMoreRef = useRef(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketUnsubscribeRef = useRef<(() => void) | null>(null);

  const fetchMessages = async (cursor?: string, isLoadMore: boolean = false) => {
    if (!token || !roomId) {
      if (!token) router.replace("/login");
      // Reset ref if we're returning early during load more
      if (isLoadMore) {
        isLoadingMoreRef.current = false;
        setLoadingMore(false);
      }
      return;
    }

    // Skip polling if we're currently loading more messages
    if (!isLoadMore && isLoadingMoreRef.current) {
      return;
    }

    try {
      if (!isLoadMore) {
        setError(null);
      }
      // Note: isLoadingMoreRef is set by loadMoreMessages before calling fetchMessages
      // No need to set it here as it's already set synchronously
      
      const data = await apiService.getChatMessages(roomId, cursor);
      
      if (isLoadMore) {
        // Append older messages to the end (which appears at top in inverted list)
        setMessages((prev) => [...prev, ...(data.messages || [])]);
      } else {
        // For initial load or polling: merge new messages intelligently
        setMessages((prev) => {
          if (prev.length === 0) {
            // Initial load - messages should be in reverse order for inverted list
            // (newest first, which will appear at the bottom)
            return (data.messages || []).reverse();
          }
          
          // Polling: only add messages that don't already exist
          const existingIds = new Set(prev.map(m => m.id));
          const newMessages = (data.messages || []).filter((m: Message) => !existingIds.has(m.id));
          
          if (newMessages.length > 0) {
            // Prepend new messages to beginning (appears at bottom in inverted list)
            return [...newMessages.reverse(), ...prev];
          }
          
          return prev;
        });
      }
      setHasMore(data.hasMore);
    } catch (err: any) {
      console.error("Error fetching messages:", err);
      if (!isLoadMore) {
        setError(err.message || "فشل تحميل الرسائل");
      }
    } finally {
      // Only reset loading state for initial loads, not pagination
      if (!isLoadMore) {
        setLoading(false);
      }
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  // Handle new real-time message from Socket.IO
  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      // Check if message already exists (might have been sent by this user)
      if (prev.some(m => m.id === message.id)) {
        return prev;
      }
      // Prepend to beginning (inverted list shows it at bottom)
      return [message, ...prev];
    });
  }, []);

  // Initialize Socket.IO connection and message handling
  useEffect(() => {
    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const initializeChat = async () => {
      // First, fetch existing messages
      await fetchMessages();

      if (!roomId || !isMounted) return;

      // Try to connect via Socket.IO for real-time updates
      const connected = await socketService.connect();
      
      if (connected && isMounted) {
        setSocketConnected(true);
        socketService.joinRoom(roomId);
        
        // Subscribe to new messages
        socketUnsubscribeRef.current = socketService.onMessage(roomId, handleNewMessage);
        
        console.log('Using Socket.IO for real-time chat');
      } else if (isMounted) {
        // Fallback to polling if Socket.IO fails
        console.log('Socket.IO unavailable, falling back to polling');
        setSocketConnected(false);
        
        pollInterval = setInterval(() => {
          if (!isLoadingMoreRef.current) {
            fetchMessages();
          }
        }, 5000);
      }
    };

    initializeChat();

    return () => {
      isMounted = false;
      
      // Clean up Socket.IO
      if (socketUnsubscribeRef.current) {
        socketUnsubscribeRef.current();
        socketUnsubscribeRef.current = null;
      }
      if (roomId) {
        socketService.leaveRoom(roomId);
        socketService.removeRoomHandlers(roomId);
      }
      
      // Clean up polling interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [token, roomId, handleNewMessage]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    try {
      // If Socket.IO is connected, use it for real-time message delivery
      // The message will come back via the socket event handler
      if (socketConnected && socketService.isConnected()) {
        socketService.sendMessage(roomId!, messageText);
        // Also call API to ensure message is persisted (socket handler will receive it)
        await apiService.sendChatMessage(roomId!, messageText);
      } else {
        // Fallback to HTTP API
        const sentMessage = await apiService.sendChatMessage(roomId!, messageText);
        // Prepend new message to the beginning (inverted list shows it at bottom)
        setMessages((prev) => [sentMessage, ...prev]);
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setNewMessage(messageText); // Restore message if failed
      // Show error briefly
      setError(err.message || "فشل إرسال الرسالة");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const loadMoreMessages = async () => {
    // Use ref for synchronous check to prevent race conditions with rapid calls
    if (!hasMore || isLoadingMoreRef.current || messages.length === 0) return;
    
    isLoadingMoreRef.current = true; // Set ref synchronously first to prevent duplicate calls
    setLoadingMore(true); // Update state for UI
    
    try {
      // In inverted list, oldest messages are at the end of the array
      const oldestMessage = messages[messages.length - 1];
      // Note: Backend currently uses timestamp as cursor (not ideal - message IDs would be better)
      // Using timestamp can cause issues if multiple messages share the same timestamp
      // The cursor should ideally be a message ID for more reliable pagination
      await fetchMessages(oldestMessage.createdAt, true);
    } catch (err) {
      // Error handling is done in fetchMessages, but ensure ref is reset
      console.error("Error in loadMoreMessages:", err);
    } finally {
      // Ensure ref is always reset, even if fetchMessages returns early
      // fetchMessages also resets it in its finally block, but this provides safety
      if (isLoadingMoreRef.current) {
        isLoadingMoreRef.current = false;
        setLoadingMore(false);
      }
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "اليوم";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "أمس";
    } else {
      return date.toLocaleDateString("ar-SA");
    }
  };

  const isMyMessage = (message: Message) => {
    return message.sender?.id === user?.id || message.senderId === user?.id;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = isMyMessage(item);
    const senderName = item.sender?.memberDetails?.fullName || "مستخدم";
    
    // In inverted list, we check the next item (index + 1) for date separator
    // because the list is rendered in reverse order
    const nextMessage = messages[index + 1];
    const showDateSeparator = !nextMessage || 
      formatMessageDate(item.createdAt) !== formatMessageDate(nextMessage.createdAt);

    return (
      <View>
        <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}>
          <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
            {!isMine && (
              <Text style={styles.senderName}>{senderName}</Text>
            )}
            <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
              {item.text}
            </Text>
            <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.otherMessageTime]}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
        </View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatMessageDate(item.createdAt)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            headerTitle: title || "المحادثة",
            headerTitleStyle: { fontFamily: "Tajawal-Bold" },
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل الرسائل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          headerTitle: title || "المحادثة",
          headerTitleStyle: { fontFamily: "Tajawal-Bold" },
          headerTitleAlign: "center",
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>لا توجد رسائل بعد</Text>
            <Text style={styles.emptySubtext}>ابدأ المحادثة بإرسال رسالة</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            inverted
            onEndReached={() => {
              // In inverted list, "end" is actually the top (older messages)
              if (hasMore && !loadingMore) {
                loadMoreMessages();
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color="#2E7D32" />
                </View>
              ) : null
            }
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="اكتب رسالتك..."
            placeholderTextColor="#999999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={22} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
  },
  errorBanner: {
    backgroundColor: "#FFEBEE",
    padding: 10,
    alignItems: "center",
  },
  errorBannerText: {
    color: "#D32F2F",
    fontFamily: "Tajawal-Regular",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#666666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#999999",
    marginTop: 8,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  loadingMore: {
    padding: 10,
    alignItems: "center",
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 16,
  },
  dateSeparatorText: {
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: "#2E7D32",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  senderName: {
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    fontFamily: "Tajawal-Regular",
    lineHeight: 22,
  },
  myMessageText: {
    color: "#FFFFFF",
  },
  otherMessageText: {
    color: "#333333",
  },
  messageTime: {
    fontSize: 10,
    fontFamily: "Tajawal-Regular",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },
  otherMessageTime: {
    color: "#999999",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    fontFamily: "Tajawal-Regular",
    maxHeight: 100,
    textAlign: "right",
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
});

