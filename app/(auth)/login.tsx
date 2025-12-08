import { useState, useContext } from "react";
import { View, Text, TextInput, Button, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { AuthContext } from "../../context/AuthContext"; // Path to your AuthContext
import { apiService } from "../../services/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Spacing from "../../constants/Spacing";
import FontSize from "../../constants/FontSize";
import Colors from "../../constants/Colors";
import Font from "../../constants/Font";
import AppTextInput from "../../components/AppTextInput";

const Login: React.FC = () => {

  const [mobileNumber, setMobileNumber] = useState("900000001"); // Default to mobile number (without country code)
  const [password, setPassword] = useState("admin123"); // Default password
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const authContext = useContext(AuthContext);
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  const handleLogin = async () => {
    if (!mobileNumber || !password) {
      return Alert.alert("رجاءا أدخل البيانات كاملة لإكمال عملية تسجيل الدخول");
    }

    setIsLoading(true);
    
    try {
      // Add Sudan country code (+249) to the mobile number
      const fullMobileNumber = `+249${mobileNumber}`;
      
      // Attempt login with backend
      const result = await apiService.login(fullMobileNumber, password);
      
      if (!result || !result.token) {
        throw new Error("لم يتم استلام بيانات المصادقة من الخادم");
      }
      
      // Check if user has USER role (not ADMIN)
      if (result.user && result.user.role === "ADMIN") {
        throw new Error("غير مصرح لك بالدخول إلى التطبيق. يرجى استخدام لوحة التحكم الإدارية");
      }
      
      // Store token and user data in secure storage
      await authContext?.login(result.token, result.user);
      
      // Skip token verification for now
      console.log("Login successful, redirecting to home");
      router.replace("/home");
    } catch (error: any) {
      Alert.alert("خطأ في تسجيل الدخول", error.message || "البيانات التي ادخلتها غير صحيحة");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View
        style={{
          padding: Spacing * 2,
          flex: 1,
        }}
      >
        <View
          style={{
            alignItems: "center",
            marginTop: Spacing * 4,
          }}
        >
          <Text
            style={{
              fontSize: FontSize.xxLarge,
              color: Colors.primary,
              fontFamily: Font["Tajawal-Bold"],
              marginVertical: Spacing * 3,
            }}
          >
            تسجيل دخول
          </Text>
          <Text
            style={{
              fontFamily: Font["Tajawal-Medium"],
              fontSize: FontSize.large,
              maxWidth: "60%",
              textAlign: "center",
              color: Colors.text,
            }}
          >
            مرحبا بك مرة اخرى
          </Text>
        </View>
        <View
          style={{
            marginVertical: Spacing * 3,
          }}
        >
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
              placeholder="رقم الجوال"
              keyboardType="phone-pad"
              onChangeText={setMobileNumber}
              value={mobileNumber}
              style={{ paddingLeft: 50 }}
            />
          </View>
          <View style={{ position: 'relative' }}>
            <AppTextInput
              placeholder="كلمة المرور"
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              value={password}
            />
            <TouchableOpacity 
              onPress={toggleShowPassword}
              style={{
                position: 'absolute',
                right: 15,
                top: 15,
              }}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={24} 
                color={Colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text
            style={{
              fontFamily: Font["Tajawal-Bold"],
              fontSize: FontSize.small,
              color: Colors.primary,
              alignSelf: "flex-end",
            }}
          >
            هل نسيت كلمة المرور؟
          </Text>
        </View>

        <TouchableOpacity
          style={{
            padding: Spacing * 2,
            backgroundColor: Colors.primary,
            marginVertical: Spacing * 3,
            borderRadius: Spacing,
            shadowColor: Colors.primary,
            shadowOffset: {
              width: 0,
              height: Spacing,
            },
            shadowOpacity: 0.3,
            shadowRadius: Spacing,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.textWhite} size="small" style={{ marginRight: 10 }} />
          ) : null}
          <Text
            style={{
              fontFamily: Font["Tajawal-Bold"],
              color: Colors.textWhite,
              textAlign: "center",
              fontSize: FontSize.large,
            }}
          >
            {isLoading ? "جاري تسجيل الدخول..." : "دخول"}
          </Text>
        </TouchableOpacity>
        {/* Signup removed - users register through admin panel */}
      </View>
    </SafeAreaView>
  );
}

export default Login;