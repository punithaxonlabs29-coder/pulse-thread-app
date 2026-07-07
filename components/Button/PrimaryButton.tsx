import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "../../constants/Colors";

export default function PrimaryButton() {
  return (
    <TouchableOpacity activeOpacity={0.9}>
      <LinearGradient
        colors={[
          Colors.primary,
          Colors.secondary,
        ]}
        style={styles.button}
      >
        <Text style={styles.text}>
          Login
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 58,

    borderRadius: 15,

    justifyContent: "center",

    alignItems: "center",

    marginTop: 35,
  },

  text: {
    color: "#fff",

    fontWeight: "700",

    fontSize: 18,
  },
});