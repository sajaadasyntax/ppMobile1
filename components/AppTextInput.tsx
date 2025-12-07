import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
  } from "react-native";
  import React, { useState } from "react";
  import Colors from "../constants/Colors";
  import Font from "../constants/Font";
  import FontSize from "../constants/FontSize";
  import Spacing from "../constants/Spacing";
  
  const AppTextInput: React.FC<TextInputProps> = ({ ...otherProps }) => {
    const [focused, setFocused] = useState<boolean>(false);
    return (
      <TextInput
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={Colors.darkText}
        underlineColorAndroid="transparent"
        style={[
          {
            fontFamily: Font["Tajawal-Regular"],
            fontSize: FontSize.small,
            padding: Spacing * 2,
            backgroundColor: Colors.lightPrimary,
            borderRadius: Spacing,
            marginVertical: Spacing,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            opacity: 1,
          },
          focused && {
            fontFamily: Font["Tajawal-Regular"],
            borderWidth: 3,
            borderColor: Colors.primary,
            shadowOffset: { width: 4, height: Spacing },
            shadowColor: Colors.primary,
            shadowOpacity: 0.2,
            shadowRadius: Spacing,
          },
          otherProps.style,
        ]}
        {...otherProps}
      />
    );
  };
  
  export default AppTextInput;
  
  const styles = StyleSheet.create({});