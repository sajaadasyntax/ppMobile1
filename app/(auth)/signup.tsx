import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { apiService } from "../../services/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Spacing from "../../constants/Spacing";
import FontSize from "../../constants/FontSize";
import Colors from "../../constants/Colors";
import Font from "../../constants/Font";
import AppTextInput from "../../components/AppTextInput";
import { validateMobileNumber, validatePassword, validateEmail, validateFullName, validateNationalId, formatMobileE164 } from "../../utils/validation";
import { USER_NAME_MAX, NATIONAL_ID_MAX, USER_EMAIL_MAX, USER_PASSWORD_MAX } from "../../constants/FieldLimits";

// ---------------------------------------------------------------------------
//  Types
// ---------------------------------------------------------------------------

type HierarchyType = "GEOGRAPHIC" | "EXPATRIATE";
type Step = 1 | 2 | 3;

interface District { id: string; name: string }
interface AdminUnit { id: string; name: string; districts: District[] }
interface Locality { id: string; name: string; adminUnits: AdminUnit[] }
interface Region { id: string; name: string; localities: Locality[] }

interface ExpatriateDistrict { id: string; name: string }
interface ExpatriateAdminUnit { id: string; name: string; districts: ExpatriateDistrict[] }
interface ExpatriateLocality { id: string; name: string; adminUnits: ExpatriateAdminUnit[] }
interface ExpatriateRegion { id: string; name: string; localities: ExpatriateLocality[] }

// ---------------------------------------------------------------------------
//  Constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get("window").width;
const TOTAL_STEPS = 3;

const STEP_LABELS: Record<Step, string> = {
  1: "نوع العضوية",
  2: "البيانات الشخصية",
  3: "الموقع",
};

// ---------------------------------------------------------------------------
//  Component
// ---------------------------------------------------------------------------

