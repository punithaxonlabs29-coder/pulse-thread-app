import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function ContactInfoScreen() {
  const router = useRouter();
  const { channelId, name, image, status } = useLocalSearchParams();
  
  const displayName = (name as string) || 'User';
  const displayStatus = (status as string) || 'Offline';
  
  const initials = displayName
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const [muted, setMuted] = useState(false);
  const [disappearing, setDisappearing] = useState(false);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor="#F3F4F6" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Profile Header ── */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => { if (image) setIsImageFullScreen(true); }}
          >
            {image ? (
              <Image source={{ uri: image as string }} style={styles.profileImage} contentFit="cover" />
            ) : (
              <View style={[styles.profileImage, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.statusText}>{displayStatus}</Text>
        </View>

        {/* ── Actions Row ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
            <Ionicons name="chatbubble-outline" size={24} color="#F97316" />
            <Text style={styles.actionLabel}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="search-outline" size={24} color="#F97316" />
            <Text style={styles.actionLabel}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* ── Information Cards ── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>Hey there! I am using Pulse.</Text>
          <Text style={styles.dateText}>12 January 2026</Text>
        </View>

        <View style={styles.card}>
          <TouchableOpacity 
            style={styles.menuRow}
            onPress={() => router.push({ pathname: '/media', params: { channelId } })}
          >
            <View style={styles.menuIconContainer}>
              <Ionicons name="images-outline" size={22} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>Media, links, and docs</Text>
            <Text style={styles.menuBadge}>24</Text>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="notifications-outline" size={22} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>Mute notifications</Text>
            <Switch
              value={muted}
              onValueChange={setMuted}
              trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
              thumbColor={muted ? '#F97316' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="musical-notes-outline" size={22} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>Custom notifications</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="image-outline" size={22} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>Media visibility</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="timer-outline" size={22} color="#6B7280" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuText}>Disappearing messages</Text>
              <Text style={styles.menuSubText}>{disappearing ? 'On' : 'Off'}</Text>
            </View>
            <Switch
              value={disappearing}
              onValueChange={setDisappearing}
              trackColor={{ false: '#D1D5DB', true: '#FDBA74' }}
              thumbColor={disappearing ? '#F97316' : '#FFFFFF'}
            />
          </View>
        </View>

        <View style={styles.card}>
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="ban-outline" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Block {displayName}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="thumbs-down-outline" size={22} color="#EF4444" />
            </View>
            <Text style={[styles.menuText, { color: '#EF4444' }]}>Report {displayName}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Full Screen Image Modal ── */}
      <Modal
        visible={isImageFullScreen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsImageFullScreen(false)}
      >
        <SafeAreaView style={styles.fullScreenContainer} edges={['top', 'bottom']}>
          <StatusBar style="light" backgroundColor="#000000" />
          <View style={styles.fullScreenHeader}>
            <TouchableOpacity 
              style={styles.fullScreenBackButton} 
              onPress={() => setIsImageFullScreen(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.fullScreenName}>{displayName}</Text>
          </View>
          <View style={styles.fullScreenImageWrapper}>
            <Image 
              source={{ uri: image as string }} 
              style={styles.fullScreenImage} 
              contentFit="contain" 
            />
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  backButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  nameText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#F97316',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 4,
  },
  aboutText: {
    fontSize: 16,
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#9CA3AF',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  menuSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  menuBadge: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 60,
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fullScreenBackButton: {
    padding: 8,
    marginRight: 16,
  },
  fullScreenName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  fullScreenImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
