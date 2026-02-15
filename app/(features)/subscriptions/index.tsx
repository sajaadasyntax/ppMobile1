import React, { useEffect, useState, useContext, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { apiService } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { getUserScopeDescription } from "../../../utils/hierarchyUtils";
import UploadProgressBar from "../../../components/UploadProgressBar";
import { validateFileBeforeUpload } from "../../../utils/validation";

// Backend returns flattened subscription data (not nested plan object)
interface UserSubscription {
  id: string;
  title: string;
  price: string;
  currency: string;
  period: string;
  startDate: string;
  endDate: string;
  status: string;
  features: string;
  receipt?: string;
  paymentStatus: string;
  // Optional: distinguish between subscription and donation in active items
  isDonation?: boolean;
  // Optional: underlying plan id (used to detect if user is subscribed to a plan)
  planId?: string;
}

// Backend subscription plan structure
interface SubscriptionPlan {
  id: string;
  title: string;
  description?: string;
  price: string;
  currency: string;
  period: string;
  features?: string;
  active: boolean;
  isApproved: boolean;
  isDonation: boolean;
  // Hierarchy targeting (for information / potential client-side checks)
  targetRegionId?: string;
  targetLocalityId?: string;
  targetAdminUnitId?: string;
  targetDistrictId?: string;
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

const getPaymentStatusLabel = (status: string): { label: string; color: string } => {
  switch (status) {
    case 'paid': return { label: 'مدفوع', color: '#4CAF50' };
    case 'pending': return { label: 'في انتظار الدفع', color: '#FF9800' };
    case 'pending_review': return { label: 'في انتظار المراجعة', color: '#2196F3' };
    default: return { label: status, color: '#666' };
  }
};

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { user, token, hierarchyVersion } = useContext(AuthContext) || {};
  const [activeSubscriptions, setActiveSubscriptions] = useState<UserSubscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState<string | null>(null);

  const fetchData = async () => {
    if (!token) { router.replace("/login"); return; }
    try {
      setError(null);
      const [plansData, subscriptionsData] = await Promise.all([
        apiService.getSubscriptionPlans(),
        apiService.getUserSubscriptions()
      ]);
      
      // Set available plans (only approved & active; include both subscriptions and donations)
      const plans = Array.isArray(plansData) ? plansData : [];
      setAvailablePlans(plans.filter((p: SubscriptionPlan) => p.active && p.isApproved));
      
      // Set user's active subscriptions
      setActiveSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
    } catch (err: any) {
      console.error("Error fetching subscriptions:", err);
      setError(err.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [token, hierarchyVersion]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(planId);
      await apiService.createSubscription(planId);
      Alert.alert("نجاح", "تم الاشتراك بنجاح! يرجى رفع إيصال الدفع.");
      fetchData();
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "فشل في الاشتراك");
    } finally {
      setSubscribing(null);
    }
  };

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const cancelUploadRef = useRef<(() => void) | null>(null);

  const handleCancelUpload = useCallback(() => {
    cancelUploadRef.current?.();
    setUploadingReceipt(null);
    setUploadProgress(0);
    setUploadError(null);
  }, []);

  const handleUploadReceipt = async (subscriptionId: string) => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("تنبيه", "نحتاج إلى إذن للوصول إلى الصور");
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const asset = result.assets[0];

      // Validate file size & type BEFORE uploading (prevents silent backend rejection)
      const check = validateFileBeforeUpload('receipt', {
        size: asset.fileSize ?? 0,
        mimeType: asset.mimeType ?? (asset.type === 'image' ? 'image/jpeg' : undefined),
        name: asset.fileName ?? undefined,
      });
      if (!check.valid) {
        Alert.alert('ملف غير مقبول', check.error || 'الملف لا يستوفي الشروط');
        return;
      }

      setUploadingReceipt(subscriptionId);
      setUploadProgress(0);
      setUploadError(null);
      setUploadFileName(asset.fileName || 'receipt.jpg');

      // Use progress-tracked upload
      const { uploadFile } = require('../../../services/uploadManager');
      const upload = uploadFile(
        asset.uri,
        asset.fileName || 'receipt.jpg',
        asset.fileSize || 0,
        asset.type === 'image' ? 'image/jpeg' : (asset.mimeType || 'image/jpeg'),
        'receipt',
        {
          onProgress: (p: any) => setUploadProgress(p.percent),
        },
      );
      cancelUploadRef.current = upload.cancel;

      await upload.promise;
      setUploadProgress(100);
      Alert.alert("نجاح", "تم رفع الإيصال بنجاح! سيتم مراجعته قريباً.");
      fetchData();
    } catch (err: any) {
      if (err.message?.includes('إلغاء')) {
        // User cancelled — do nothing
      } else {
        setUploadError(err.message || 'فشل رفع الإيصال. يرجى المحاولة مرة أخرى');
      }
    } finally {
      if (!uploadError) {
        setTimeout(() => {
          setUploadingReceipt(null);
          setUploadProgress(0);
        }, 1500);
      }
    }
  };

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

  // Check if user is already subscribed to a plan
  const isSubscribedToPlan = (planId: string) => {
    // Use planId if available (flattened structure from backend usually includes it)
    return activeSubscriptions.some(sub => sub.planId === planId);
  };

  // Split available plans into subscriptions vs donations for clearer UI
  const subscriptionPlans = availablePlans.filter((plan) => !plan.isDonation);
  const donationPlans = availablePlans.filter((plan) => plan.isDonation);

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
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
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
      <ScrollView 
        style={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2E7D32"]} tintColor="#2E7D32" />}
      >
        {/* Active Subscriptions Section */}
        {activeSubscriptions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>اشتراكاتك الحالية</Text>
            {activeSubscriptions.map((subscription) => {
              const paymentStatus = getPaymentStatusLabel(subscription.paymentStatus);
              const isDonation = subscription.isDonation;
              return (
                <View key={subscription.id} style={styles.subscriptionCard}>
                  <View style={styles.subscriptionHeader}>
                    <View style={styles.subscriptionTitleRow}>
                      <Ionicons 
                        name={subscription.paymentStatus === 'paid' ? "checkmark-circle" : "time-outline"} 
                        size={24}
                        color={paymentStatus.color}
                      />
                      <Text style={styles.subscriptionTitle}>{subscription.title}</Text>
                      {typeof isDonation === "boolean" && (
                        <View
                          style={[
                            styles.typeBadge,
                            { backgroundColor: isDonation ? "#FFF3E0" : "#E3F2FD" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeBadgeText,
                              { color: isDonation ? "#EF6C00" : "#1565C0" },
                            ]}
                          >
                            {isDonation ? "تبرع" : "اشتراك"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: paymentStatus.color + '20' }]}>
                      <Text style={[styles.statusText, { color: paymentStatus.color }]}>{paymentStatus.label}</Text>
                    </View>
                  </View>

                  <View style={styles.subscriptionInfo}>
                    <View style={styles.infoRow}>
                      <Ionicons name="pricetag-outline" size={16} color="#666" />
                      <Text style={styles.infoText}>السعر: {formatPrice(subscription.price, subscription.currency)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="repeat-outline" size={16} color="#666" />
                      <Text style={styles.infoText}>الفترة: {getPeriodLabel(subscription.period)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.infoText}>من: {formatDate(subscription.startDate)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar" size={16} color="#666" />
                      <Text style={styles.infoText}>إلى: {formatDate(subscription.endDate)}</Text>
                    </View>
                  </View>

                  {/* Show receipt if uploaded */}
                  {subscription.receipt && (
                    <View style={styles.receiptPreview}>
                      <Text style={styles.receiptLabel}>الإيصال المرفوع:</Text>
                      <Image source={{ uri: subscription.receipt }} style={styles.receiptImage} resizeMode="cover" />
                    </View>
                  )}

                  {/* Upload receipt button for pending payments */}
                  {subscription.paymentStatus === 'pending' && (
                    <TouchableOpacity 
                      style={styles.uploadButton}
                      onPress={() => handleUploadReceipt(subscription.id)}
                      disabled={uploadingReceipt === subscription.id}
                    >
                      {uploadingReceipt === subscription.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                          <Text style={styles.uploadButtonText}>رفع إيصال الدفع</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {subscription.paymentStatus === 'pending_review' && (
                    <View style={styles.pendingReviewBanner}>
                      <Ionicons name="hourglass-outline" size={18} color="#2196F3" />
                      <Text style={styles.pendingReviewText}>الإيصال قيد المراجعة</Text>
                    </View>
                  )}
                </View>
              );
            })}

            <TouchableOpacity 
              style={styles.viewHistoryButton} 
              onPress={() => router.push("/subscriptions/previous-subscriptions")}
            >
              <Text style={styles.viewHistoryText}>عرض الاشتراكات السابقة</Text>
              <Ionicons name="chevron-forward" size={20} color="#2E7D32" />
            </TouchableOpacity>
          </>
        )}

        {/* Available Plans Section */}
        <Text style={styles.sectionTitle}>
          {activeSubscriptions.length > 0 ? 'الخطط المتاحة' : 'الخطط المتاحة للاشتراك / التبرع'}
        </Text>
        
        {subscriptionPlans.length === 0 && donationPlans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyText}>
              {activeSubscriptions.length > 0 
                ? 'لا توجد خطط إضافية متاحة' 
                : 'لا توجد خطط اشتراك أو تبرع متاحة حالياً'}
            </Text>
          </View>
        ) : (
          <>
            {subscriptionPlans.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>خطط الاشتراك</Text>
                {subscriptionPlans.map((plan) => (
                  <View key={plan.id} style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: "#E3F2FD" }]}>
                          <Text style={[styles.typeBadgeText, { color: "#1565C0" }]}>اشتراك</Text>
                        </View>
                      </View>
                      <Text style={styles.planPrice}>{formatPrice(plan.price, plan.currency)}</Text>
                    </View>
                    
                    {plan.description && (
                      <Text style={styles.planDescription}>{plan.description}</Text>
                    )}
                    
                    <View style={styles.planPeriod}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.periodText}>{getPeriodLabel(plan.period)}</Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.subscribeButton, isSubscribedToPlan(plan.id) && styles.subscribedButton]} 
                      onPress={() => handleSubscribe(plan.id)} 
                      disabled={subscribing === plan.id || isSubscribedToPlan(plan.id)}
                    >
                      {subscribing === plan.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.subscribeButtonText}>
                          {isSubscribedToPlan(plan.id) ? "مشترك بالفعل" : "اشترك الآن"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {donationPlans.length > 0 && (
              <>
                <Text style={styles.subSectionTitle}>خطط التبرع</Text>
                {donationPlans.map((plan) => (
                  <View key={plan.id} style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <View style={styles.planTitleRow}>
                        <Text style={styles.planTitle}>{plan.title}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: "#FFF3E0" }]}>
                          <Text style={[styles.typeBadgeText, { color: "#EF6C00" }]}>تبرع</Text>
                        </View>
                      </View>
                      <Text style={styles.planPrice}>{formatPrice(plan.price, plan.currency)}</Text>
                    </View>
                    
                    {plan.description && (
                      <Text style={styles.planDescription}>{plan.description}</Text>
                    )}
                    
                    <View style={styles.planPeriod}>
                      <Ionicons name="time-outline" size={16} color="#666" />
                      <Text style={styles.periodText}>{getPeriodLabel(plan.period)}</Text>
                    </View>

                    <TouchableOpacity 
                      style={styles.subscribeButton} 
                      onPress={() => handleSubscribe(plan.id)} 
                      disabled={subscribing === plan.id}
                    >
                      {subscribing === plan.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.subscribeButtonText}>
                          تبرع الآن
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {/* Empty state when no subscriptions and no plans */}
        {activeSubscriptions.length === 0 && availablePlans.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="document-text-outline" size={80} color="#CCCCCC" />
            <Text style={styles.emptyStateTitle}>لا توجد اشتراكات</Text>
            <Text style={styles.emptyStateText}>
              لم يتم تخصيص أي اشتراكات لك حتى الآن. سيتم إعلامك عند توفر خطط جديدة.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
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
  content: { flex: 1, padding: 16 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#666666" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#D32F2F", textAlign: "center" },
  retryButton: { marginTop: 20, backgroundColor: "#2E7D32", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 16 },
  sectionTitle: { fontSize: 18, fontFamily: "Tajawal-Bold", color: "#333", marginBottom: 16, marginTop: 8 },
  
  // Subscription Card Styles
  subscriptionCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: "#E0E0E0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  subscriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subscriptionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  subscriptionTitle: { 
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
    fontSize: 12,
    fontFamily: "Tajawal-Medium",
  },
  subscriptionInfo: { marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  infoText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666" },
  
  // Receipt Styles
  receiptPreview: { marginTop: 8, marginBottom: 8 },
  receiptLabel: { fontSize: 14, fontFamily: "Tajawal-Medium", color: "#333", marginBottom: 8 },
  receiptImage: { width: "100%", height: 150, borderRadius: 8, backgroundColor: "#f0f0f0" },
  
  // Upload Button
  uploadButton: { 
    backgroundColor: "#FF9800", 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12, 
    borderRadius: 8,
    marginTop: 8,
  },
  uploadButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 14 },
  
  // Pending Review Banner
  pendingReviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#E3F2FD",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  pendingReviewText: { 
    fontSize: 14, 
    fontFamily: "Tajawal-Medium", 
    color: "#2196F3" 
  },
  
  // View History Button
  viewHistoryButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 12, 
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    marginBottom: 20,
  },
  viewHistoryText: { fontSize: 14, fontFamily: "Tajawal-Medium", color: "#2E7D32" },
  
  // Plan Card Styles
  planCard: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: "#E0E0E0" 
  },
  planHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 8 
  },
  planTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  planTitle: { fontSize: 18, fontFamily: "Tajawal-Bold", color: "#333" },
  planPrice: { fontSize: 18, fontFamily: "Tajawal-Bold", color: "#2E7D32" },
  planDescription: { 
    fontSize: 14, 
    fontFamily: "Tajawal-Regular", 
    color: "#666", 
    marginBottom: 12, 
    lineHeight: 20 
  },
  planPeriod: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
  periodText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666" },
  subscribeButton: { 
    backgroundColor: "#2E7D32", 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  subscribedButton: { backgroundColor: "#CCCCCC" },
  subscribeButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 16 },
  subSectionTitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#555",
    marginBottom: 8,
    marginTop: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: "Tajawal-Medium",
  },
  
  // Empty States
  emptyContainer: { alignItems: "center", padding: 40 },
  emptyText: { fontSize: 16, fontFamily: "Tajawal-Regular", color: "#888", marginTop: 12, textAlign: "center" },
  emptyStateContainer: { 
    alignItems: "center", 
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: "Tajawal-Bold",
    color: "#333",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
