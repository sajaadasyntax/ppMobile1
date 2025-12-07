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

interface Report {
  id: string;
  title: string;
  type: string;
  description: string;
  status: string;
  date: string;
  createdAt: string;
  attachmentName?: string;
  response?: string;
}

const reportTypeLabels: Record<string, string> = {
  general: "عام",
  complaint: "شكوى",
  suggestion: "اقتراح",
  other: "أخرى",
};

const reportStatusLabels: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "قيد المراجعة", color: "#FF9800", bgColor: "#FFF3E0" },
  IN_PROGRESS: { label: "جاري المعالجة", color: "#2196F3", bgColor: "#E3F2FD" },
  RESOLVED: { label: "تم الحل", color: "#4CAF50", bgColor: "#E8F5E9" },
  REJECTED: { label: "مرفوض", color: "#F44336", bgColor: "#FFEBEE" },
  pending: { label: "قيد المراجعة", color: "#FF9800", bgColor: "#FFF3E0" },
  in_progress: { label: "جاري المعالجة", color: "#2196F3", bgColor: "#E3F2FD" },
  reviewed: { label: "تمت المراجعة", color: "#2196F3", bgColor: "#E3F2FD" },
  resolved: { label: "تم الحل", color: "#4CAF50", bgColor: "#E8F5E9" },
};

export default function MyReportsScreen() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!token) {
      router.replace("/login");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const data = await apiService.getMyReports();
      setReports(data || []);
    } catch (err: any) {
      console.error("Error fetching reports:", err);
      setError(err.message || "فشل تحميل التقارير");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusInfo = (status: string) => {
    return reportStatusLabels[status] || { label: status, color: "#999999", bgColor: "#F5F5F5" };
  };

  const renderReport = ({ item }: { item: Report }) => {
    const statusInfo = getStatusInfo(item.status);

    return (
      <TouchableOpacity
        style={styles.reportCard}
        onPress={() => {
          // Could navigate to report details
        }}
        activeOpacity={0.8}
      >
        <View style={styles.reportHeader}>
          <View style={styles.typeContainer}>
            <Ionicons
              name={item.type === "complaint" ? "alert-circle" : item.type === "suggestion" ? "bulb" : "document-text"}
              size={20}
              color="#2E7D32"
            />
            <Text style={styles.reportType}>
              {reportTypeLabels[item.type] || item.type}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <Text style={styles.reportTitle}>{item.title}</Text>
        
        <Text style={styles.reportDescription} numberOfLines={3}>
          {item.description}
        </Text>

        <View style={styles.reportMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#888888" />
            <Text style={styles.metaText}>
              {formatDate(item.date || item.createdAt)}
            </Text>
          </View>
          {item.attachmentName && (
            <View style={styles.metaItem}>
              <Ionicons name="attach" size={14} color="#888888" />
              <Text style={styles.metaText}>مرفق</Text>
            </View>
          )}
        </View>

        {item.response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>الرد:</Text>
            <Text style={styles.responseText}>{item.response}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>تقاريري</Text>
          {user && (
            <Text style={styles.hierarchyText}>
              {getUserScopeDescription(user)}
            </Text>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل التقارير...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>تقاريري</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReports}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>تقاريري</Text>
        {user && (
          <Text style={styles.hierarchyText}>
            {getUserScopeDescription(user)}
          </Text>
        )}
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>لا توجد تقارير</Text>
          <Text style={styles.emptyText}>
            لم تقم بإرسال أي تقارير بعد
          </Text>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => router.push("/submit-report")}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>تقديم تقرير جديد</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{reports.length}</Text>
              <Text style={styles.statLabel}>إجمالي التقارير</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#FF9800" }]}>
                {reports.filter((r) => r.status === "PENDING" || r.status === "pending" || r.status === "IN_PROGRESS" || r.status === "in_progress").length}
              </Text>
              <Text style={styles.statLabel}>قيد المراجعة</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
                {reports.filter((r) => r.status === "RESOLVED" || r.status === "resolved").length}
              </Text>
              <Text style={styles.statLabel}>تم الحل</Text>
            </View>
          </View>

          <FlatList
            data={reports}
            renderItem={renderReport}
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

          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => router.push("/submit-report")}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
    backgroundColor: "#FFFFFF",
    marginTop: -10,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Tajawal-Regular",
    color: "#888888",
    marginTop: 4,
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
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Bold",
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  reportCard: {
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
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reportType: {
    fontSize: 14,
    fontFamily: "Tajawal-Medium",
    color: "#2E7D32",
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
  reportTitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#333333",
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    lineHeight: 22,
    marginBottom: 12,
  },
  reportMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Tajawal-Regular",
    color: "#888888",
  },
  responseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
  },
  responseLabel: {
    fontSize: 12,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    lineHeight: 20,
  },
  separator: {
    height: 12,
  },
  fabButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
});

