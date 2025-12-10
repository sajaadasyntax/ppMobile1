import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState, useContext } from "react";
import { apiService } from "../../services/api";
import { AuthContext, User } from "../../context/AuthContext";
import { useRouter } from "expo-router";
import { getHierarchyLevelName, getUserHierarchyPath, getUserScopeDescription } from "../../utils/hierarchyUtils";
import HierarchySelector from "../../components/HierarchySelector";

// Define user profile interface
interface UserProfile {
  id: string;
  email: string | null;
  mobileNumber?: string | null;
  role: string;
  adminLevel?: string;
  createdAt?: string;
  updatedAt?: string;
  // Hierarchy
  region?: { id: string; name: string; code?: string | null } | null;
  locality?: { id: string; name: string; code?: string | null } | null;
  adminUnit?: { id: string; name: string; code?: string | null } | null;
  district?: { id: string; name: string; code?: string | null } | null;
  // Profile and member details
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    status?: string | null;
  } | null;
  memberDetails?: {
    fullName?: string | null;
    mobile?: string | null;
    state?: string | null;
    locality?: string | null;
    nationalId?: string | null;
  } | null;
}

// Define subscription interface
interface Subscription {
  id: string;
  planId: string;
  userId: string;
  startDate: string;
  endDate: string;
  status: string;
  plan?: {
    title: string;
    price: string;
    currency: string;
    period: string;
  };
}

export default function Profile() {
  const { token, user, logout } = useContext(AuthContext) || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        // Fetch user profile
        const profileData = await apiService.getProfile();
        setUserProfile(profileData);
        console.log("User profile loaded:", profileData);
      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token, router]);

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
      </SafeAreaView>
    );
  }

  // Derive key fields from Prisma schema shape
  const displayName =
    userProfile?.memberDetails?.fullName?.trim() ||
    [userProfile?.profile?.firstName, userProfile?.profile?.lastName].filter(Boolean).join(" ") ||
    userProfile?.email ||
    "المستخدم";

  const displayMobile =
    userProfile?.mobileNumber ||
    userProfile?.profile?.phoneNumber ||
    userProfile?.memberDetails?.mobile ||
    "غير متوفر";

  const displayEmail = userProfile?.email || "غير متوفر";

  const statusText = userProfile?.profile?.status === 'disabled' ? 'غير مفعّل' : 'فعّال';

  const adminLvl = (userProfile?.adminLevel || user?.adminLevel) as any;

  const hierarchyText = (() => {
    const parts: string[] = [];
    if (userProfile?.region?.name) parts.push(`ولاية ${userProfile.region.name}`);
    if (userProfile?.locality?.name) parts.push(`محلية ${userProfile.locality.name}`);
    if (userProfile?.adminUnit?.name) parts.push(`وحدة إدارية ${userProfile.adminUnit.name}`);
    if (userProfile?.district?.name) parts.push(`حي ${userProfile.district.name}`);
    return parts.join(' / ') || 'غير محدد';
  })();

  // Format membership date
  const membershipDate = userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString('ar-SA')
    : "غير متوفر";

  // Subscription info removed

  // No stats needed anymore

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.profileImageContainer}>
            <Image
              source={require("../../assets/images/profile-placeholder.png")}
              style={styles.profileImage}
            />
          </View>
          <Text style={styles.name}>{displayName}</Text>
        </View>

        {/* Stats section removed */}

        <View style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={24} color="#2E7D32" />
              <Text style={styles.infoText}>{displayName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={24} color="#2E7D32" />
              <Text style={styles.infoText}>{displayEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={24} color="#2E7D32" />
              <Text style={styles.infoText}>{displayMobile}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={24} color="#2E7D32" />
              <Text style={styles.infoText}>تاريخ العضوية: {membershipDate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={24} color="#2E7D32" />
              <Text style={styles.infoText}>حالة الحساب: {statusText}</Text>
            </View>
            {user && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="business" size={24} color="#2E7D32" />
                  <Text style={styles.infoText}>
                    المستوى الإداري: {getHierarchyLevelName(adminLvl)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="location" size={24} color="#2E7D32" />
                  <Text style={styles.infoText}>
                    النطاق: {hierarchyText}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Hierarchy Selector */}
          <View style={styles.hierarchySection}>
            <Text style={styles.sectionTitle}>إدارة التسلسل الهرمي</Text>
            <Text style={styles.sectionDescription}>
              اختر التسلسل الهرمي الذي تريد عرض المحتوى الخاص به
            </Text>
            <HierarchySelector 
              showMemberships={true}
              onHierarchyChange={(hierarchy) => {
                console.log('Hierarchy changed to:', hierarchy);
                // You can add additional logic here, like refreshing content
              }}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2E7D32",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  name: {
    fontSize: 24,
    color: "#FFFFFF",
    fontFamily: "Tajawal-Bold",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Tajawal-Regular",
    opacity: 0.9,
  },
  // Stats styles removed
  infoContainer: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  infoText: {
    fontSize: 16,
    fontFamily: "Tajawal-Regular",
    color: "#333333",
  },
  hierarchySection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Tajawal-Bold",
    color: "#333333",
    marginBottom: 8,
    textAlign: "right",
  },
  sectionDescription: {
    fontSize: 14,
    fontFamily: "Tajawal-Regular",
    color: "#666666",
    marginBottom: 12,
    textAlign: "right",
  },
}); 