const Signup: React.FC = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  // ---- Step state ----
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ---- Form state ----
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ---- Hierarchy type ----
  const [hierarchyType, setHierarchyType] = useState<HierarchyType | null>(null);

  // ---- Geographic hierarchy ----
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<AdminUnit | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);

  // ---- Expatriate hierarchy ----
  const [expatriateRegions, setExpatriateRegions] = useState<ExpatriateRegion[]>([]);
  const [selectedExpRegion, setSelectedExpRegion] = useState<ExpatriateRegion | null>(null);
  const [selectedExpLocality, setSelectedExpLocality] = useState<ExpatriateLocality | null>(null);
  const [selectedExpAdminUnit, setSelectedExpAdminUnit] = useState<ExpatriateAdminUnit | null>(null);
  const [selectedExpDistrict, setSelectedExpDistrict] = useState<ExpatriateDistrict | null>(null);

  // ---- Loading ----
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

  // ---- Dropdowns ----
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showLocalityDropdown, setShowLocalityDropdown] = useState(false);
  const [showAdminUnitDropdown, setShowAdminUnitDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  // ---- Tooltip visibility ----
  const [showGeoTooltip, setShowGeoTooltip] = useState(false);
  const [showExpTooltip, setShowExpTooltip] = useState(false);

  // =========================================================================
  //  Side-effects
  // =========================================================================

  // Load hierarchy data when type is chosen and user proceeds to step 3
  useEffect(() => {
    if (currentStep === 3 && hierarchyType) {
      loadHierarchyData();
    }
  }, [currentStep, hierarchyType]);

  // Animate step transitions
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: currentStep - 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 120,
    }).start();
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [currentStep]);

  // =========================================================================
  //  Data loading
  // =========================================================================

  const loadHierarchyData = async () => {
    setIsLoadingHierarchy(true);
    try {
      if (hierarchyType === "GEOGRAPHIC") {
        const data = await apiService.getPublicHierarchy();
        setRegions(data || []);
      } else {
        const data = await apiService.getPublicExpatriateHierarchy();
        setExpatriateRegions(data || []);
      }
    } catch (error: any) {
      console.error("Error loading hierarchy:", error);
      Alert.alert("خطأ", "فشل تحميل البيانات");
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  // =========================================================================
  //  Hierarchy type selection (Step 1)
  // =========================================================================

  const handleHierarchyTypeChange = (type: HierarchyType) => {
    setHierarchyType(type);
    // Reset all hierarchy selections
    setSelectedRegion(null);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
    setSelectedExpRegion(null);
    setSelectedExpLocality(null);
    setSelectedExpAdminUnit(null);
    setSelectedExpDistrict(null);
    closeAllDropdowns();
  };

  // =========================================================================
  //  Dropdown handlers
  // =========================================================================

  const closeAllDropdowns = () => {
    setShowRegionDropdown(false);
    setShowLocalityDropdown(false);
    setShowAdminUnitDropdown(false);
    setShowDistrictDropdown(false);
  };

  // Geographic
  const handleRegionSelect = (r: Region) => { setSelectedRegion(r); setSelectedLocality(null); setSelectedAdminUnit(null); setSelectedDistrict(null); setShowRegionDropdown(false); };
  const handleLocalitySelect = (l: Locality) => { setSelectedLocality(l); setSelectedAdminUnit(null); setSelectedDistrict(null); setShowLocalityDropdown(false); };
  const handleAdminUnitSelect = (a: AdminUnit) => { setSelectedAdminUnit(a); setSelectedDistrict(null); setShowAdminUnitDropdown(false); };
  const handleDistrictSelect = (d: District) => { setSelectedDistrict(d); setShowDistrictDropdown(false); };

  // Expatriate
  const handleExpRegionSelect = (r: ExpatriateRegion) => { setSelectedExpRegion(r); setSelectedExpLocality(null); setSelectedExpAdminUnit(null); setSelectedExpDistrict(null); setShowRegionDropdown(false); };
  const handleExpLocalitySelect = (l: ExpatriateLocality) => { setSelectedExpLocality(l); setSelectedExpAdminUnit(null); setSelectedExpDistrict(null); setShowLocalityDropdown(false); };
  const handleExpAdminUnitSelect = (a: ExpatriateAdminUnit) => { setSelectedExpAdminUnit(a); setSelectedExpDistrict(null); setShowAdminUnitDropdown(false); };
  const handleExpDistrictSelect = (d: ExpatriateDistrict) => { setSelectedExpDistrict(d); setShowDistrictDropdown(false); };

  // =========================================================================
  //  Validation
  // =========================================================================

  const validateStep = (step: Step): boolean => {
    switch (step) {
      case 1:
        if (!hierarchyType) {
          Alert.alert("اختيار مطلوب", "الرجاء اختيار نوع العضوية للمتابعة");
          return false;
        }
        return true;

      case 2: {
        // Validation mirrors Backend constraints exactly — see utils/validation.ts
        const nameCheck = validateFullName(fullName);
        if (!nameCheck.valid) { Alert.alert("خطأ", nameCheck.error!); return false; }

        const idCheck = validateNationalId(nationalId);
        if (!idCheck.valid) { Alert.alert("خطأ", idCheck.error!); return false; }

        const mobileCheck = validateMobileNumber(mobileNumber);
        if (!mobileCheck.valid) { Alert.alert("خطأ", mobileCheck.error!); return false; }

        const emailCheck = validateEmail(email);
        if (!emailCheck.valid) { Alert.alert("خطأ", emailCheck.error!); return false; }

        const pwdCheck = validatePassword(password);
        if (!pwdCheck.valid) { Alert.alert("خطأ", pwdCheck.error!); return false; }

        if (password !== confirmPassword) { Alert.alert("خطأ", "كلمة المرور غير متطابقة"); return false; }
        return true;
      }

      case 3:
        if (hierarchyType === "GEOGRAPHIC" && !selectedDistrict) { Alert.alert("خطأ", "الرجاء اختيار الحي"); return false; }
        if (hierarchyType === "EXPATRIATE" && !selectedExpDistrict) { Alert.alert("خطأ", "الرجاء اختيار حي المغتربين"); return false; }
        return true;
    }
  };

  // =========================================================================
  //  Navigation
  // =========================================================================

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < TOTAL_STEPS) setCurrentStep((currentStep + 1) as Step);
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as Step);
    else router.push("/login");
  };

  // =========================================================================
  //  Submit
  // =========================================================================

  const handleSignup = async () => {
    if (!validateStep(3)) return;

    setIsLoading(true);
    try {
      const fullMobileNumber = formatMobileE164(mobileNumber);

      const signupData = {
        personalInfo: { fullName: fullName.trim(), nationalId: nationalId.trim() },
        residenceInfo: { mobile: fullMobileNumber, email: email.trim().toLowerCase() },
        hierarchyInfo: {
          hierarchyType: hierarchyType!,
          ...(hierarchyType === "GEOGRAPHIC"
            ? { districtId: selectedDistrict?.id }
            : { expatriateDistrictId: selectedExpDistrict?.id }),
        },
        password,
        publicSignup: true,
      };

      await apiService.publicSignup(signupData);

      Alert.alert(
        "تم التسجيل بنجاح",
        "تم إنشاء حسابك بنجاح. سيتم تفعيل حسابك من قبل المسؤول قريباً.",
        [{ text: "حسناً", onPress: () => router.replace("/login") }],
      );
    } catch (error: any) {
      Alert.alert("خطأ في التسجيل", error.message || "حدث خطأ أثناء التسجيل");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  //  Reusable dropdown renderer
  // =========================================================================

  const renderDropdown = (
    items: { id: string; name: string }[],
    onSelect: (item: any) => void,
    isVisible: boolean,
    setVisible: (v: boolean) => void,
    placeholder: string,
    selectedItem: { id: string; name: string } | null,
    disabled = false,
  ) => (
    <View style={{ marginBottom: Spacing }}>
      <TouchableOpacity
        style={{
          backgroundColor: disabled ? "#F0F0F0" : Colors.lightPrimary,
          paddingHorizontal: Spacing * 2,
          paddingVertical: Spacing * 1.5,
          borderRadius: Spacing,
          borderWidth: 1,
          borderColor: Colors.borderWithOpacity,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        onPress={() => !disabled && setVisible(!isVisible)}
        disabled={disabled}
      >
        <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: FontSize.medium, color: selectedItem ? Colors.text : Colors.darkText }}>
          {selectedItem?.name || placeholder}
        </Text>
        <Ionicons name={isVisible ? "chevron-up" : "chevron-down"} size={20} color={Colors.primary} />
      </TouchableOpacity>

      {isVisible && items.length > 0 && (
        <View style={{ backgroundColor: "#FFF", borderRadius: Spacing, borderWidth: 1, borderColor: Colors.borderWithOpacity, marginTop: 4, maxHeight: 200 }}>
          <ScrollView nestedScrollEnabled>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={{ paddingHorizontal: Spacing * 2, paddingVertical: Spacing * 1.2, borderBottomWidth: 1, borderBottomColor: Colors.gray }}
                onPress={() => onSelect(item)}
              >
                <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: FontSize.medium, color: Colors.text, textAlign: "right" }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  // =========================================================================
  //  Step indicator
  // =========================================================================

  const renderStepIndicator = () => (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: Spacing * 2, gap: 4 }}>
      {([1, 2, 3] as Step[]).map((s) => {
        const isActive = s === currentStep;
        const isCompleted = s < currentStep;
        return (
          <View key={s} style={{ flexDirection: "row", alignItems: "center" }}>
            {/* Connector line (except before first) */}
            {s > 1 && (
              <View style={{ width: 28, height: 2, backgroundColor: isCompleted || isActive ? Colors.primary : Colors.gray, marginHorizontal: 2 }} />
            )}
            {/* Circle */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isActive ? Colors.primary : isCompleted ? Colors.primary : "#F0F0F0",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: isActive ? 0 : 1,
                borderColor: isCompleted ? Colors.primary : Colors.gray,
              }}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={16} color="#FFF" />
              ) : (
                <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: 13, color: isActive ? "#FFF" : Colors.darkText }}>
                  {s}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  // =========================================================================
  //  STEP 1  –  Hierarchy Type Selection (visual cards)
  // =========================================================================

  const renderStep1 = () => (
    <Animated.View style={{ opacity: currentStep === 1 ? 1 : 0.3 }}>
      <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: FontSize.large, color: Colors.text, textAlign: "center", marginBottom: 6 }}>
        اختر نوع عضويتك
      </Text>
      <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: FontSize.small, color: Colors.darkText, textAlign: "center", marginBottom: Spacing * 2, lineHeight: 22 }}>
        اختر بناءً على مكان إقامتك الحالي. يمكنك تغيير هذا لاحقاً.
      </Text>

      {/* ── Geographic card ── */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          borderRadius: 16,
          borderWidth: 2,
          borderColor: hierarchyType === "GEOGRAPHIC" ? Colors.primary : "#E0E0E0",
          backgroundColor: hierarchyType === "GEOGRAPHIC" ? "#E8F5E9" : "#FAFAFA",
          padding: Spacing * 2,
          marginBottom: Spacing * 1.5,
          elevation: hierarchyType === "GEOGRAPHIC" ? 3 : 0,
          shadowColor: Colors.primary,
          shadowOpacity: hierarchyType === "GEOGRAPHIC" ? 0.15 : 0,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        }}
        onPress={() => handleHierarchyTypeChange("GEOGRAPHIC")}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: hierarchyType === "GEOGRAPHIC" ? Colors.primary : "#E8F5E9", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="earth" size={28} color={hierarchyType === "GEOGRAPHIC" ? "#FFF" : Colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: 18, color: hierarchyType === "GEOGRAPHIC" ? Colors.primary : Colors.text }}>
              عضوية جغرافية
            </Text>
            <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 13, color: Colors.darkText, marginTop: 2 }}>
              للمقيمين داخل السودان
            </Text>
          </View>
          {hierarchyType === "GEOGRAPHIC" && (
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </View>
          )}
        </View>

        {/* Info tooltip */}
        <TouchableOpacity
          onPress={() => { setShowGeoTooltip(!showGeoTooltip); setShowExpTooltip(false); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
          <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 12, color: Colors.primary }}>
            ما هي العضوية الجغرافية؟
          </Text>
        </TouchableOpacity>
        {showGeoTooltip && (
          <View style={{ backgroundColor: "#FFF", borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: "#E8F5E9" }}>
            <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 13, color: Colors.darkText, lineHeight: 22, textAlign: "right" }}>
              إذا كنت تقيم حالياً داخل السودان، اختر هذا النوع.{"\n"}
              سيتم تسجيلك ضمن التسلسل الإداري الجغرافي:{"\n"}
              <Text style={{ fontFamily: Font["Tajawal-Bold"] }}>ولاية ← محلية ← وحدة إدارية ← حي</Text>
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Expatriate card ── */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={{
          borderRadius: 16,
          borderWidth: 2,
          borderColor: hierarchyType === "EXPATRIATE" ? "#1565C0" : "#E0E0E0",
          backgroundColor: hierarchyType === "EXPATRIATE" ? "#E3F2FD" : "#FAFAFA",
          padding: Spacing * 2,
          marginBottom: Spacing * 1.5,
          elevation: hierarchyType === "EXPATRIATE" ? 3 : 0,
          shadowColor: "#1565C0",
          shadowOpacity: hierarchyType === "EXPATRIATE" ? 0.15 : 0,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
        }}
        onPress={() => handleHierarchyTypeChange("EXPATRIATE")}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: hierarchyType === "EXPATRIATE" ? "#1565C0" : "#E3F2FD", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="airplane" size={28} color={hierarchyType === "EXPATRIATE" ? "#FFF" : "#1565C0"} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: 18, color: hierarchyType === "EXPATRIATE" ? "#1565C0" : Colors.text }}>
              عضوية مغتربين
            </Text>
            <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 13, color: Colors.darkText, marginTop: 2 }}>
              للمقيمين خارج السودان
            </Text>
          </View>
          {hierarchyType === "EXPATRIATE" && (
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#1565C0", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => { setShowExpTooltip(!showExpTooltip); setShowGeoTooltip(false); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="information-circle-outline" size={16} color="#1565C0" />
          <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 12, color: "#1565C0" }}>
            ما هي عضوية المغتربين؟
          </Text>
        </TouchableOpacity>
        {showExpTooltip && (
          <View style={{ backgroundColor: "#FFF", borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: "#E3F2FD" }}>
            <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 13, color: Colors.darkText, lineHeight: 22, textAlign: "right" }}>
              إذا كنت تقيم خارج السودان (في أي دولة أخرى)، اختر هذا النوع.{"\n"}
              سيتم تسجيلك ضمن تسلسل المغتربين:{"\n"}
              <Text style={{ fontFamily: Font["Tajawal-Bold"] }}>إقليم ← محلية ← وحدة إدارية ← حي</Text>
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Comparison strip */}
      <View style={{ backgroundColor: "#FFF9C4", borderRadius: 12, padding: 14, marginTop: 4, borderWidth: 1, borderColor: "#FFF176" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Ionicons name="bulb-outline" size={16} color="#F57F17" />
          <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: 13, color: "#F57F17" }}>هل أنت غير متأكد؟</Text>
        </View>
        <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 12, color: "#5D4037", lineHeight: 20, textAlign: "right" }}>
          اختر <Text style={{ fontFamily: Font["Tajawal-Bold"] }}>جغرافي</Text> إذا كنت داخل السودان.
          اختر <Text style={{ fontFamily: Font["Tajawal-Bold"] }}>مغتربين</Text> إذا كنت في الخارج.
          يمكنك طلب تغيير النوع لاحقاً من خلال التواصل مع المسؤول.
        </Text>
      </View>
    </Animated.View>
  );

  // =========================================================================
  //  STEP 2  –  Personal Information
  // =========================================================================

  const renderStep2 = () => (
    <View>
      {/* Selected type badge */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: Spacing * 2, gap: 8 }}>
        <Ionicons
          name={hierarchyType === "GEOGRAPHIC" ? "earth" : "airplane"}
          size={18}
          color={hierarchyType === "GEOGRAPHIC" ? Colors.primary : "#1565C0"}
        />
        <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: 14, color: hierarchyType === "GEOGRAPHIC" ? Colors.primary : "#1565C0" }}>
          {hierarchyType === "GEOGRAPHIC" ? "عضوية جغرافية" : "عضوية مغتربين"}
        </Text>
      </View>

      <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: FontSize.medium, color: Colors.text, marginBottom: Spacing, textAlign: "right" }}>
        البيانات الشخصية
      </Text>

      <AppTextInput placeholder="الاسم الكامل *" onChangeText={setFullName} value={fullName} maxLength={USER_NAME_MAX} />
      <AppTextInput placeholder="الرقم الوطني *" onChangeText={setNationalId} value={nationalId} keyboardType="number-pad" maxLength={NATIONAL_ID_MAX} />

      <View style={{ position: "relative" }}>
        <Text style={{ position: "absolute", left: 15, top: 15, fontSize: FontSize.medium, color: Colors.primary, fontFamily: Font["Tajawal-Regular"], zIndex: 1 }}>
          +249
        </Text>
        <AppTextInput placeholder="رقم الجوال *" keyboardType="phone-pad" onChangeText={setMobileNumber} value={mobileNumber} style={{ paddingLeft: 50 }} maxLength={9} />
      </View>

      <AppTextInput placeholder="البريد الإلكتروني *" onChangeText={setEmail} value={email} keyboardType="email-address" autoCapitalize="none" maxLength={USER_EMAIL_MAX} />

      <View style={{ position: "relative" }}>
        <AppTextInput placeholder="كلمة المرور *" secureTextEntry={!showPassword} onChangeText={setPassword} value={password} maxLength={USER_PASSWORD_MAX} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 15, top: 15 }}>
          <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ position: "relative" }}>
        <AppTextInput placeholder="تأكيد كلمة المرور *" secureTextEntry={!showConfirmPassword} onChangeText={setConfirmPassword} value={confirmPassword} maxLength={USER_PASSWORD_MAX} />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: "absolute", right: 15, top: 15 }}>
          <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // =========================================================================
  //  STEP 3  –  Hierarchy Location Selection
  // =========================================================================

  const renderStep3 = () => (
    <View>
      <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: FontSize.medium, color: Colors.text, marginBottom: Spacing, textAlign: "right" }}>
        {hierarchyType === "GEOGRAPHIC" ? "الموقع الجغرافي" : "موقع المغتربين"}
      </Text>

      {isLoadingHierarchy ? (
        <View style={{ padding: Spacing * 2, alignItems: "center" }}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={{ marginTop: 8, fontFamily: Font["Tajawal-Regular"] }}>جاري تحميل البيانات...</Text>
        </View>
      ) : hierarchyType === "GEOGRAPHIC" ? (
        <>
          {renderDropdown(regions, handleRegionSelect, showRegionDropdown, setShowRegionDropdown, "اختر الولاية", selectedRegion)}
          {renderDropdown(selectedRegion?.localities || [], handleLocalitySelect, showLocalityDropdown, setShowLocalityDropdown, "اختر المحلية", selectedLocality, !selectedRegion)}
          {renderDropdown(selectedLocality?.adminUnits || [], handleAdminUnitSelect, showAdminUnitDropdown, setShowAdminUnitDropdown, "اختر الوحدة الإدارية", selectedAdminUnit, !selectedLocality)}
          {renderDropdown(selectedAdminUnit?.districts || [], handleDistrictSelect, showDistrictDropdown, setShowDistrictDropdown, "اختر الحي *", selectedDistrict, !selectedAdminUnit)}
        </>
      ) : (
        <>
          {renderDropdown(expatriateRegions, handleExpRegionSelect, showRegionDropdown, setShowRegionDropdown, "اختر إقليم المغتربين", selectedExpRegion)}
          {renderDropdown(selectedExpRegion?.localities || [], handleExpLocalitySelect, showLocalityDropdown, setShowLocalityDropdown, "اختر المحلية", selectedExpLocality, !selectedExpRegion)}
          {renderDropdown(selectedExpLocality?.adminUnits || [], handleExpAdminUnitSelect, showAdminUnitDropdown, setShowAdminUnitDropdown, "اختر الوحدة الإدارية", selectedExpAdminUnit, !selectedExpLocality)}
          {renderDropdown(selectedExpAdminUnit?.districts || [], handleExpDistrictSelect, showDistrictDropdown, setShowDistrictDropdown, "اختر الحي *", selectedExpDistrict, !selectedExpAdminUnit)}
        </>
      )}

      {/* Summary card */}
      {(selectedDistrict || selectedExpDistrict) && (
        <View style={{ backgroundColor: Colors.lightPrimary, borderRadius: 12, padding: 14, marginTop: Spacing }}>
          <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: 14, color: Colors.primary, marginBottom: 4, textAlign: "right" }}>
            ملخص اختياراتك
          </Text>
          <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: 13, color: Colors.darkText, textAlign: "right", lineHeight: 22 }}>
            النوع: {hierarchyType === "GEOGRAPHIC" ? "جغرافي" : "مغتربين"}{"\n"}
            {hierarchyType === "GEOGRAPHIC"
              ? `${selectedRegion?.name} > ${selectedLocality?.name} > ${selectedAdminUnit?.name} > ${selectedDistrict?.name}`
              : `${selectedExpRegion?.name} > ${selectedExpLocality?.name} > ${selectedExpAdminUnit?.name} > ${selectedExpDistrict?.name}`}
          </Text>
        </View>
      )}
    </View>
  );

  // =========================================================================
  //  Render
  // =========================================================================

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF" }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} contentContainerStyle={{ padding: Spacing * 2 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: Spacing, marginBottom: Spacing * 2 }}>
            <TouchableOpacity onPress={goBack} style={{ padding: 4 }}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: FontSize.xLarge, color: Colors.primary, fontFamily: Font["Tajawal-Bold"] }}>
                تسجيل جديد
              </Text>
            </View>
            <View style={{ width: 28 }} />{/* Spacer for alignment */}
          </View>

          {/* Step label */}
          <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: FontSize.small, color: Colors.darkText, textAlign: "center", marginBottom: 8 }}>
            الخطوة {currentStep} من {TOTAL_STEPS}: {STEP_LABELS[currentStep]}
          </Text>

          {/* Step indicator */}
          {renderStepIndicator()}

          {/* Step content */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation buttons */}
          <View style={{ flexDirection: "row", marginTop: Spacing * 2, gap: Spacing }}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: Spacing * 1.5,
                  backgroundColor: "#F5F5F5",
                  borderRadius: Spacing,
                  alignItems: "center",
                }}
                onPress={goBack}
              >
                <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: FontSize.medium, color: Colors.darkText }}>السابق</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={{
                flex: currentStep > 1 ? 2 : 1,
                padding: Spacing * 1.5,
                backgroundColor: Colors.primary,
                borderRadius: Spacing,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: Spacing },
                shadowOpacity: 0.3,
                shadowRadius: Spacing,
                opacity: currentStep === 1 && !hierarchyType ? 0.5 : 1,
              }}
              onPress={currentStep === TOTAL_STEPS ? handleSignup : goNext}
              disabled={isLoading || (currentStep === 1 && !hierarchyType)}
            >
              {isLoading && <ActivityIndicator color="#FFF" size="small" style={{ marginRight: 8 }} />}
              <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: FontSize.medium, color: "#FFF" }}>
                {isLoading ? "جاري التسجيل..." : currentStep === TOTAL_STEPS ? "إنشاء الحساب" : "التالي"}
              </Text>
              {!isLoading && currentStep < TOTAL_STEPS && (
                <Ionicons name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 6 }} />
              )}
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <TouchableOpacity style={{ padding: Spacing, marginTop: Spacing }} onPress={() => router.push("/login")}>
            <Text style={{ fontFamily: Font["Tajawal-Medium"], fontSize: FontSize.medium, color: Colors.text, textAlign: "center" }}>
              لديك حساب بالفعل؟{" "}
              <Text style={{ color: Colors.primary, fontFamily: Font["Tajawal-Bold"] }}>سجل دخول</Text>
            </Text>
          </TouchableOpacity>

          {/* Activation note */}
          <View style={{ backgroundColor: Colors.lightPrimary, padding: Spacing * 1.5, borderRadius: Spacing, marginTop: Spacing }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
              <Text style={{ fontFamily: Font["Tajawal-Bold"], fontSize: FontSize.small, color: Colors.primary }}>
                ملاحظة مهمة
              </Text>
            </View>
            <Text style={{ fontFamily: Font["Tajawal-Regular"], fontSize: FontSize.small, color: Colors.darkText, textAlign: "center" }}>
              سيتم مراجعة حسابك وتفعيله من قبل المسؤول بعد التسجيل
            </Text>
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Signup;
