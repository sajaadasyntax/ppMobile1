import { View, Text, TouchableOpacity, ScrollView, Dimensions, SafeAreaView, ActivityIndicator } from "react-native";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import Spacing from "../../constants/Spacing";
import Font from "../../constants/Font";
import FontSize from "../../constants/FontSize";
import { apiService } from "../../services/api";
import { getUserScopeDescription } from "../../utils/hierarchyUtils";
import { Ionicons } from "@expo/vector-icons";

const { height } = Dimensions.get("window");

// Menu items
const menuItems = [
  { title: "النشرة", route: "/bulletin", icon: "newspaper" },
  { title: "المحادثات", route: "/chat", icon: "chatbubbles" },
  { title: "الاشتراكات", route: "/subscriptions", icon: "card" },
  { title: "التصويت", route: "/voting", icon: "checkbox" },
  { title: "الاستبيانات", route: "/surveys", icon: "list" },
  { title: "تقديم التقارير", route: "/submit-report", icon: "document-text" },
  { title: "تقاريري", route: "/my-reports", icon: "folder-open" },
  { title: "الأرشيف", route: "/archive", icon: "archive" },
  { title: "الإشعارات", route: "/notifications", icon: "notifications" },
  { title: "الملف الشخصي", route: "/profile", icon: "person" },
  { title: "المساعدة", route: "/help", icon: "help-circle" },
];

// Define types for our data
interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
  memberDetails?: {
    fullName?: string;
    mobile?: string;
  };
}

export default function Home() {
  const { token, user, logout } = useContext(AuthContext) || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserData() {
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        const profileData = await apiService.getProfile();
        setUserProfile(profileData);
        console.log("User profile loaded:", profileData);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [token, router]);

  const handleLogout = async () => {
    if (logout) {
      await logout();
    }
    router.replace("/login");
  };

  const navigateTo = (route: string) => {
    router.push(route as any);
  };

  // If not authenticated, don't show content
  if (!token) {
    return null;
  }

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={{ marginTop: 20, fontFamily: "Tajawal-Medium" }}>جاري تحميل البيانات...</Text>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontFamily: "Tajawal-Bold", fontSize: 18, textAlign: 'center' }}>
          {error}
        </Text>
        <TouchableOpacity 
          onPress={handleLogout}
          style={{
            backgroundColor: "#e53e3e",
            paddingVertical: Spacing,
            paddingHorizontal: Spacing * 2,
            borderRadius: 12,
            marginTop: Spacing * 2,
          }}
        >
          <Text style={{ color: 'white', fontFamily: "Tajawal-Bold" }}>
            تسجيل الخروج
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Get display name
  const displayName = 
    userProfile?.memberDetails?.fullName ||
    [userProfile?.profile?.firstName, userProfile?.profile?.lastName].filter(Boolean).join(" ") ||
    userProfile?.name ||
    "المستخدم";

  const displayPhone = 
    userProfile?.memberDetails?.mobile ||
    userProfile?.profile?.phoneNumber ||
    "";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header Section */}
        <View
          style={{
            height: height / 3,
            backgroundColor: "#2E7D32",
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: Spacing * 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              color: "#FFFFFF",
              fontFamily: "Tajawal-Bold",
              textAlign: "center",
              marginTop: Spacing * 2,
            }}
          >
            مرحباً بك {displayName}
          </Text>
          
          {/* User info */}
          <View style={{ marginVertical: Spacing }}>
            {displayPhone && (
              <Text
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  fontFamily: "Tajawal-Medium",
                  textAlign: "center",
                  opacity: 0.9,
                }}
              >
                {displayPhone}
              </Text>
            )}
            {user && (
              <Text
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  fontFamily: "Tajawal-Medium",
                  textAlign: "center",
                  opacity: 0.8,
                  marginTop: 4,
                }}
              >
                {getUserScopeDescription(user)}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: "#e53e3e",
              paddingVertical: Spacing,
              paddingHorizontal: Spacing * 2,
              borderRadius: 12,
              marginTop: Spacing,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "Tajawal-Bold",
                fontSize: 16,
              }}
            >
              تسجيل الخروج
            </Text>
          </TouchableOpacity>
          
          <Text
            style={{
              fontSize: 16,
              color: "#FFFFFF",
              fontFamily: "Tajawal-Regular",
              textAlign: "center",
              marginTop: Spacing,
              opacity: 0.9,
            }}
          >
            اختر الخدمة التي تريدها
          </Text>
        </View>

        {/* Menu Items Section */}
        <View
          style={{
            paddingHorizontal: Spacing * 2,
            paddingTop: Spacing * 4,
            paddingBottom: Spacing * 2,
            flex: 1,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => navigateTo(item.route)}
                style={{
                  backgroundColor: "#FFFFFF",
                  paddingVertical: Spacing * 2,
                  paddingHorizontal: Spacing * 2,
                  width: "48%",
                  borderRadius: 15,
                  marginBottom: Spacing * 2,
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  borderWidth: 1,
                  borderColor: "#E0E0E0",
                  alignItems: "center",
                }}
              >
                <Ionicons name={item.icon as any} size={32} color="#2E7D32" />
                <Text
                  style={{
                    fontFamily: "Tajawal-Bold",
                    fontSize: 16,
                    color: "#333333",
                    marginTop: Spacing,
                    textAlign: "center",
                  }}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
