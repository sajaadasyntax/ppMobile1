import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function DocumentViewer() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams<{ url: string; title: string }>();
  const [loading, setLoading] = useState(false);

  const decodedUrl = url ? decodeURIComponent(url) : "";
  const decodedTitle = title ? decodeURIComponent(title) : "عرض المستند";

  const handleOpenExternal = async () => {
    if (decodedUrl) {
      setLoading(true);
      try {
        const canOpen = await Linking.canOpenURL(decodedUrl);
        if (canOpen) {
          await Linking.openURL(decodedUrl);
        } else {
          console.error("Cannot open URL:", decodedUrl);
        }
      } catch (err) {
        console.error("Error opening URL:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/archive");
    }
  };

  if (!url) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'خطأ' }} />
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.errorText}>لم يتم تحديد مستند للعرض</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleGoBack}>
            <Text style={styles.retryButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerTitle: decodedTitle }} />

      {/* Document Info */}
      <View style={styles.contentContainer}>
        <Ionicons name="document-text" size={80} color="#2E7D32" />
        <Text style={styles.documentTitle}>{decodedTitle}</Text>
        <Text style={styles.documentInfo}>
          سيتم فتح المستند في التطبيق الخارجي المناسب
        </Text>

        {/* Open Button */}
        <TouchableOpacity
          style={styles.openButton}
          onPress={handleOpenExternal}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="open-outline" size={24} color="#FFFFFF" />
              <Text style={styles.openButtonText}>فتح المستند</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Download Button */}
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleOpenExternal}
          disabled={loading}
        >
          <Ionicons name="download-outline" size={24} color="#2E7D32" />
          <Text style={styles.downloadButtonText}>تحميل المستند</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  documentTitle: {
    marginTop: 20,
    fontSize: 20,
    fontFamily: "Tajawal-Bold",
    color: "#333",
    textAlign: "center",
  },
  documentInfo: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666",
    textAlign: "center",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  openButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  downloadButtonText: {
    color: "#2E7D32",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: "Tajawal-Medium",
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#2E7D32",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
  },
});

