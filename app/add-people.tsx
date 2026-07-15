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

export default function AddPeopleScreen() {
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
              <Text style={styles.placeholderText}>{initials}</Text>
            </View>
          )}
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>{name}</Text>
          <Text style={styles.personEmail} numberOfLines={1}>{email}</Text>
        </View>
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#F97316" />
          ) : (
            <Ionicons name="ellipse-outline" size={24} color="#D1D5DB" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add People</Text>
        <TouchableOpacity 
          onPress={handleAddPeople} 
          disabled={adding || selectedEmails.size === 0}
        >
          {adding ? (
            <ActivityIndicator color="#F97316" size="small" />
          ) : (
            <Text style={[styles.addButtonText, selectedEmails.size === 0 && styles.disabledText]}>
              Add {selectedEmails.size > 0 ? `(${selectedEmails.size})` : ''}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#F97316" />
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
              <Text style={styles.emptyText}>No people found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '600',
  },
  addButtonText: {
    color: '#F97316',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: '#9CA3AF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
  },
  listContainer: {
    paddingVertical: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderAvatar: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#4B5563',
    fontSize: 18,
    fontWeight: '600',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  personEmail: {
    color: '#6B7280',
    fontSize: 14,
  },
  checkboxContainer: {
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 80,
  }
});
