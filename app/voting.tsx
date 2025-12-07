import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Voting() {
  const router = useRouter();

  const navigateToElectoralVoting = () => {
    router.push("/electoral-voting" as const);
  };

  const navigateToOpinionVoting = () => {
    router.push("/opinion-voting" as const);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>التصويت</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subTitle}>اختر نوع التصويت</Text>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={navigateToElectoralVoting}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#2E7D32" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>تصويت انتخابي</Text>
            <Text style={styles.optionDescription}>
              صوت في الانتخابات الرسمية وساهم في اختيار ممثليك
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={navigateToOpinionVoting}
        >
          <View style={styles.optionIconContainer}>
            <Ionicons name="bar-chart" size={48} color="#2E7D32" />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={styles.optionTitle}>تصويت رأي</Text>
            <Text style={styles.optionDescription}>
              شارك برأيك في استطلاعات الرأي واستفتاءات المجتمع
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#2E7D32" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color="#2E7D32" />
            <Text style={styles.infoTitle}>معلومات عن التصويت</Text>
          </View>
          <Text style={styles.infoText}>
            • التصويت الانتخابي خاص بالانتخابات الرسمية التي تنظمها الهيئة
          </Text>
          <Text style={styles.infoText}>
            • تصويت الرأي عبارة عن استطلاعات واستفتاءات لمعرفة آراء المستخدمين
          </Text>
          <Text style={styles.infoText}>
            • كل الأصوات مشفرة ومحمية لضمان خصوصيتك
          </Text>
          <Text style={styles.infoText}>
            • يمكنك الوصول إلى سجل تصويتك من خلال الملف الشخصي
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