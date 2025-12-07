import React, { useEffect, useState, useContext } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiService } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getUserScopeDescription } from "../utils/hierarchyUtils";

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  plan: {
    id: string;
    name: string;
    price: number;
  };
}

export default function PreviousSubscriptions() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!token) {
      router.replace("/login");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      // Get previous/expired subscriptions using the correct endpoint
      const data = await apiService.getPreviousSubscriptions();
      setSubscriptions(data || []);
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      setError(err.message || "فشل تحميل الاشتراكات السابقة");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSubscriptions(); }, [token]);
  const onRefresh = () => { setRefreshing(true); fetchSubscriptions(); };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("ar-SA");
  const formatPrice = (price: number) => price.toLocaleString("ar-SA") + " ج.س";
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'نشط';
      case 'EXPIRED': return 'منتهي';
      case 'CANCELLED': return 'ملغي';
      case 'PENDING': return 'قيد الانتظار';
      default: return status;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#4CAF50';
      case 'EXPIRED': return '#757575';
      case 'CANCELLED': return '#F44336';
      default: return '#FF9800';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.headerText}>الاشتراكات السابقة</Text></View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2E7D32" /><Text style={styles.loadingText}>جاري التحميل...</Text></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>الاشتراكات السابقة</Text>
          {user && <Text style={styles.hierarchyText}>{getUserScopeDescription(user)}</Text>}
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptions}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>الاشتراكات السابقة</Text>
        {user && <Text style={styles.hierarchyText}>{getUserScopeDescription(user)}</Text>}
      </View>
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} tintColor="#2E7D32" />}
      >
        {subscriptions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>لا توجد اشتراكات سابقة</Text>
          </View>
        ) : (
          subscriptions.map((subscription) => (
            <View key={subscription.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>{subscription.plan?.name || 'اشتراك'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(subscription.status)}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
                  <Text style={styles.infoText}>من: {formatDate(subscription.startDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#2E7D32" />
                  <Text style={styles.infoText}>إلى: {formatDate(subscription.endDate)}</Text>
                </View>
                {subscription.plan?.price && (
                  <View style={styles.infoRow}>
                    <Ionicons name="cash-outline" size={20} color="#2E7D32" />
                    <Text style={styles.infoText}>{formatPrice(subscription.plan.price)}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#888888",
    marginTop: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statusText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Regular",
    fontSize: 14,
  },
  cardBody: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
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
}); 