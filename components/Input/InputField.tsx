import React from "react";
import {
    StyleSheet,
    TextInput,
    View,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import { Colors } from "../../constants/Colors";

interface Props {
  placeholder: string;
  icon: any;
  secureTextEntry?: boolean;
}

export default function InputField({
  placeholder,
  icon,
  secureTextEntry = false,
}: Props) {
  return (
    <View style={styles.container}>
      <Feather
        name={icon}
        size={22}
        color={Colors.placeholder}
      />

      <TextInput
        placeholder={placeholder}
        placeholderTextColor={Colors.placeholder}
        style={styles.input}
        secureTextEntry={secureTextEntry}
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

const styles = StyleSheet.create({
  container: {
    height: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.border,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 18,

    marginTop: 15,
  },

  input: {
    flex: 1,

    marginLeft: 12,

    fontSize: 16,
  },
});
