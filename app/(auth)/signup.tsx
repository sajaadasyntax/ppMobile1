import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { apiService } from "../../services/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Spacing from "../../constants/Spacing";
import FontSize from "../../constants/FontSize";
import Colors from "../../constants/Colors";
import Font from "../../constants/Font";
import AppTextInput from "../../components/AppTextInput";

// Hierarchy types
type HierarchyType = 'GEOGRAPHIC' | 'EXPATRIATE';

// Hierarchy interfaces
interface District {
  id: string;
  name: string;
}

interface AdminUnit {
  id: string;
  name: string;
  districts: District[];
}

interface Locality {
  id: string;
  name: string;
  adminUnits: AdminUnit[];
}

interface Region {
  id: string;
  name: string;
  localities: Locality[];
}

// Expatriate hierarchy interfaces
interface ExpatriateDistrict {
  id: string;
  name: string;
}

interface ExpatriateAdminUnit {
  id: string;
  name: string;
  districts: ExpatriateDistrict[];
}

interface ExpatriateLocality {
  id: string;
  name: string;
  adminUnits: ExpatriateAdminUnit[];
}

interface ExpatriateRegion {
  id: string;
  name: string;
  localities: ExpatriateLocality[];
}

const Signup: React.FC = () => {
  const router = useRouter();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Hierarchy type selection
  const [hierarchyType, setHierarchyType] = useState<HierarchyType>('GEOGRAPHIC');
  
  // Geographic hierarchy state
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [selectedLocality, setSelectedLocality] = useState<Locality | null>(null);
  const [selectedAdminUnit, setSelectedAdminUnit] = useState<AdminUnit | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  
  // Expatriate hierarchy state
  const [expatriateRegions, setExpatriateRegions] = useState<ExpatriateRegion[]>([]);
  const [selectedExpRegion, setSelectedExpRegion] = useState<ExpatriateRegion | null>(null);
  const [selectedExpLocality, setSelectedExpLocality] = useState<ExpatriateLocality | null>(null);
  const [selectedExpAdminUnit, setSelectedExpAdminUnit] = useState<ExpatriateAdminUnit | null>(null);
  const [selectedExpDistrict, setSelectedExpDistrict] = useState<ExpatriateDistrict | null>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  
  // Dropdown visibility
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showLocalityDropdown, setShowLocalityDropdown] = useState(false);
  const [showAdminUnitDropdown, setShowAdminUnitDropdown] = useState(false);
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);

  // Load hierarchy data based on type
  useEffect(() => {
    loadHierarchyData();
  }, [hierarchyType]);

  const loadHierarchyData = async () => {
    setIsLoadingHierarchy(true);
    try {
      if (hierarchyType === 'GEOGRAPHIC') {
        const data = await apiService.getPublicHierarchy();
        setRegions(data || []);
      } else {
        const data = await apiService.getPublicExpatriateHierarchy();
        setExpatriateRegions(data || []);
      }
    } catch (error: any) {
      console.error('Error loading hierarchy:', error);
      Alert.alert('خطأ', 'فشل تحميل البيانات');
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  // Reset selections when hierarchy type changes
  const handleHierarchyTypeChange = (type: HierarchyType) => {
    setHierarchyType(type);
    // Reset geographic selections
    setSelectedRegion(null);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
    // Reset expatriate selections
    setSelectedExpRegion(null);
    setSelectedExpLocality(null);
    setSelectedExpAdminUnit(null);
    setSelectedExpDistrict(null);
    // Close all dropdowns
    setShowRegionDropdown(false);
    setShowLocalityDropdown(false);
    setShowAdminUnitDropdown(false);
    setShowDistrictDropdown(false);
  };

  // Handle geographic region selection
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSelectedLocality(null);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
    setShowRegionDropdown(false);
  };

  // Handle geographic locality selection
  const handleLocalitySelect = (locality: Locality) => {
    setSelectedLocality(locality);
    setSelectedAdminUnit(null);
    setSelectedDistrict(null);
    setShowLocalityDropdown(false);
  };

  // Handle geographic admin unit selection
  const handleAdminUnitSelect = (adminUnit: AdminUnit) => {
    setSelectedAdminUnit(adminUnit);
    setSelectedDistrict(null);
    setShowAdminUnitDropdown(false);
  };

  // Handle geographic district selection
  const handleDistrictSelect = (district: District) => {
    setSelectedDistrict(district);
    setShowDistrictDropdown(false);
  };

  // Handle expatriate region selection
  const handleExpRegionSelect = (region: ExpatriateRegion) => {
    setSelectedExpRegion(region);
    setSelectedExpLocality(null);
    setSelectedExpAdminUnit(null);
    setSelectedExpDistrict(null);
    setShowRegionDropdown(false);
  };

  // Handle expatriate locality selection
  const handleExpLocalitySelect = (locality: ExpatriateLocality) => {
    setSelectedExpLocality(locality);
    setSelectedExpAdminUnit(null);
    setSelectedExpDistrict(null);
    setShowLocalityDropdown(false);
  };

  // Handle expatriate admin unit selection
  const handleExpAdminUnitSelect = (adminUnit: ExpatriateAdminUnit) => {
    setSelectedExpAdminUnit(adminUnit);
    setSelectedExpDistrict(null);
    setShowAdminUnitDropdown(false);
  };

  // Handle expatriate district selection
  const handleExpDistrictSelect = (district: ExpatriateDistrict) => {
    setSelectedExpDistrict(district);
    setShowDistrictDropdown(false);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم الكامل');
      return false;
    }
    if (!nationalId.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الرقم الوطني');
      return false;
    }
    if (!mobileNumber.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الجوال');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال البريد الإلكتروني');
      return false;
    }
    if (!password || password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمة المرور غير متطابقة');
      return false;
    }
    
    // Validate hierarchy selection
    if (hierarchyType === 'GEOGRAPHIC') {
      if (!selectedDistrict) {
        Alert.alert('خطأ', 'الرجاء اختيار الحي');
        return false;
      }
    } else {
      if (!selectedExpDistrict) {
        Alert.alert('خطأ', 'الرجاء اختيار حي المغتربين');
        return false;
      }
    }
    
    return true;
  };

  // Handle signup
  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const fullMobileNumber = `+249${mobileNumber}`;
      
      const signupData = {
        personalInfo: {
          fullName: fullName.trim(),
          nationalId: nationalId.trim(),
        },
        residenceInfo: {
          mobile: fullMobileNumber,
          email: email.trim().toLowerCase(),
        },
        hierarchyInfo: {
          hierarchyType: hierarchyType,
          ...(hierarchyType === 'GEOGRAPHIC' 
            ? { districtId: selectedDistrict?.id }
            : { expatriateDistrictId: selectedExpDistrict?.id }
          ),
        },
        password: password,
        publicSignup: true,
      };

      await apiService.publicSignup(signupData);
      
      Alert.alert(
        'تم التسجيل بنجاح',
        'تم إنشاء حسابك بنجاح. سيتم تفعيل حسابك من قبل المسؤول قريباً.',
        [
          {
            text: 'حسناً',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('خطأ في التسجيل', error.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setIsLoading(false);
    }
  };

  // Render dropdown
  const renderDropdown = (
    items: { id: string; name: string }[],
    onSelect: (item: any) => void,
    isVisible: boolean,
    setVisible: (visible: boolean) => void,
    placeholder: string,
    selectedItem: { id: string; name: string } | null,
    disabled: boolean = false
  ) => (
    <View style={{ marginBottom: Spacing }}>
      <TouchableOpacity
        style={{
          backgroundColor: disabled ? '#F0F0F0' : Colors.lightPrimary,
          paddingHorizontal: Spacing * 2,
          paddingVertical: Spacing * 1.5,
          borderRadius: Spacing,
          borderWidth: 1,
          borderColor: Colors.borderWithOpacity,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
        onPress={() => !disabled && setVisible(!isVisible)}
        disabled={disabled}
      >
        <Text style={{
          fontFamily: Font["Tajawal-Regular"],
          fontSize: FontSize.medium,
          color: selectedItem ? Colors.text : Colors.darkText,
        }}>
          {selectedItem?.name || placeholder}
        </Text>
        <Ionicons 
          name={isVisible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={Colors.primary} 
        />
      </TouchableOpacity>
      
      {isVisible && items.length > 0 && (
        <View style={{
          backgroundColor: '#FFFFFF',
          borderRadius: Spacing,
          borderWidth: 1,
          borderColor: Colors.borderWithOpacity,
          marginTop: 4,
          maxHeight: 200,
        }}>
          <ScrollView nestedScrollEnabled>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={{
                  paddingHorizontal: Spacing * 2,
                  paddingVertical: Spacing * 1.2,
                  borderBottomWidth: 1,
                  borderBottomColor: Colors.gray,
                }}
                onPress={() => onSelect(item)}
              >
                <Text style={{
                  fontFamily: Font["Tajawal-Regular"],
                  fontSize: FontSize.medium,
                  color: Colors.text,
                  textAlign: 'right',
                }}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ padding: Spacing * 2 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginTop: Spacing * 2, marginBottom: Spacing * 2 }}>
            <Text style={{
              fontSize: FontSize.xxLarge,
              color: Colors.primary,
              fontFamily: Font["Tajawal-Bold"],
              marginVertical: Spacing,
            }}>
              تسجيل جديد
            </Text>
            <Text style={{
              fontFamily: Font["Tajawal-Medium"],
              fontSize: FontSize.medium,
              textAlign: "center",
              color: Colors.text,
            }}>
              أنشئ حساباً جديداً للانضمام إلينا
            </Text>
          </View>

          {/* Hierarchy Type Selection */}
          <View style={{ marginBottom: Spacing * 2 }}>
            <Text style={{
              fontFamily: Font["Tajawal-Bold"],
              fontSize: FontSize.medium,
              color: Colors.text,
              marginBottom: Spacing,
              textAlign: 'right',
            }}>
              نوع العضوية
            </Text>
            <View style={{ flexDirection: 'row', gap: Spacing }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: Spacing * 1.5,
                  borderRadius: Spacing,
                  borderWidth: 2,
                  borderColor: hierarchyType === 'GEOGRAPHIC' ? Colors.primary : Colors.gray,
                  backgroundColor: hierarchyType === 'GEOGRAPHIC' ? Colors.lightPrimary : '#FFFFFF',
                  alignItems: 'center',
                }}
                onPress={() => handleHierarchyTypeChange('GEOGRAPHIC')}
              >
                <Ionicons 
                  name="location" 
                  size={28} 
                  color={hierarchyType === 'GEOGRAPHIC' ? Colors.primary : Colors.darkText} 
                />
                <Text style={{
                  fontFamily: Font["Tajawal-Bold"],
                  fontSize: FontSize.medium,
                  color: hierarchyType === 'GEOGRAPHIC' ? Colors.primary : Colors.darkText,
                  marginTop: 4,
                }}>
                  جغرافي
                </Text>
                <Text style={{
                  fontFamily: Font["Tajawal-Regular"],
                  fontSize: FontSize.small,
                  color: Colors.darkText,
                  textAlign: 'center',
                }}>
                  داخل السودان
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: Spacing * 1.5,
                  borderRadius: Spacing,
                  borderWidth: 2,
                  borderColor: hierarchyType === 'EXPATRIATE' ? Colors.primary : Colors.gray,
                  backgroundColor: hierarchyType === 'EXPATRIATE' ? Colors.lightPrimary : '#FFFFFF',
                  alignItems: 'center',
                }}
                onPress={() => handleHierarchyTypeChange('EXPATRIATE')}
              >
                <Ionicons 
                  name="airplane" 
                  size={28} 
                  color={hierarchyType === 'EXPATRIATE' ? Colors.primary : Colors.darkText} 
                />
                <Text style={{
                  fontFamily: Font["Tajawal-Bold"],
                  fontSize: FontSize.medium,
                  color: hierarchyType === 'EXPATRIATE' ? Colors.primary : Colors.darkText,
                  marginTop: 4,
                }}>
                  مغترب
                </Text>
                <Text style={{
                  fontFamily: Font["Tajawal-Regular"],
                  fontSize: FontSize.small,
                  color: Colors.darkText,
                  textAlign: 'center',
                }}>
                  خارج السودان
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Personal Information */}
          <View style={{ marginBottom: Spacing }}>
            <Text style={{
              fontFamily: Font["Tajawal-Bold"],
              fontSize: FontSize.medium,
              color: Colors.text,
              marginBottom: Spacing,
              textAlign: 'right',
            }}>
              البيانات الشخصية
            </Text>
            
            <AppTextInput
              placeholder="الاسم الكامل *"
              onChangeText={setFullName}
              value={fullName}
            />
            
            <AppTextInput
              placeholder="الرقم الوطني *"
              onChangeText={setNationalId}
              value={nationalId}
              keyboardType="number-pad"
            />
            
            <View style={{ position: 'relative' }}>
              <Text style={{
                position: 'absolute',
                left: 15,
                top: 15,
                fontSize: FontSize.medium,
                color: Colors.primary,
                fontFamily: Font["Tajawal-Regular"],
                zIndex: 1
              }}>
                +249
              </Text>
              <AppTextInput
                placeholder="رقم الجوال *"
                keyboardType="phone-pad"
                onChangeText={setMobileNumber}
                value={mobileNumber}
                style={{ paddingLeft: 50 }}
              />
            </View>
            
            <AppTextInput
              placeholder="البريد الإلكتروني *"
              onChangeText={setEmail}
              value={email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={{ position: 'relative' }}>
              <AppTextInput
                placeholder="كلمة المرور *"
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                value={password}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 15, top: 15 }}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color={Colors.primary} 
                />
              </TouchableOpacity>
            </View>
            
            <View style={{ position: 'relative' }}>
              <AppTextInput
                placeholder="تأكيد كلمة المرور *"
                secureTextEntry={!showConfirmPassword}
                onChangeText={setConfirmPassword}
                value={confirmPassword}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ position: 'absolute', right: 15, top: 15 }}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color={Colors.primary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Hierarchy Selection */}
          <View style={{ marginBottom: Spacing * 2 }}>
            <Text style={{
              fontFamily: Font["Tajawal-Bold"],
              fontSize: FontSize.medium,
              color: Colors.text,
              marginBottom: Spacing,
              textAlign: 'right',
            }}>
              {hierarchyType === 'GEOGRAPHIC' ? 'الموقع الجغرافي' : 'موقع المغتربين'}
            </Text>
            
            {isLoadingHierarchy ? (
              <View style={{ padding: Spacing * 2, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={{ marginTop: 8, fontFamily: Font["Tajawal-Regular"] }}>
                  جاري تحميل البيانات...
                </Text>
              </View>
            ) : hierarchyType === 'GEOGRAPHIC' ? (
              <>
                {/* Geographic Hierarchy Dropdowns */}
                {renderDropdown(
                  regions,
                  handleRegionSelect,
                  showRegionDropdown,
                  setShowRegionDropdown,
                  'اختر الولاية',
                  selectedRegion
                )}
                
                {renderDropdown(
                  selectedRegion?.localities || [],
                  handleLocalitySelect,
                  showLocalityDropdown,
                  setShowLocalityDropdown,
                  'اختر المحلية',
                  selectedLocality,
                  !selectedRegion
                )}
                
                {renderDropdown(
                  selectedLocality?.adminUnits || [],
                  handleAdminUnitSelect,
                  showAdminUnitDropdown,
                  setShowAdminUnitDropdown,
                  'اختر الوحدة الإدارية',
                  selectedAdminUnit,
                  !selectedLocality
                )}
                
                {renderDropdown(
                  selectedAdminUnit?.districts || [],
                  handleDistrictSelect,
                  showDistrictDropdown,
                  setShowDistrictDropdown,
                  'اختر الحي *',
                  selectedDistrict,
                  !selectedAdminUnit
                )}
              </>
            ) : (
              <>
                {/* Expatriate Hierarchy Dropdowns */}
                {renderDropdown(
                  expatriateRegions,
                  handleExpRegionSelect,
                  showRegionDropdown,
                  setShowRegionDropdown,
                  'اختر إقليم المغتربين',
                  selectedExpRegion
                )}
                
                {renderDropdown(
                  selectedExpRegion?.localities || [],
                  handleExpLocalitySelect,
                  showLocalityDropdown,
                  setShowLocalityDropdown,
                  'اختر المحلية',
                  selectedExpLocality,
                  !selectedExpRegion
                )}
                
                {renderDropdown(
                  selectedExpLocality?.adminUnits || [],
                  handleExpAdminUnitSelect,
                  showAdminUnitDropdown,
                  setShowAdminUnitDropdown,
                  'اختر الوحدة الإدارية',
                  selectedExpAdminUnit,
                  !selectedExpLocality
                )}
                
                {renderDropdown(
                  selectedExpAdminUnit?.districts || [],
                  handleExpDistrictSelect,
                  showDistrictDropdown,
                  setShowDistrictDropdown,
                  'اختر الحي *',
                  selectedExpDistrict,
                  !selectedExpAdminUnit
                )}
              </>
            )}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={{
              padding: Spacing * 2,
              backgroundColor: Colors.primary,
              marginVertical: Spacing,
              borderRadius: Spacing,
              shadowColor: Colors.primary,
              shadowOffset: { width: 0, height: Spacing },
              shadowOpacity: 0.3,
              shadowRadius: Spacing,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading && (
              <ActivityIndicator color={Colors.textWhite} size="small" style={{ marginRight: 10 }} />
            )}
            <Text style={{
              fontFamily: Font["Tajawal-Bold"],
              color: Colors.textWhite,
              textAlign: "center",
              fontSize: FontSize.large,
            }}>
              {isLoading ? "جاري التسجيل..." : "تسجيل"}
            </Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={{
              padding: Spacing,
              marginVertical: Spacing,
            }}
            onPress={() => router.push('/login')}
          >
            <Text style={{
              fontFamily: Font["Tajawal-Medium"],
              color: Colors.text,
              textAlign: "center",
              fontSize: FontSize.medium,
            }}>
              لديك حساب بالفعل؟{' '}
              <Text style={{ color: Colors.primary, fontFamily: Font["Tajawal-Bold"] }}>
                سجل دخول
              </Text>
            </Text>
          </TouchableOpacity>
          
          {/* Note about account activation */}
          <View style={{
            backgroundColor: Colors.lightPrimary,
            padding: Spacing * 1.5,
            borderRadius: Spacing,
            marginTop: Spacing,
          }}>
            <Text style={{
              fontFamily: Font["Tajawal-Regular"],
              fontSize: FontSize.small,
              color: Colors.darkText,
              textAlign: 'center',
            }}>
              ملاحظة: سيتم مراجعة حسابك وتفعيله من قبل المسؤول بعد التسجيل
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Signup;

