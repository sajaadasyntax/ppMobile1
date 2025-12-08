import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Help() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, textAlign: "center" }}>المساعدة</Text>
      </View>
    </SafeAreaView>
  );
} 