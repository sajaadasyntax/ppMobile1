import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useContext } from "react";
import { apiService } from "../services/api";
import { useRouter } from "expo-router";
import { AuthContext } from "../context/AuthContext";
import { getUserScopeDescription } from "../utils/hierarchyUtils";

// Fallback images for when the server image is not available
const fallbackImages = [
  require("../assets/images/news1.png"),
  require("../assets/images/news2.png"),
  require("../assets/images/news3.png"),
];

// Define the Bulletin type
interface Bulletin {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Bulletin() {
  const router = useRouter();
  const { user } = useContext(AuthContext) || {};
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Function to fetch bulletins from the API
  const fetchBulletins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBulletins();
      console.log("Fetched bulletins:", data);
      setBulletins(data);
    } catch (err: any) {
      console.error("Error fetching bulletins:", err);
      setError(err.message || "Failed to fetch bulletins");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch bulletins on component mount
  useEffect(() => {
    fetchBulletins();
  }, []);

  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchBulletins();
  };

  // Format date to YYYY-MM-DD
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Get a fallback image based on bulletin ID
  const getFallbackImage = (id: string) => {
    const index = parseInt(id, 10) % fallbackImages.length;
    return fallbackImages[index] || fallbackImages[0];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>النشرة</Text>
        {user && (
          <Text style={styles.hierarchyText}>
            {getUserScopeDescription(user)}
          </Text>
        )}
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل النشرة...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <Text 
            style={styles.retryText}
            onPress={fetchBulletins}
          >
            إعادة المحاولة
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2E7D32"]}
              tintColor="#2E7D32"
            />
          }
        >
          {bulletins.length > 0 ? (
            bulletins.map((bulletin) => (
              <TouchableOpacity
                key={bulletin.id}
                style={styles.newsCard}
                onPress={() => router.push(`/bulletin-details?id=${bulletin.id}`)}
                activeOpacity={0.8}
              >
                <Image 
                  source={bulletin.image ? { uri: bulletin.image } : getFallbackImage(bulletin.id)}
                  style={styles.newsImage}
                  defaultSource={fallbackImages[0]}
                />
                <View style={styles.newsContent}>
                  <View style={styles.newsHeader}>
                    <Text style={styles.newsTitle}>{bulletin.title}</Text>
                    <View style={styles.dateContainer}>
                      <Ionicons name="calendar" size={16} color="#2E7D32" />
                      <Text style={styles.dateText}>
                        {formatDate(bulletin.date || bulletin.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.newsText} numberOfLines={3} ellipsizeMode="tail">
                    {bulletin.content}
                  </Text>
                  <Text style={styles.readMoreText}>اقرأ المزيد</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={60} color="#AAAAAA" />
              <Text style={styles.emptyText}>لا توجد نشرات متاحة حالياً</Text>
            </View>
          )}
        </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  newsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginBottom: 20,
    overflow: "hidden",
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
  newsImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  newsContent: {
    padding: 15,
  },
  newsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  newsTitle: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    flex: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
  },
  newsText: {
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    lineHeight: 24,
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    marginTop: 8,
    textAlign: "left",
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
  },
  // Error state styles
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
  retryText: {
    marginTop: 20,
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    textDecorationLine: "underline",
  },
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    textAlign: "center",
  },
}); 