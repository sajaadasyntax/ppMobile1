import { TouchableOpacity, Text } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
const CustomButton = (props: { bgColor: any; navigation: string; goto: any; textColor: any; content: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; }) => {
    const router = useRouter();
    return (
    <TouchableOpacity
      className="mt-3 rounded-xl py-3"
      style={{ elevation: 1, backgroundColor: props.bgColor }}
      onPress={() => router.replace("/(auth)/login")}
    >
      <Text
        className="text-center text-base"
        style={{ color: props.textColor }}
      >
        {props.content}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomButton;