import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService, SERVER_BASE_URL } from "../../services/api";
import { AuthContext } from "../../context/AuthContext";
import { getUserScopeDescription } from "../../utils/hierarchyUtils";

interface ArchiveDocument {
  id: string;
  title: string;
  category: string;
  url: string;
  size?: string;
  type?: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  document: "وثائق",
  report: "تقارير",
  image: "صور",
  video: "فيديوهات",
  other: "أخرى",
};

const getFileIcon = (type: string): string => {
  switch (type?.toLowerCase()) {
    case "pdf":
      return "document-text";
    case "doc":
    case "docx":
      return "document";
    case "xls":
    case "xlsx":
      return "grid";
    case "ppt":
    case "pptx":
      return "easel";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image";
    case "mp4":
    case "avi":
    case "mov":
      return "videocam";
    default:
      return "document-attach";
  }
};

export default function ArchiveScreen() {
  const router = useRouter();
  const { user, token } = useContext(AuthContext) || {};
  const [documents, setDocuments] = useState<ArchiveDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchDocuments = async (category?: string) => {
    if (!token) {
      router.replace("/login");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      const data = await apiService.getArchiveDocuments(category || undefined);
      setDocuments(data || []);
    } catch (err: any) {
      console.error("Error fetching archive documents:", err);
      setError(err.message || "فشل تحميل الوثائق");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments(selectedCategory || undefined);
  }, [token, selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDocuments(selectedCategory || undefined);
  };

  const handleOpenDocument = (doc: ArchiveDocument) => {
    // Navigate to document viewer or open externally
    // Use SERVER_BASE_URL for static file URLs (not API_BASE_URL which has /api suffix)
    const fullUrl = doc.url.startsWith("http") ? doc.url : `${SERVER_BASE_URL}${doc.url}`;
    
    // Open in external browser or WebView
    Linking.canOpenURL(fullUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(fullUrl).catch((err) => {
            console.error("Error opening URL:", err);
            // Fallback to document viewer if opening URL fails
            router.push(`/document-viewer?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(doc.title)}`);
          });
        } else {
          // Navigate to document viewer screen
          router.push(`/document-viewer?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(doc.title)}`);
        }
      })
      .catch((err) => {
        console.error("Error checking if URL can be opened:", err);
        // Fallback to document viewer if check fails
        router.push(`/document-viewer?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(doc.title)}`);
      });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA");
  };

  const categories = ["document", "report", "image", "video", "other"];

  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={[styles.categoryButton, selectedCategory === null && styles.categoryButtonActive]}
        onPress={() => setSelectedCategory(null)}
      >
        <Text style={[styles.categoryButtonText, selectedCategory === null && styles.categoryButtonTextActive]}>
          الكل
        </Text>
      </TouchableOpacity>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.categoryButton, selectedCategory === cat && styles.categoryButtonActive]}
          onPress={() => setSelectedCategory(cat)}
        >
          <Text style={[styles.categoryButtonText, selectedCategory === cat && styles.categoryButtonTextActive]}>
            {categoryLabels[cat]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDocument = ({ item }: { item: ArchiveDocument }) => (
    <TouchableOpacity
      style={styles.documentCard}
      onPress={() => handleOpenDocument(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={getFileIcon(item.type || "") as any} size={32} color="#2E7D32" />
      </View>
      
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.documentMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="folder-outline" size={14} color="#888888" />
            <Text style={styles.metaText}>{categoryLabels[item.category] || item.category}</Text>
          </View>
          {item.size && (
            <View style={styles.metaItem}>
              <Ionicons name="document-outline" size={14} color="#888888" />
              <Text style={styles.metaText}>{item.size}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#888888" />
            <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </View>
      
      <Ionicons name="download-outline" size={24} color="#2E7D32" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>الأرشيف</Text>
          {user && (
            <Text style={styles.hierarchyText}>
              {getUserScopeDescription(user)}
            </Text>
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل الوثائق...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>الأرشيف</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={50} color="#D32F2F" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDocuments(selectedCategory || undefined)}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>الأرشيف</Text>
        {user && (
          <Text style={styles.hierarchyText}>
            {getUserScopeDescription(user)}
          </Text>
        )}
      </View>

      {renderCategoryFilter()}

      {documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="archive-outline" size={80} color="#CCCCCC" />
          <Text style={styles.emptyTitle}>لا توجد وثائق</Text>
          <Text style={styles.emptyText}>
            {selectedCategory 
              ? "لا توجد وثائق في هذا التصنيف"
              : "لم يتم رفع أي وثائق بعد"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          renderItem={renderDocument}
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
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "#F5F5F5",
    gap: 8,
    justifyContent: "center",
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  categoryButtonActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  categoryButtonText: {
    fontSize: 14,
    fontFamily: "Tajawal-Medium",
    color: "#666666",
  },
  categoryButtonTextActive: {
    color: "#FFFFFF",
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
  documentCard: {
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
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#333333",
    marginBottom: 6,
  },
  documentMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
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
  separator: {
    height: 12,
  },
});

