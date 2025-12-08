import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiService } from "../../../services/api";

// Fallback images for when the server image is not available
const fallbackImages = [
  require("../../../assets/images/news1.png"),
  require("../../../assets/images/news2.png"),
  require("../../../assets/images/news3.png"),
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

export default function BulletinDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch bulletin details from the API
  const fetchBulletinDetails = async () => {
    if (!id) {
      setError("معرف النشرة غير صالح");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getBulletinById(id as string);
      console.log("Fetched bulletin details:", data);
      setBulletin(data);
    } catch (err: any) {
      console.error("Error fetching bulletin details:", err);
      setError(err.message || "Failed to fetch bulletin details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch bulletin details on component mount
  useEffect(() => {
    fetchBulletinDetails();
  }, [id]);

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

  // Share bulletin
  const shareBulletin = async () => {
    if (!bulletin) return;

    try {
      await Share.share({
        message: `${bulletin.title}\n\n${bulletin.content}\n\nتاريخ النشر: ${formatDate(bulletin.date || bulletin.createdAt)}`,
        title: bulletin.title,
      });
    } catch (error) {
      console.error("Error sharing bulletin:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>تفاصيل النشرة</Text>
        <TouchableOpacity
          onPress={shareBulletin}
          style={styles.shareButton}
          disabled={!bulletin}
        >
          <Ionicons name="share-social" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل التفاصيل...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchBulletinDetails}
          >
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : bulletin ? (
        <ScrollView style={styles.content}>
          <Image
            source={
              bulletin.image
                ? { uri: bulletin.image }
                : getFallbackImage(bulletin.id)
            }
            style={styles.bulletinImage}
            defaultSource={fallbackImages[0]}
          />
          <View style={styles.bulletinContent}>
            <Text style={styles.bulletinTitle}>{bulletin.title}</Text>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={16} color="#2E7D32" />
              <Text style={styles.dateText}>
                {formatDate(bulletin.date || bulletin.createdAt)}
              </Text>
            </View>
            <Text style={styles.bulletinText}>{bulletin.content}</Text>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="newspaper-outline" size={60} color="#AAAAAA" />
          <Text style={styles.emptyText}>النشرة غير موجودة</Text>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2E7D32",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Tajawal-Bold",
    flex: 1,
  },
  backButton: {
    padding: 5,
  },
  shareButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  bulletinImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  bulletinContent: {
    padding: 20,
  },
  bulletinTitle: {
    fontSize: 22,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 5,
  },
  dateText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
  },
  bulletinText: {
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    lineHeight: 26,
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
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#2E7D32",
    borderRadius: 5,
  },
  retryText: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#FFFFFF",
  },
  // Empty state styles
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    textAlign: "center",
  },
});
