import React, { useEffect, useState, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";
import { Survey } from "../../../types/survey";

export default function PublicSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { token } = useContext(AuthContext) || {};
  const router = useRouter();

  useEffect(() => {
    async function fetchSurveys() {
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        const publicSurveys = await apiService.getPublicSurveys();
        setSurveys(publicSurveys);
      } catch (err: any) {
        console.error("Error fetching public surveys:", err);
        setError(err.message || "Failed to load public surveys");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }

    fetchSurveys();
  }, [token, router]);

  const onRefresh = () => {
    setRefreshing(true);
    // Re-run the same fetch
    (async () => {
      try {
        const data = await apiService.getPublicSurveys();
        setSurveys(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load public surveys");
      } finally {
        setRefreshing(false);
      }
    })();
  };

  // Determine active (dueDate today or later) vs previous (dueDate in past)
  const now = new Date();
  const isActive = (s: Survey) => {
    const due = new Date(s.dueDate);
    // Consider same-day as active
    return due >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const activeSurveys = surveys.filter(isActive);
  const previousSurveys = surveys.filter((s) => !isActive(s));

  const renderSurveyCard = (survey: Survey) => (
    <View key={survey.id} style={styles.surveyCard}>
      <Text style={styles.surveyTitle}>{survey.title}</Text>
      <Text style={styles.surveyDescription}>{survey.description}</Text>
      
      <View style={styles.surveyMetadata}>
        <View style={styles.metadataItem}>
          <Ionicons name="calendar-outline" size={16} color="#666666" />
          <Text style={styles.metadataText}>تنتهي في: {survey.dueDate}</Text>
        </View>
        <View style={styles.metadataItem}>
          <Ionicons name="people-outline" size={16} color="#666666" />
          <Text style={styles.metadataText}>{survey.participants} مشارك</Text>
        </View>
        <View style={styles.metadataItem}>
          <Ionicons name="list-outline" size={16} color="#666666" />
          <Text style={styles.metadataText}>{survey.questionsCount} سؤال</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.participateButton}
        onPress={() => {
          // Navigate to survey details screen with serialized survey
          router.push({ pathname: "/[id]", params: { id: survey.id, type: "survey", survey: JSON.stringify(survey) } } as any);
        }}
      >
        <Text style={styles.participateButtonText}>
          {survey.isCompleted ? "عرض إجاباتي" : "المشاركة في الاستبيان"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerTitle: "الاستبيانات العامة",
            headerTitleStyle: {
              fontFamily: "Tajawal-Bold",
            },
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>جاري تحميل الاستبيانات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen 
          options={{
            headerTitle: "الاستبيانات العامة",
            headerTitleStyle: {
              fontFamily: "Tajawal-Bold",
            },
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.centeredContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              apiService.getPublicSurveys()
                .then(data => setSurveys(data))
                .catch(err => setError(err.message || "Failed to load surveys"))
                .finally(() => setLoading(false));
            }}
          >
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: "الاستبيانات العامة",
          headerTitleStyle: {
            fontFamily: "Tajawal-Bold",
          },
          headerTitleAlign: "center",
        }}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2E7D32"]}
            tintColor="#2E7D32"
          />
        }
      >
        <View style={styles.sectionHeader}>
          <Ionicons name="bar-chart" size={24} color="#2E7D32" />
          <Text style={styles.sectionHeaderText}>استبيانات نشطة</Text>
        </View>

        {activeSurveys.length > 0 ? (
          activeSurveys.map(survey => renderSurveyCard(survey))
        ) : (
          <View style={styles.centeredContent}>
            <Text style={styles.subtitle}>لا توجد استبيانات نشطة حالياً</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={24} color="#2E7D32" />
          <Text style={styles.sectionHeaderText}>استبيانات سابقة</Text>
        </View>

        {previousSurveys.length > 0 ? (
          previousSurveys.map(survey => renderSurveyCard(survey))
        ) : (
          <View style={styles.centeredContent}>
            <Text style={styles.subtitle}>لا توجد استبيانات سابقة</Text>
          </View>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
    gap: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#333333",
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    textAlign: "center",
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
  errorText: {
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#e53e3e",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Bold",
    fontSize: 16,
  },
  surveyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  surveyTitle: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    marginBottom: 8,
  },
  surveyDescription: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    marginBottom: 12,
    lineHeight: 20,
  },
  surveyMetadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    marginLeft: 6,
  },
  participateButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  participateButtonText: {
    color: "#FFFFFF",
    fontFamily: "Tajawal-Bold",
    fontSize: 16,
  },
}); 