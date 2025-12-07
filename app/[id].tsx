import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/api";
import type { Survey, SurveyQuestion } from "../types/survey";

export default function SurveyDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Expect params: id, survey (stringified)
  const survey: Survey | null = useMemo(() => {
    try {
      if (typeof params.survey === "string") {
        return JSON.parse(params.survey);
      }
    } catch (e) {}
    return null;
  }, [params.survey]);

  const surveyId = (params.id as string) || survey?.id || "";
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  if (!survey) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: "تفاصيل الاستبيان", headerTitleAlign: "center", headerTitleStyle: { fontFamily: "Tajawal-Bold" } }} />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#e53e3e" />
          <Text style={styles.errorText}>تعذر تحميل بيانات الاستبيان</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>عودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const onChangeAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await apiService.submitSurveyResponse(surveyId, answers);
      Alert.alert("تم الإرسال", "شكراً لمشاركتك في الاستبيان");
      router.back();
    } catch (err: any) {
      Alert.alert("خطأ", err.message || "فشل في إرسال الإجابات");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (q: SurveyQuestion, index: number) => {
    return (
      <View key={q.id} style={styles.questionCard}>
        <Text style={styles.questionTitle}>{index + 1}. {q.text}</Text>
        {q.type === "text" && (
          <TextInput
            style={styles.textInput}
            placeholder="اكتب إجابتك هنا"
            onChangeText={(t) => onChangeAnswer(q.id, t)}
            value={(answers[q.id] as string) || ""}
            multiline
          />
        )}
        {q.type === "multiple_choice" && Array.isArray(q.options) && (
          <View style={styles.optionsContainer}>
            {q.options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionButton, answers[q.id] === opt && styles.optionSelected]}
                onPress={() => onChangeAnswer(q.id, opt)}
              >
                <Text style={[styles.optionText, answers[q.id] === opt && styles.optionSelectedText]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {q.type === "rating" && (
          <View style={styles.optionsContainer}>
            {[1,2,3,4,5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.optionButton, answers[q.id] === String(n) && styles.optionSelected]}
                onPress={() => onChangeAnswer(q.id, String(n))}
              >
                <Text style={[styles.optionText, answers[q.id] === String(n) && styles.optionSelectedText]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerTitle: "تفاصيل الاستبيان",
          headerTitleAlign: "center",
          headerTitleStyle: { fontFamily: "Tajawal-Bold" },
        }}
      />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>{survey.title}</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.description}>{survey.description}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={16} color="#2E7D32" />
          <Text style={styles.metaText}>ينتهي في: {survey.dueDate}</Text>
        </View>

        <View style={{ height: 10 }} />
        {survey.questions && survey.questions.map((q, idx) => renderQuestion(q, idx))}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>إرسال الإجابات</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    padding: 20,
    backgroundColor: "#2E7D32",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: { width: 40 },
  placeholderButton: { width: 40 },
  headerText: {
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "Tajawal-Bold",
    flex: 1,
  },
  content: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { marginTop: 10, fontSize: 16, fontFamily: "Tajawal-Regular", color: "#e53e3e", textAlign: "center" },
  retryButton: { backgroundColor: "#2E7D32", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 16 },
  retryButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 16 },
  description: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#333333", lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  metaText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#666666" },
  questionCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 12, padding: 14, marginTop: 14 },
  questionTitle: { fontSize: 16, fontFamily: "Tajawal-Bold", color: "#2E7D32", marginBottom: 8 },
  textInput: { borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: "top" },
  optionsContainer: { gap: 8 },
  optionButton: { backgroundColor: "#F5F5F5", borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  optionSelected: { backgroundColor: "#E8F5E9", borderColor: "#2E7D32" },
  optionText: { fontSize: 14, fontFamily: "Tajawal-Regular", color: "#333333" },
  optionSelectedText: { color: "#2E7D32", fontFamily: "Tajawal-Bold" },
  submitButton: { backgroundColor: "#2E7D32", paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 16 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: "#FFFFFF", fontFamily: "Tajawal-Bold", fontSize: 16 },
});
