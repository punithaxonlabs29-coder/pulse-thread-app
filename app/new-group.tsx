import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ConnectsService } from '../services/connects.service';
import { useColors } from '../design';
import { AppText } from '../components/ui/AppText';
import { createStyles } from './new-group.styles';

export default function NewGroupScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter a Company Name');
      return;
    }
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a Group Name');
      return;
    }

    setLoading(true);
    try {
      const response = await ConnectsService.createGroup(companyName.trim(), groupName.trim());
      if (response && response.status !== false) {
        // Group created successfully
        router.back();
      } else {
        Alert.alert('Error', response?.message || 'Failed to create group');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>New Group</AppText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <AppText style={styles.description}>
          Create a new group to collaborate with your team. Enter your company and group name below.
        </AppText>

        <View style={styles.inputContainer}>
          <AppText style={styles.label}>Company Name</AppText>
          <TextInput
            style={styles.input}
            placeholder="Enter company name"
            placeholderTextColor={colors.text.muted}
            value={companyName}
            onChangeText={setCompanyName}
          />
        </View>

        <View style={styles.inputContainer}>
          <AppText style={styles.label}>Group Name</AppText>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            placeholderTextColor={colors.text.muted}
            value={groupName}
            onChangeText={setGroupName}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, (!companyName.trim() || !groupName.trim()) && styles.createButtonDisabled]}
          onPress={handleCreateGroup}
          disabled={loading || !companyName.trim() || !groupName.trim()}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} />
          ) : (
            <AppText style={styles.createButtonText}>Create Group</AppText>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

