import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";
import authApi from "../../services/api";
import { SessionService } from "../../services/session.service";
import { createStyles } from './profile.styles';
import { useColors } from "../../design";
import { AppText } from "../../components/ui/AppText";


const MenuItem = ({
  icon,
  title,
  styles,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  styles: any;
  colors: any;
}) => (
  <View style={styles.menuItem}>
    <View style={styles.menuLeft}>
      <Ionicons
        name={icon}
        size={22}
        color={colors.brand.primary}
      />
      <AppText style={styles.menuText}>{title}</AppText>
    </View>
  </View>
);

const ProfileInput = ({ 
  label, 
  value, 
  onChangeText, 
  editable = true,
  isSaving = false,
  styles,
  colors,
}: { 
  label: string, 
  value: string, 
  onChangeText?: (text: string) => void,
  editable?: boolean,
  isSaving?: boolean,
  styles: any,
  colors: any,
}) => (
  <View style={styles.inputGroup}>
    <AppText style={styles.inputLabel}>{label}</AppText>
    <View style={[styles.inputContainer, !editable && styles.disabledInputContainer]}>
      <TextInput
        style={[styles.inputField, !editable && styles.disabledInputField]}
        value={value}
        onChangeText={onChangeText}
        editable={editable && !isSaving}
        placeholderTextColor={colors.text.muted}
      />
      {!editable && (
        <Ionicons name="lock-closed" size={16} color={colors.text.muted} style={styles.lockIcon} />
      )}
    </View>
  </View>
);

