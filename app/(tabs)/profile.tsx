import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";
import { SessionService } from "../../services/session.service"; // Update path if needed
import { styles } from './profile.styles';


export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const loggedInUser = await SessionService.getUser();

      if (loggedInUser) {
        setUser(loggedInUser);
        console.log("Logged In User:", loggedInUser);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await SessionService.clearSession();

          console.log("Logged out successfully");

          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    title,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
  }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuLeft}>
        <Ionicons
          name={icon}
          size={22}
          color="#F97316"
        />
        <Text style={styles.menuText}>{title}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Profile</Text>

        <View style={styles.profileCard}>
          {user?.profile_image_url ? (
            <Image
              source={{
                uri: user.profile_image_url,
              }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.employee_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase() ?? "NA"}
              </Text>
            </View>
          )}

          <Text style={styles.name}>
            {user?.employee_name ?? ""}
          </Text>

          <Text style={styles.designation}>
            {user?.designation ?? ""}
          </Text>

          <Text style={styles.email}>
            {user?.email_id ?? ""}
          </Text>
        </View>

        {/* Employee Details */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Employee Details
          </Text>

          <MenuItem
            icon="business-outline"
            title={`Department : ${user?.department ?? ""}`}
          />

          <MenuItem
            icon="briefcase-outline"
            title={`Designation : ${user?.designation ?? ""}`}
          />

          <MenuItem
            icon="person-circle-outline"
            title={`Role : ${user?.role_of_user ?? ""}`}
          />

          <MenuItem
            icon="id-card-outline"
            title={`Employee ID : ${user?.user_unique_id ?? ""}`}
          />
        </View>

        {/* Contact */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Contact
          </Text>

          <MenuItem
            icon="mail-outline"
            title={user?.email_id ?? ""}
          />

          <MenuItem
            icon="call-outline"
            title={user?.phone_number ?? ""}
          />
        </View>

        {/* Organization */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Organization
          </Text>

          <MenuItem
            icon="business"
            title={
              user?.organization_full_name ?? ""
            }
          />

          <MenuItem
            icon="document-outline"
            title={`GST : ${
              user?.gst_number_or_company_registration_number ??
              ""
            }`}
          />

          <MenuItem
            icon="document-text-outline"
            title={`PAN : ${
              user?.organization_pan_number ?? ""
            }`}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="white"
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>
          Version 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

