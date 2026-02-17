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
  Alert,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { socketService } from "../../../services/socketService";
import { validateFileBeforeUpload } from "../../../utils/validation";
import VoiceRecorder from "../../../components/VoiceRecorder";
import VoicePlayer from "../../../components/VoicePlayer";

interface Message {
  id: string;
  text: string | null;
  messageType?: "TEXT" | "VOICE" | "IMAGE";
  mediaUrl?: string | null;
  duration?: number | null;
  createdAt: string;
  senderId: string;
  sender: {
    id: string;
    memberDetails?: { fullName: string };
  };
}

// ── Animated message wrapper ─────────────────────────────────────────

const AnimatedMessage = React.memo(({ children }: { children: React.ReactNode }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
});

// ── Main screen ──────────────────────────────────────────────────────

export default function ChatConversationScreen() {
  const { roomId, title } = useLocalSearchParams<{ roomId: string; title: string }>();
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const insets = useSafeAreaInsets();
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

  // Voice states
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sendingVoice, setSendingVoice] = useState(false);

  // Send button animation
  const sendBtnScale = useRef(new Animated.Value(1)).current;
  const inputFocused = useRef(false);

  // ── Data fetching ──────────────────────────────────────────────────

  const fetchMessages = async (cursor?: string, isLoadMore = false) => {
    if (!token || !roomId) {
      if (!token) router.replace("/login");
      if (isLoadMore) { isLoadingMoreRef.current = false; setLoadingMore(false); }
      return;
    }
    if (!isLoadMore && isLoadingMoreRef.current) return;

    try {
      if (!isLoadMore) setError(null);
      const data = await apiService.getChatMessages(roomId, cursor);

      if (isLoadMore) {
        setMessages((prev) => [...prev, ...(data.messages || [])]);
      } else {
        setMessages((prev) => {
          if (prev.length === 0) return (data.messages || []).reverse();
          const existingIds = new Set(prev.map((m) => m.id));
          const fresh = (data.messages || []).filter((m: Message) => !existingIds.has(m.id));
          return fresh.length > 0 ? [...fresh.reverse(), ...prev] : prev;
        });
      }
      setHasMore(data.hasMore);
    } catch (err: any) {
      if (!isLoadMore) setError(err.message || "فشل تحميل الرسائل");
    } finally {
      if (!isLoadMore) setLoading(false);
      setLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  };

  // ── Real-time ──────────────────────────────────────────────────────

  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [message, ...prev];
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const initializeChat = async () => {
      await fetchMessages();
      if (!roomId || !isMounted) return;

      const connected = await socketService.connect();
      if (connected && isMounted) {
        setSocketConnected(true);
        socketService.joinRoom(roomId);
        socketUnsubscribeRef.current = socketService.onMessage(roomId, handleNewMessage);

        const unsubRoomRemoved = socketService.onRoomRemoved((data) => {
          if (data.roomId === roomId && isMounted) {
            Alert.alert("تمت إزالتك", data.reason || "تمت إزالتك من غرفة المحادثة", [
              { text: "حسناً", onPress: () => router.back() },
            ]);
          }
        });
        const orig = socketUnsubscribeRef.current;
        socketUnsubscribeRef.current = () => { orig?.(); unsubRoomRemoved(); };
      } else if (isMounted) {
        setSocketConnected(false);
        pollInterval = setInterval(() => {
          if (!isLoadingMoreRef.current) fetchMessages();
        }, 5000);
      }
    };

    initializeChat();
    return () => {
      isMounted = false;
      socketUnsubscribeRef.current?.();
      socketUnsubscribeRef.current = null;
      if (roomId) { socketService.leaveRoom(roomId); socketService.removeRoomHandlers(roomId); }
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [token, roomId, handleNewMessage]);

  // ── Send text ──────────────────────────────────────────────────────

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Animate send button
    Animated.sequence([
      Animated.timing(sendBtnScale, { toValue: 0.8, duration: 60, useNativeDriver: true }),
      Animated.spring(sendBtnScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    try {
      if (socketConnected && socketService.isConnected()) {
        socketService.sendMessage(roomId!, messageText);
      } else {
        const sent = await apiService.sendChatMessage(roomId!, messageText);
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [sent, ...prev]));
      }
    } catch (err: any) {
      setNewMessage(messageText);
      setError(err.message || "فشل إرسال الرسالة");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  // ── Send voice ─────────────────────────────────────────────────────

  const handleVoiceRecordingComplete = async (uri: string, dur: number) => {
    if (!roomId || sendingVoice) return;
    setSendingVoice(true);
    setShowVoiceRecorder(false);

    try {
      const ext = uri.split(".").pop()?.toLowerCase() || "m4a";
      const mimeMap: Record<string, string> = { m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", webm: "audio/webm", ogg: "audio/ogg", aac: "audio/aac" };

      let fileSize = 0;
      try { const r = await fetch(uri); const b = await r.blob(); fileSize = b.size; } catch {}

      if (fileSize > 0) {
        const check = validateFileBeforeUpload("voice", { size: fileSize, mimeType: mimeMap[ext] || "audio/mp4", name: `voice.${ext}` });
        if (!check.valid) { Alert.alert("ملف غير مقبول", check.error || "الملف كبير جداً"); setSendingVoice(false); return; }
      }

      const sent = await apiService.uploadVoiceMessage(roomId, uri, dur);
      if (!socketConnected) setMessages((prev) => [sent, ...prev]);
    } catch (err: any) {
      setError(err.message || "فشل إرسال الرسالة الصوتية");
      setTimeout(() => setError(null), 3000);
    } finally {
      setSendingVoice(false);
    }
  };

  // ── Load more ──────────────────────────────────────────────────────

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMoreRef.current || messages.length === 0) return;
    isLoadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const oldest = messages[messages.length - 1];
      await fetchMessages(oldest.createdAt, true);
    } finally {
      if (isLoadingMoreRef.current) { isLoadingMoreRef.current = false; setLoadingMore(false); }
    }
  };

  // ── Formatters ─────────────────────────────────────────────────────

  const formatMessageTime = (d: string) => new Date(d).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });

  const formatMessageDate = (d: string) => {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "اليوم";
    if (date.toDateString() === yesterday.toDateString()) return "أمس";
    return date.toLocaleDateString("ar-SA");
  };

  const isMyMessage = (m: Message) => m.sender?.id === user?.id || m.senderId === user?.id;

  // ── Render message ─────────────────────────────────────────────────

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = isMyMessage(item);
    const senderName = isMine ? "أنت" : item.sender?.memberDetails?.fullName || "عضو";
    const isVoice = item.messageType === "VOICE" && item.mediaUrl;
    const next = messages[index + 1];
    const showDate = !next || formatMessageDate(item.createdAt) !== formatMessageDate(next.createdAt);

    // Check if previous message (index - 1 in array = below in inverted list) is from the same sender
    const prev = index > 0 ? messages[index - 1] : null;
    const isFirstInGroup = !prev || (prev.senderId !== item.senderId);

    return (
      <AnimatedMessage>
        <View style={[styles.messageRow, isMine ? styles.myMessageRow : styles.otherMessageRow]}>
          {/* Avatar for other users (first in group only) */}
          {!isMine && (
            <View style={styles.avatarColumn}>
              {isFirstInGroup ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(senderName || "").charAt(0)}
                  </Text>
                </View>
              ) : (
                <View style={styles.avatarSpacer} />
              )}
            </View>
          )}

          <View style={{ maxWidth: "78%" }}>
            {/* Sender name (first in group only, other people's messages) */}
            {!isMine && isFirstInGroup && (
              <Text style={styles.senderName}>{senderName}</Text>
            )}

            <View
              style={[
                styles.messageBubble,
                isMine ? styles.myMessage : styles.otherMessage,
                isVoice && styles.voiceBubble,
                // Rounded corners based on grouping
                isMine && isFirstInGroup && { borderBottomRightRadius: 6 },
                isMine && !isFirstInGroup && { borderTopRightRadius: 6, borderBottomRightRadius: 6 },
                !isMine && isFirstInGroup && { borderBottomLeftRadius: 6 },
                !isMine && !isFirstInGroup && { borderTopLeftRadius: 6, borderBottomLeftRadius: 6 },
              ]}
            >
              {isVoice ? (
                <VoicePlayer mediaUrl={item.mediaUrl!} duration={item.duration || null} isMine={isMine} />
              ) : (
                <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
                  {item.text}
                </Text>
              )}

              {/* Timestamp + delivery indicator */}
              <View style={styles.metaRow}>
                <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.otherMessageTime]}>
                  {formatMessageTime(item.createdAt)}
                </Text>
                {isMine && (
                  <Ionicons
                    name="checkmark-done"
                    size={14}
                    color="rgba(255,255,255,0.55)"
                    style={{ marginLeft: 3 }}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        {showDate && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateSeparatorText}>{formatMessageDate(item.createdAt)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}
      </AnimatedMessage>
    );
  };

  // ── Loading state ──────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: title || "المحادثة" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل الرسائل...</Text>
        </View>
      </View>
    );
  }

  // ── Main render ────────────────────────────────────────────────────

  const hasText = newMessage.trim().length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: title || "المحادثة",
          headerTitleStyle: { fontFamily: "Tajawal-Bold", fontSize: 17 },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: "#FAFAFA" },
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 + insets.top : 0}
      >
        {/* Error banner with animation */}
        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={16} color="#D32F2F" />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* Messages list */}
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="chatbubbles-outline" size={48} color="#B0BEC5" />
            </View>
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
            showsVerticalScrollIndicator={false}
            onEndReached={() => { if (hasMore && !loadingMore) loadMoreMessages(); }}
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

        {/* Voice Recorder */}
        {showVoiceRecorder && (
          <View style={[styles.bottomBar, { paddingBottom: Math.max(12, insets.bottom) }]}>
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              onCancel={() => { setShowVoiceRecorder(false); setIsRecording(false); }}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />
          </View>
        )}

        {/* Sending Voice Indicator */}
        {sendingVoice && (
          <View style={[styles.bottomBar, styles.sendingVoiceBar, { paddingBottom: Math.max(14, insets.bottom) }]}>
            <ActivityIndicator size="small" color="#2E7D32" />
            <Text style={styles.sendingVoiceText}>جاري إرسال الرسالة الصوتية...</Text>
          </View>
        )}

        {/* Input Area */}
        {!showVoiceRecorder && !sendingVoice && (
          <View style={[styles.inputWrapper, { paddingBottom: Math.max(10, insets.bottom) }]}>
            <View style={styles.inputRow}>
              {/* Mic button — shown only when no text typed */}
              {!hasText && (
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setShowVoiceRecorder(true)}
                  activeOpacity={0.6}
                >
                  <View style={styles.micCircle}>
                    <Ionicons name="mic" size={20} color="#2E7D32" />
                  </View>
                </TouchableOpacity>
              )}

              {/* Text input */}
              <View style={styles.inputBubble}>
                <TextInput
                  style={styles.textInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="اكتب رسالتك..."
                  placeholderTextColor="#AAA"
                  multiline
                  maxLength={1000}
                  onFocus={() => { inputFocused.current = true; }}
                  onBlur={() => { inputFocused.current = false; }}
                />
              </View>

              {/* Send button */}
              <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
                <TouchableOpacity
                  style={[styles.sendButton, !hasText && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!hasText || sending}
                  activeOpacity={0.7}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: -2 }} />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────

const BRAND = "#2E7D32";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECE5DD" },
  keyboardView: { flex: 1 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 15, fontFamily: "Tajawal-Regular", color: "#666" },

  // Error
  errorBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: "#FFEBEE", paddingVertical: 8, paddingHorizontal: 16,
  },
  errorBannerText: { color: "#D32F2F", fontFamily: "Tajawal-Medium", fontSize: 13 },

  // Empty
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#E0E0E0", justifyContent: "center", alignItems: "center", marginBottom: 16,
  },
  emptyText: { fontSize: 17, fontFamily: "Tajawal-Bold", color: "#666", marginTop: 4 },
  emptySubtext: { fontSize: 13, fontFamily: "Tajawal-Regular", color: "#999", marginTop: 6 },

  // Messages
  messagesContainer: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  loadingMore: { padding: 12, alignItems: "center" },

  // Date separator
  dateSeparator: {
    flexDirection: "row", alignItems: "center", marginVertical: 18, paddingHorizontal: 8,
  },
  dateLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: "#C5C5C5" },
  dateSeparatorText: {
    backgroundColor: "#D6CEBF", paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12,
    fontSize: 11, fontFamily: "Tajawal-Medium", color: "#555", marginHorizontal: 10,
    overflow: "hidden",
  },

  // Message row
  messageRow: { marginBottom: 3, flexDirection: "row", alignItems: "flex-end" },
  myMessageRow: { justifyContent: "flex-end" },
  otherMessageRow: { justifyContent: "flex-start" },

  // Avatar
  avatarColumn: { width: 30, marginRight: 6, alignItems: "center", justifyContent: "flex-end" },
  avatar: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#80CBC4",
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontSize: 13, fontFamily: "Tajawal-Bold", color: "#FFF" },
  avatarSpacer: { width: 28 },

  // Sender name
  senderName: {
    fontSize: 12, fontFamily: "Tajawal-Bold", color: "#1B5E20", marginBottom: 2, marginLeft: 4,
  },

  // Bubble
  messageBubble: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18,
    elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.08, shadowRadius: 1,
  },
  voiceBubble: { paddingHorizontal: 0, paddingVertical: 0, backgroundColor: "transparent", elevation: 0, shadowOpacity: 0 },
  myMessage: { backgroundColor: "#DCF8C6", borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: "#FFFFFF", borderBottomLeftRadius: 4 },

  // Text
  messageText: { fontSize: 15, fontFamily: "Tajawal-Regular", lineHeight: 22 },
  myMessageText: { color: "#1A1A1A" },
  otherMessageText: { color: "#1A1A1A" },

  // Meta row (time + checkmarks)
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 3 },
  messageTime: { fontSize: 10, fontFamily: "Tajawal-Regular" },
  myMessageTime: { color: "rgba(0,0,0,0.4)" },
  otherMessageTime: { color: "#999" },

  // Bottom bar (shared)
  bottomBar: {
    backgroundColor: "#FFFFFF", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#D4D4D4",
    paddingHorizontal: 8, paddingTop: 8,
  },
  sendingVoiceBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14,
  },
  sendingVoiceText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666" },

  // Input
  inputWrapper: {
    backgroundColor: "#FAFAFA", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#D4D4D4",
    paddingHorizontal: 8, paddingTop: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
  iconBtn: { marginBottom: 4 },
  micCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  inputBubble: {
    flex: 1, backgroundColor: "#FFF", borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "#DDD",
    paddingHorizontal: 16, paddingVertical: Platform.OS === "ios" ? 10 : 6,
    maxHeight: 120, justifyContent: "center",
  },
  textInput: {
    fontSize: 15, fontFamily: "Tajawal-Regular", color: "#222",
    textAlign: "right", maxHeight: 100, padding: 0, margin: 0,
  },
  sendButton: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: BRAND,
    justifyContent: "center", alignItems: "center", marginBottom: 2,
    elevation: 3, shadowColor: BRAND, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#B0B0B0", elevation: 0, shadowOpacity: 0,
  },
});
