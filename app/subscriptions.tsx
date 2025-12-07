import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { getUserScopeDescription } from "../utils/hierarchyUtils";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  features: string[];
  active: boolean;
}

interface UserSubscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  plan: SubscriptionPlan;
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) { router.replace("/login"); return; }
    try {
      setError(null);
      const [plansData, subscriptionsData] = await Promise.all([
        apiService.getSubscriptionPlans(),
        apiService.getUserSubscriptions()
      ]);
      setPlans(plansData || []);
      if (subscriptionsData && subscriptionsData.length > 0) {
        setActiveSubscription(subscriptionsData[0]);
      }
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      setError(err.message || "فشل تحميل خطط الاشتراك");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(planId);
      await apiService.createSubscription(planId);
      alert("تم الاشتراك بنجاح!");
      fetchData();
    } catch (err: any) {
      alert(err.message || "فشل في الاشتراك");
    } finally {
      setSubscribing(null);
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString("ar-SA");
  const formatPrice = (price: number) => price.toLocaleString("ar-SA") + " ج.س";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.headerText}>الاشتراكات</Text>{user && <Text style={styles.hierarchyText}>{getUserScopeDescription(user)}</Text>}</View>
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2E7D32" /><Text style={styles.loadingText}>جاري تحميل خطط الاشتراك...</Text></View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.headerText}>الاشتراكات</Text></View>
        <View style={styles.errorContainer}><Ionicons name="alert-circle" size={50} color="#D32F2F" /><Text style={styles.errorText}>{error}</Text><TouchableOpacity style={styles.retryButton} onPress={fetchData}><Text style={styles.retryButtonText}>إعادة المحاولة</Text></TouchableOpacity></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.headerText}>الاشتراكات</Text>{user && <Text style={styles.hierarchyText}>{getUserScopeDescription(user)}</Text>}</View>
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} tintColor="#2E7D32" />}>
        {activeSubscription && (
          <View style={styles.activeSubscriptionCard}>
            <View style={styles.activeHeader}><Ionicons name="checkmark-circle" size={24} color="#4CAF50" /><Text style={styles.activeTitle}>اشتراكك الحالي</Text></View>
            <Text style={styles.planName}>{activeSubscription.plan.name}</Text>
            <View style={styles.subscriptionInfo}>
              <View style={styles.infoRow}><Ionicons name="calendar-outline" size={16} color="#666" /><Text style={styles.infoText}>تاريخ البدء: {formatDate(activeSubscription.startDate)}</Text></View>
              <View style={styles.infoRow}><Ionicons name="calendar" size={16} color="#666" /><Text style={styles.infoText}>تاريخ الانتهاء: {formatDate(activeSubscription.endDate)}</Text></View>
              <View style={styles.infoRow}><Ionicons name="pricetag-outline" size={16} color="#666" /><Text style={styles.infoText}>السعر: {formatPrice(activeSubscription.plan.price)}</Text></View>
            </View>
            <TouchableOpacity style={styles.viewHistoryButton} onPress={() => router.push("/previous-subscriptions")}><Text style={styles.viewHistoryText}>عرض الاشتراكات السابقة</Text><Ionicons name="chevron-forward" size={20} color="#2E7D32" /></TouchableOpacity>
          </View>
        )}
        <Text style={styles.sectionTitle}>خطط الاشتراك المتاحة</Text>
        {plans.length === 0 ? (
          <View style={styles.emptyContainer}><Ionicons name="card-outline" size={60} color="#CCCCCC" /><Text style={styles.emptyText}>لا توجد خطط اشتراك متاحة حاليا</Text></View>
        ) : (
          plans.filter(p => p.active).map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}><Text style={styles.planTitle}>{plan.name}</Text><Text style={styles.planPrice}>{formatPrice(plan.price)}</Text></View>
              <Text style={styles.planDescription}>{plan.description}</Text>
              <View style={styles.planDuration}><Ionicons name="time-outline" size={16} color="#666" /><Text style={styles.durationText}>{plan.duration} يوم</Text></View>
              {plan.features && plan.features.length > 0 && (
                <View style={styles.featuresContainer}>{plan.features.map((feature, idx) => (<View key={idx} style={styles.featureRow}><Ionicons name="checkmark" size={16} color="#4CAF50" /><Text style={styles.featureText}>{feature}</Text></View>))}</View>
              )}
              <TouchableOpacity style={[styles.subscribeButton, activeSubscription?.plan.id === plan.id && styles.currentPlanButton]} onPress={() => handleSubscribe(plan.id)} disabled={subscribing === plan.id || activeSubscription?.plan.id === plan.id}>
                <Text style={styles.subscribeButtonText}>{subscribing === plan.id ? "جاري الاشتراك..." : activeSubscription?.plan.id === plan.id ? "خطتك الحالية" : "اشترك الآن"}</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: { padding: 20, backgroundColor: "#2E7D32", borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerText: { fontSize: 24, color: "#FFFFFF", textAlign: "center", fontFamily: "Tajawal-Bold" },
  hierarchyText: { fontSize: 14, color: "#FFFFFF", textAlign: "center", fontFamily: "Tajawal-Regular", marginTop: 5, opacity: 0.9 },
  content: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#666666" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#D32F2F", textAlign: "center" },
  retryButton: { marginTop: 20, backgroundColor: "#2E7D32", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 16 },
  activeSubscriptionCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: "#4CAF50" },
  activeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  activeTitle: { fontSize: 16, fontFamily: "Tajawal-Bold", color: "#4CAF50" },
  planName: { fontSize: 20, fontFamily: "Tajawal-Bold", color: "#333", marginBottom: 12 },
  subscriptionInfo: { marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  infoText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666" },
  viewHistoryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#E0E0E0" },
  viewHistoryText: { fontSize: 14, fontFamily: "Tajawal-Medium", color: "#2E7D32" },
  sectionTitle: { fontSize: 18, fontFamily: "Tajawal-Bold", color: "#333", marginBottom: 16 },
  emptyContainer: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, fontFamily: "Tajawal-Regular", color: "#888", marginTop: 12 },
  planCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E0E0E0" },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  planTitle: { fontSize: 18, fontFamily: "Tajawal-Bold", color: "#333" },
  planPrice: { fontSize: 18, fontFamily: "Tajawal-Bold", color: "#2E7D32" },
  planDescription: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666", marginBottom: 12, lineHeight: 20 },
  planDuration: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  durationText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666" },
  featuresContainer: { marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  featureText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#333" },
  subscribeButton: { backgroundColor: "#2E7D32", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  currentPlanButton: { backgroundColor: "#CCCCCC" },
  subscribeButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 16 },
});
