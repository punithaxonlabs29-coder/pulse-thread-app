import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ConnectsService } from '../services/connects.service';
import { useColors } from '../design';
import { AppText } from '../components/ui/AppText';
import { createStyles } from '../styles/add-people.styles';

export default function AddPeopleScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { channelId } = useLocalSearchParams();
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchPeople = async () => {
    try {
      const data = await ConnectsService.getPeople();
      setPeople(data);
    } catch (error) {
      console.log('Failed to fetch people', error);
      Alert.alert('Error', 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (email: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(email)) {
      newSelection.delete(email);
    } else {
      newSelection.add(email);
    }
    setSelectedEmails(newSelection);
  };

  const handleAddPeople = async () => {
    if (selectedEmails.size === 0) return;
    setAdding(true);
    try {
      const selectedPeople = people.filter(p => selectedEmails.has(p.email_id || p.email));
      for (const person of selectedPeople) {
        await ConnectsService.addMember(channelId as string, {
          email: person.email_id || person.email,
          name: person.employee_name || person.name || person.email_id || person.email,
          profile_image_url: person.profile_image_url || ''
        });
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add some members');
    } finally {
      setAdding(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const email = item.email_id || item.email;
    const isSelected = selectedEmails.has(email);
    const name = item.employee_name || item.name || email;
    const initials = name.substring(0, 2).toUpperCase();

    return (
      <TouchableOpacity 
        style={styles.personRow} 
        onPress={() => toggleSelection(email)}
      >
        <View style={styles.avatarContainer}>
          {item.profile_image_url ? (
            <Image source={{ uri: item.profile_image_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <AppText style={styles.placeholderText}>{initials}</AppText>
            </View>
          )}
        </View>
        <View style={styles.personInfo}>
          <AppText style={styles.personName} numberOfLines={1}>{name}</AppText>
          <AppText style={styles.personEmail} numberOfLines={1}>{email}</AppText>
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.brand.primary} />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color={colors.text.muted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.headerTitle}>Add People</AppText>
        <TouchableOpacity 
          onPress={handleAddPeople} 
          disabled={adding || selectedEmails.size === 0}
        >
          {adding ? (
            <ActivityIndicator color={colors.brand.primary} size="small" />
          ) : (
            <AppText style={[styles.addButtonText, selectedEmails.size === 0 && styles.disabledText]}>
              Add {selectedEmails.size > 0 ? `(${selectedEmails.size})` : ''}
            </AppText>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item) => item.email_id || item.email}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <AppText style={styles.emptyText}>No people found.</AppText>
            </View>
          }
        />
      )}
    </View>
  );
}
