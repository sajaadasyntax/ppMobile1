import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { getUserScopeDescription } from "../../../utils/hierarchyUtils";

interface ChatMember {
  id: string;
  user: {
    id: string;
    email: string;
    mobileNumber: string;
    memberDetails?: {
      fullName: string;
    };
  };
}

interface LastMessage {
  id: string;
  text: string;
  createdAt: string;
  sender: {
    id: string;
    memberDetails?: {
      fullName: string;
    };
  };
}

interface ChatRoom {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  memberships: ChatMember[];
  messages?: LastMessage[];
}

export default function ChatScreen() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChatRooms = async () => {
    if (!token) {
      router.replace("/login");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const data = await apiService.getUserChatRooms();
      setChatRooms(data || []);
    } catch (err: any) {
      console.error("Error fetching chat rooms:", err);
      setError(err.message || "فشل تحميل غرف المحادثة");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchChatRooms();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatRooms();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "أمس";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("ar-SA", { weekday: "long" });
    } else {
      return date.toLocaleDateString("ar-SA");
    }
  };

  const renderChatRoom = ({ item }: { item: ChatRoom }) => {
    const lastMessage = item.messages && item.messages.length > 0 ? item.messages[0] : null;
    const isMyMessage = lastMessage && user && (lastMessage.sender?.id === user.id);
    const senderName = isMyMessage 
      ? "أنت"
      : (lastMessage?.sender?.memberDetails?.fullName || "عضو");
    const lastMessageText = lastMessage 
      ? `${senderName}: ${lastMessage.text}`
      : "لا توجد رسائل بعد";

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => router.push(`/chat/chat-conversation?roomId=${item.id}&title=${encodeURIComponent(item.title)}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Ionicons name="chatbubbles" size={28} color="#FFFFFF" />
        </View>
        
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.chatTime}>
              {formatTime(item.updatedAt)}
            </Text>
          </View>
          
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMessageText}
          </Text>
          
          <View style={styles.membersInfo}>
            <Ionicons name="people-outline" size={14} color="#888888" />
            <Text style={styles.membersText}>
              {item.memberships.length} مشترك
            </Text>
          </View>
        </View>
        
        <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {user && (
          <View style={styles.hierarchyBanner}>
            <Ionicons name="location-outline" size={16} color="#2E7D32" />
            <Text style={styles.hierarchyText}>{getUserScopeDescription(user)}</Text>
          </View>
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل المحادثات...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchChatRooms}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {user && (
        <View style={styles.hierarchyBanner}>
          <Ionicons name="location-outline" size={16} color="#2E7D32" />
          <Text style={styles.hierarchyText}>{getUserScopeDescription(user)}</Text>
        </View>
      )}

      {chatRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>لا توجد محادثات</Text>
          <Text style={styles.emptyText}>
            ستظهر هنا المحادثات التي تمت إضافتك إليها
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2E7D32"]}
              tintColor="#2E7D32"
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  hierarchyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    gap: 6,
  },
  hierarchyText: {
    fontSize: 13,
    fontFamily: "Tajawal-Medium",
    color: "#2E7D32",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#D32F2F",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Bold",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Tajawal-Bold",
    color: "#333333",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#888888",
    textAlign: "center",
    marginTop: 10,
  },
  listContent: {
    padding: 16,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#333333",
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    fontSize: 12,
    fontFamily: "Tajawal-Regular",
    color: "#888888",
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    marginBottom: 4,
  },
  membersInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  membersText: {
    fontSize: 12,
    fontFamily: "Tajawal-Regular",
    color: "#888888",
  },
  separator: {
    height: 10,
  },
});
