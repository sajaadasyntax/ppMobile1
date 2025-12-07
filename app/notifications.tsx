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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getUserScopeDescription } from "../utils/hierarchyUtils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  data?: {
    targetType?: string;
    targetId?: string;
  };
}

const notificationTypeConfig: Record<string, { icon: string; color: string }> = {
  bulletin: { icon: "newspaper", color: "#2196F3" },
  survey: { icon: "list-circle", color: "#9C27B0" },
  voting: { icon: "checkmark-circle", color: "#4CAF50" },
  chat: { icon: "chatbubble", color: "#FF9800" },
  report: { icon: "document-text", color: "#F44336" },
  subscription: { icon: "card", color: "#00BCD4" },
  system: { icon: "information-circle", color: "#607D8B" },
  default: { icon: "notifications", color: "#2E7D32" },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!token) {
      router.replace("/login");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      // getNotifications() already handles 404 by returning empty array, so no need to check for 404 here
      const data = await apiService.getNotifications();
      setNotifications(data || []);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "فشل تحميل الإشعارات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  const getTypeConfig = (type: string) => {
    return notificationTypeConfig[type] || notificationTypeConfig.default;
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read (would need API endpoint)
    // Navigate based on notification type
    if (notification.data?.targetType && notification.data?.targetId) {
      switch (notification.data.targetType) {
        case "bulletin":
          router.push(`/bulletin-details?id=${notification.data.targetId}`);
          break;
        case "chat":
          router.push(`/chat-conversation?roomId=${notification.data.targetId}`);
          break;
        case "survey":
          router.push("/surveys");
          break;
        case "voting":
          router.push("/voting");
          break;
        case "report":
          router.push("/my-reports");
          break;
        default:
          break;
      }
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const config = getTypeConfig(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
          <Ionicons name={config.icon as any} size={24} color={config.color} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notificationTime}>{formatTime(item.createdAt)}</Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#CCCCCC" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>الإشعارات</Text>
          {user && (
            <Text style={styles.hierarchyText}>
              {getUserScopeDescription(user)}
            </Text>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل الإشعارات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>الإشعارات</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>الإشعارات</Text>
        {user && (
          <Text style={styles.hierarchyText}>
            {getUserScopeDescription(user)}
          </Text>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>لا توجد إشعارات</Text>
          <Text style={styles.emptyText}>
            ستظهر هنا الإشعارات عند وصولها
          </Text>
        </View>
      ) : (
        <>
          {/* Unread count */}
          {notifications.filter((n) => !n.read).length > 0 && (
            <View style={styles.unreadCountContainer}>
              <Text style={styles.unreadCountText}>
                {notifications.filter((n) => !n.read).length} إشعارات غير مقروءة
              </Text>
            </View>
          )}

          <FlatList
            data={notifications}
            renderItem={renderNotification}
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
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 20,
    backgroundColor: "#2E7D32",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Tajawal-Bold",
  },
  hierarchyText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Tajawal-Regular",
    marginTop: 5,
    opacity: 0.9,
  },
  unreadCountContainer: {
    backgroundColor: "#E8F5E9",
    padding: 10,
    alignItems: "center",
  },
  unreadCountText: {
    fontSize: 14,
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
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  unreadCard: {
    backgroundColor: "#F8FFF8",
    borderColor: "#C8E6C9",
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  notificationTitle: {
    fontSize: 15,
    fontFamily: "Tajawal-Medium",
    color: "#333333",
    flex: 1,
  },
  unreadTitle: {
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2E7D32",
  },
  notificationMessage: {
    fontSize: 13,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    marginTop: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    fontFamily: "Tajawal-Regular",
    color: "#999999",
    marginTop: 6,
  },
  separator: {
    height: 10,
  },
});

