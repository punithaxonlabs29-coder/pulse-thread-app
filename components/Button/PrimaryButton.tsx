import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "../../constants/Colors";
import { styles } from './PrimaryButton.styles';


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

