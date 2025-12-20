import React, { useEffect, useState, useContext } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiService } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { getUserScopeDescription } from "../../../utils/hierarchyUtils";

// Backend returns flattened subscription data (not nested plan object)
interface Subscription {
  id: string;
  title: string;
  price: string;
  currency: string;
  period: string;
  startDate: string;
  endDate: string;
  status: string;
  features?: string;
}

const getPeriodLabel = (period: string): string => {
  switch (period) {
    case 'monthly': return 'شهري';
    case 'quarterly': return 'ربع سنوي';
    case 'biannual': return 'نصف سنوي';
    case 'annual': return 'سنوي';
    case 'one-time': return 'مرة واحدة';
    default: return period;
  }
};

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
      const data = await apiService.getPreviousSubscriptions();
      setSubscriptions(Array.isArray(data) ? data : []);
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ar-SA");
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: string | number, currency?: string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString("ar-SA") + " " + (currency || "ج.س");
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'cancelled': return 'ملغي';
      case 'pending': return 'قيد الانتظار';
      default: return status || 'غير محدد';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return '#4CAF50';
      case 'expired': return '#757575';
      case 'cancelled': return '#F44336';
      default: return '#FF9800';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchSubscriptions}>
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
          <Text style={styles.hierarchyBannerText}>{getUserScopeDescription(user)}</Text>
        </View>
      )}
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
                <Text style={styles.title}>{subscription.title || 'اشتراك'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
                  <Text style={styles.statusText}>{getStatusLabel(subscription.status)}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#2E7D32" />
                  <Text style={styles.infoText}>{formatPrice(subscription.price, subscription.currency)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="repeat-outline" size={20} color="#2E7D32" />
                  <Text style={styles.infoText}>{getPeriodLabel(subscription.period)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={20} color="#2E7D32" />
                  <Text style={styles.infoText}>من: {formatDate(subscription.startDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={20} color="#2E7D32" />
                  <Text style={styles.infoText}>إلى: {formatDate(subscription.endDate)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  hierarchyBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    gap: 6,
  },
  hierarchyBannerText: {
    fontSize: 13,
    fontFamily: "Tajawal-Medium",
    color: "#2E7D32",
  },
  content: {
    flex: 1,
    padding: 16,
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
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Medium",
    fontSize: 12,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666",
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
