import React, { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { AuthService } from "../../services/auth.service";
import { createStyles } from '../../styles/login.styles';
import { useColors } from '../../design';
import { AppText } from '../../components/ui/AppText';

export default function LoginScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");

  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Validation", "Please enter a valid email address.");
      return;
    }

    if (!pin.trim()) {
      Alert.alert("Validation", "Please enter your PIN.");
      return;
    }

    try {
      setLoading(true);

      const response = await AuthService.login(
        email,
        pin
      );

      if (response.status) {
        router.replace("/(tabs)");
      } else {
        Alert.alert(
          "Login Failed",
          response.message
        );
      }
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Error",
        "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <Image
        source={require("../../assets/images/pulse_thread.png")}
        style={styles.logo}
      />

      <AppText style={styles.title}>
        Welcome Back!
      </AppText>

      <AppText style={styles.subtitle}>
        Sign in to continue to Pulse Threads
      </AppText>

      {/* Email */}

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={22}
          color={colors.text.muted}
        />

        <TextInput
          autoFocus={true}
          cursorColor={colors.brand.primary}
          selectionColor="rgba(249, 115, 22, 0.3)"
          caretHidden={false}
          value={email}
          onChangeText={setEmail}
          placeholder="Email Address"
          placeholderTextColor={colors.text.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
      </View>

      {/* PIN */}

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={22}
          color={colors.text.muted}
        />

        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="PIN"
          placeholderTextColor={colors.text.muted}
          keyboardType="number-pad"
          secureTextEntry={!showPin}
          maxLength={6}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() =>
            setShowPin(!showPin)
          }
        >
          <Ionicons
            name={
              showPin
                ? "eye-off-outline"
                : "eye-outline"
            }
            size={22}
            color={colors.text.muted}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity>
        <AppText style={styles.forgot}>
          Forgot PIN?
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          loading && {
            opacity: 0.7,
          },
        ]}
        disabled={loading}
        onPress={handleLogin}
      >
        <AppText style={styles.buttonText}>
          {loading
            ? "Signing In..."
            : "Login"}
        </AppText>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
