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
import { styles } from './profile.styles';


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

const ProfileInput = ({ 
  label, 
  value, 
  onChangeText, 
  editable = true,
  isSaving = false
}: { 
  label: string, 
  value: string, 
  onChangeText?: (text: string) => void,
  editable?: boolean,
  isSaving?: boolean
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputContainer, !editable && styles.disabledInputContainer]}>
      <TextInput
        style={[styles.inputField, !editable && styles.disabledInputField]}
        value={value}
        onChangeText={onChangeText}
        editable={editable && !isSaving}
      />
      {!editable && (
        <Ionicons name="lock-closed" size={16} color="#9CA3AF" style={styles.lockIcon} />
      )}
    </View>
  </View>
);

export default function ProfileScreen() {
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
            <Ionicons name="arrow-back" size={29} color="#111827" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.headerTitle}>{isEditMode ? "Edit Profile" : "My Profile"}</Text>
        
        <View style={styles.headerRight}>
          {isEditMode ? (
            <TouchableOpacity onPress={() => {
              setForm(originalForm); // revert changes
              setIsEditMode(false);
            }}>
              <Text style={styles.headerActionText}>Cancel</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditMode(true)}>
              <Text style={styles.headerActionText}>Edit</Text>
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
                  <Text style={styles.avatarText}>
                    {form.employee_name
                      ?.split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)
                      .toUpperCase() ?? "NA"}
                  </Text>
                </View>
              )}
              {isEditMode && (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={16} color="#3B82F6" />
                </View>
              )}
            </View>
            
            {isEditMode && <Text style={styles.changePhotoText}>Change Photo</Text>}
          </TouchableOpacity>

          {!isEditMode && (
            <>
              <Text style={styles.name}>{form.employee_name || ""}</Text>
              <Text style={styles.designation}>{form.designation || ""}</Text>
              <Text style={styles.email}>{user?.email_id || ""}</Text>
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
             />
             <ProfileInput 
               label="Phone Number" 
               value={form.phone_number} 
               onChangeText={(t) => setForm(p => ({ ...p, phone_number: t }))} 
               isSaving={isSaving}
             />
             <ProfileInput 
               label="Designation" 
               value={form.designation} 
               onChangeText={(t) => setForm(p => ({ ...p, designation: t }))} 
               isSaving={isSaving}
             />
             
             <View style={{ marginVertical: 10 }}>
               <Text style={[styles.sectionTitle, { paddingHorizontal: 18, marginBottom: 10 }]}>Locked Details</Text>
             </View>
             
             <ProfileInput label="Department" value={user?.department || ""} editable={false} />
             <ProfileInput label="Role" value={user?.role_of_user || ""} editable={false} />
             <ProfileInput label="Employee ID" value={user?.user_unique_id || ""} editable={false} />
             <ProfileInput label="Email" value={user?.email_id || ""} editable={false} />
             <ProfileInput label="Organization" value={user?.organization_full_name || ""} editable={false} />
             <ProfileInput label="GST Number" value={user?.gst_number_or_company_registration_number || ""} editable={false} />
             <ProfileInput label="PAN Number" value={user?.organization_pan_number || ""} editable={false} />
             
             <TouchableOpacity
               style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
               activeOpacity={0.8}
               onPress={handleSave}
               disabled={!hasChanges || isSaving}
             >
               {isSaving ? (
                 <ActivityIndicator color="#FFFFFF" />
               ) : (
                 <>
                   <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                   <Text style={styles.saveText}>Save Changes</Text>
                 </>
               )}
             </TouchableOpacity>
          </View>
        ) : (
          /* VIEW MODE */
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Employee Details</Text>
              <MenuItem icon="business-outline" title={`Department : ${user?.department ?? ""}`} />
              <MenuItem icon="briefcase-outline" title={`Designation : ${form.designation ?? ""}`} />
              <MenuItem icon="person-circle-outline" title={`Role : ${user?.role_of_user ?? ""}`} />
              <MenuItem icon="id-card-outline" title={`Employee ID : ${user?.user_unique_id ?? ""}`} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <MenuItem icon="mail-outline" title={user?.email_id ?? ""} />
              <MenuItem icon="call-outline" title={form.phone_number ?? ""} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Organization</Text>
              <MenuItem icon="business" title={user?.organization_full_name ?? ""} />
              <MenuItem icon="document-outline" title={`GST : ${user?.gst_number_or_company_registration_number ?? ""}`} />
              <MenuItem icon="document-text-outline" title={`PAN : ${user?.organization_pan_number ?? ""}`} />
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              activeOpacity={0.8}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
