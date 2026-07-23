import React from "react";
import {
  View,
} from "react-native";
import { AppTextInput } from "../ui/AppTextInput";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { styles } from './InputField.styles';

interface Props {
  placeholder: string;
  icon: any;
  secureTextEntry?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default function InputField({
  placeholder,
  icon,
  secureTextEntry = false,
  value,
  onChangeText,
}: Props) {
  return (
    <View style={styles.container}>
      <Feather
        name={icon}
        size={22}
        color={Colors.placeholder}
      />

      <AppTextInput
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        style={styles.input}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
      />

      {secureTextEntry && (
        <Feather
          name="eye"
          size={22}
          color={Colors.placeholder}
        />
      )}
    </View>
  );
}
