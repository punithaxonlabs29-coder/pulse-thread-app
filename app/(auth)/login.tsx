import React, { useState } from "react";
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { AuthService } from "../../services/auth.service";

export default function LoginScreen() {
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

      <Text style={styles.title}>
        Welcome Back!
      </Text>

      <Text style={styles.subtitle}>
        Sign in to continue to Pulse Threads
      </Text>

      {/* Email */}

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={22}
          color="#8A8A8A"
        />

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email Address"
          placeholderTextColor="#999"
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
          color="#8A8A8A"
        />

        <TextInput
          value={pin}
          onChangeText={setPin}
          placeholder="PIN"
          placeholderTextColor="#999"
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
            color="#8A8A8A"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity>
        <Text style={styles.forgot}>
          Forgot PIN?
        </Text>
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
        <Text style={styles.buttonText}>
          {loading
            ? "Signing In..."
            : "Login"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
  },

  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    resizeMode: "contain",
    marginBottom: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    textAlign: "center",
    color: "#111827",
  },

  subtitle: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 40,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 58,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },

  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#111827",
  },

  forgot: {
    textAlign: "right",
    color: "#F97316",
    marginBottom: 30,
    fontWeight: "600",
  },

  button: {
    height: 58,
    backgroundColor: "#F97316",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

});