export default function ProfileScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [user, setUser] = useState<any>(null);
  
  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    employee_name: "",
    phone_number: "",
    designation: "",
    profile_image_url: "",
  });

  const [originalForm, setOriginalForm] = useState({
    employee_name: "",
    phone_number: "",
    designation: "",
    profile_image_url: "",
  });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const loggedInUser = await SessionService.getUser();

      if (loggedInUser) {
        setUser(loggedInUser);
        const formData = {
          employee_name: loggedInUser.employee_name || "",
          phone_number: loggedInUser.phone_number || "",
          designation: loggedInUser.designation || "",
          profile_image_url: loggedInUser.profile_image_url || "",
        };
        setForm(formData);
        setOriginalForm(formData);
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
  
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to change your photo!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm(prev => ({ ...prev, profile_image_url: result.assets[0].uri }));
    }
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);

  const handleSave = async () => {
    if (!hasChanges) return;
    
    // Validation
    if (!form.employee_name.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      const formData = new FormData();
      formData.append("values", JSON.stringify({
        employeeName: String(form.employee_name || ""),
        waNo: String(form.phone_number || ""),
        department: String(user?.department || ""),
        designation: String(form.designation || ""),
        orgShortName: String(user?.organization_short_name || ""),
        orgFullName: String(user?.organization_full_name || ""),
        panNumber: String(user?.organization_pan_number || ""),
        industry: String(user?.industry || ""),
        hasManager: String(user?.has_manager || ""),
        managerName: String(user?.manager_name || ""),
        managerEmail: String(user?.manager_email || ""),
        gstType: String(user?.gst_or_registration || ""),
        gst_number_or_company_registration_number: String(user?.gst_number_or_company_registration_number || ""),
      }));

      // Only attach if it's a new local file from image picker
      if (form.profile_image_url && form.profile_image_url.startsWith('file://')) {
        const filename = form.profile_image_url.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('profile_image', {
          uri: form.profile_image_url,
          name: filename,
          type
        } as any);
      }

      // Hit the actual backend API
      const response = await authApi.post("create-profile", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Merge updated fields from API or local form into current user
      const updatedUser = {
        ...user,
        ...form,
        // if API returns a new CDN url for the image, we should theoretically use it here
        ...(response.data.profile_image_url ? { profile_image_url: response.data.profile_image_url } : {})
      };
      
      // Update local cache
      await SessionService.saveUser(updatedUser);
      setUser(updatedUser);
      setOriginalForm(form);
      setIsEditMode(false);
      
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.log("Save error", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={29} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        <AppText style={styles.headerTitle}>{isEditMode ? "Edit Profile" : "My Profile"}</AppText>
        
        <View style={styles.headerRight}>
          {isEditMode ? (
            <TouchableOpacity onPress={() => {
              setForm(originalForm); // revert changes
              setIsEditMode(false);
            }}>
              <AppText style={styles.headerActionTextCancel}>Cancel</AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditMode(true)}>
              <AppText style={styles.headerActionTextEdit}>Edit</AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card / Avatar Area */}
        <View style={styles.profileCard}>
          <TouchableOpacity 
            disabled={!isEditMode} 
            onPress={handlePickImage}
            style={{ alignItems: 'center' }}
            activeOpacity={0.7}
          >
            <View>
              {form.profile_image_url ? (
                <Image
                  source={{ uri: form.profile_image_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <AppText style={styles.avatarText}>
                    {form.employee_name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() ?? "NA"}
                  </AppText>
                </View>
              )}
              {isEditMode && (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color={colors.brand.primary} />
                </View>
              )}
            </View>
            
            {isEditMode && <AppText style={styles.changePhotoText}>Change Photo</AppText>}
          </TouchableOpacity>

          {!isEditMode && (
            <>
              <AppText style={styles.name}>{form.employee_name || ""}</AppText>
              <AppText style={styles.designation}>{form.designation || ""}</AppText>
              <AppText style={styles.email}>{user?.email_id || ""}</AppText>
            </>
          )}
        </View>

        {isEditMode ? (
          /* EDIT MODE VIEW */
          <View>
             <ProfileInput 
               label="Name" 
               value={form.employee_name} 
               onChangeText={(t) => setForm(p => ({ ...p, employee_name: t }))} 
               isSaving={isSaving}
               styles={styles}
               colors={colors}
             />
             <ProfileInput 
               label="Phone Number" 
               value={form.phone_number} 
               onChangeText={(t) => setForm(p => ({ ...p, phone_number: t }))} 
               isSaving={isSaving}
               styles={styles}
               colors={colors}
             />
             <ProfileInput 
               label="Designation" 
               value={form.designation} 
               onChangeText={(t) => setForm(p => ({ ...p, designation: t }))} 
               isSaving={isSaving}
               styles={styles}
               colors={colors}
             />
             
             <View style={{ marginVertical: 10 }}>
               <AppText style={[styles.sectionTitle, { paddingHorizontal: 18, marginBottom: 10 }]}>Locked Details</AppText>
             </View>
             
             <ProfileInput label="Department" value={user?.department || ""} editable={false} styles={styles} colors={colors} />
             <ProfileInput label="Role" value={user?.role_of_user || ""} editable={false} styles={styles} colors={colors} />
             <ProfileInput label="Employee ID" value={user?.user_unique_id || ""} editable={false} styles={styles} colors={colors} />
             <ProfileInput label="Email" value={user?.email_id || ""} editable={false} styles={styles} colors={colors} />
             <ProfileInput label="Organization" value={user?.organization_full_name || ""} editable={false} styles={styles} colors={colors} />
             <ProfileInput label="GST Number" value={user?.gst_number_or_company_registration_number || ""} editable={false} styles={styles} colors={colors} />
             <ProfileInput label="PAN Number" value={user?.organization_pan_number || ""} editable={false} styles={styles} colors={colors} />
             
             <TouchableOpacity
               style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
               activeOpacity={0.8}
               onPress={handleSave}
               disabled={!hasChanges || isSaving}
             >
               {isSaving ? (
                 <ActivityIndicator color={colors.text.inverse} />
               ) : (
                 <>
                   <Ionicons name="save-outline" size={20} color={colors.text.inverse} />
                   <AppText style={styles.saveText}>Save Changes</AppText>
                 </>
               )}
             </TouchableOpacity>
          </View>
        ) : (
          /* VIEW MODE */
          <View>
            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Employee Details</AppText>
              <MenuItem icon="business-outline" title={`Department : ${user?.department ?? ""}`} styles={styles} colors={colors} />
              <MenuItem icon="briefcase-outline" title={`Designation : ${form.designation ?? ""}`} styles={styles} colors={colors} />
              <MenuItem icon="person-circle-outline" title={`Role : ${user?.role_of_user ?? ""}`} styles={styles} colors={colors} />
              <MenuItem icon="id-card-outline" title={`Employee ID : ${user?.user_unique_id ?? ""}`} styles={styles} colors={colors} />
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Contact</AppText>
              <MenuItem icon="mail-outline" title={user?.email_id ?? ""} styles={styles} colors={colors} />
              <MenuItem icon="call-outline" title={form.phone_number ?? ""} styles={styles} colors={colors} />
            </View>

            <View style={styles.section}>
              <AppText style={styles.sectionTitle}>Organization</AppText>
              <MenuItem icon="business" title={user?.organization_full_name ?? ""} styles={styles} colors={colors} />
              <MenuItem icon="document-outline" title={`GST : ${user?.gst_number_or_company_registration_number ?? ""}`} styles={styles} colors={colors} />
              <MenuItem icon="document-text-outline" title={`PAN : ${user?.organization_pan_number ?? ""}`} styles={styles} colors={colors} />
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.text.inverse} />
              <AppText style={styles.logoutText}>Logout</AppText>
            </TouchableOpacity>
            

            <AppText style={styles.version}>Version 1.0.0</AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
