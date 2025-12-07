import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Surveys() {
  const router = useRouter();

  const navigateToPublicSurveys = () => {
    router.push("/public-surveys" as any);
  };

  const navigateToMemberSurveys = () => {
    router.push("/member-surveys" as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>الاستبيانات</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subTitle}>اختر نوع الاستبيان</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={navigateToPublicSurveys}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="people" size={48} color="#2E7D32" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>استبيانات عامة</Text>
            <Text style={styles.optionDescription}>
              شارك في الاستبيانات العامة والتي تهم المجتمع بأكمله
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={navigateToMemberSurveys}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="person" size={48} color="#2E7D32" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>استبيانات الأعضاء</Text>
            <Text style={styles.optionDescription}>
              شارك في الاستبيانات الخاصة بالأعضاء المشتركين فقط
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#2E7D32" />
            <Text style={styles.infoTitle}>معلومات عن الاستبيانات</Text>
          </View>
          <Text style={styles.infoText}>
            • الاستبيانات العامة متاحة لجميع المستخدمين وتهتم بقضايا المجتمع
          </Text>
          <Text style={styles.infoText}>
            • استبيانات الأعضاء مخصصة للمشتركين فقط وتتناول مواضيع خاصة
          </Text>
          <Text style={styles.infoText}>
            • جميع البيانات المقدمة في الاستبيانات سرية ومحمية
          </Text>
          <Text style={styles.infoText}>
            • يمكنك مراجعة استبياناتك السابقة من خلال الملف الشخصي
          </Text>
          <Text style={styles.infoText}>
            • يتم إصدار تقارير دورية بنتائج الاستبيانات العامة
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
  },
  subTitle: {
    fontSize: 18,
    color: "#333333",
    fontFamily: "Tajawal-Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
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
  optionIconContainer: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    marginRight: 15,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: "Tajawal-Bold",
    color: "#2E7D32",
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
    marginBottom: 8,
    lineHeight: 20,
  },
}); 