import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { CacheService } from '../services/cache.service';
import { SessionService } from '../services/session.service';
import { mainApi } from '../services/api';
import { createStyles } from './contact-info.styles';
import { useColors } from '../design';
import { AppText } from '../components/ui/AppText';

export default function ContactInfoScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { channelId, name, image, status } = useLocalSearchParams();
  
  const [channel, setChannel] = useState<any>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localImage, setLocalImage] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const user = await SessionService.getUser();
      setCurrentUserEmail(user?.email_id || "");
      
      const cachedChannels = await CacheService.getCachedChannels();
      const found = cachedChannels?.find(c => c.channel_id === channelId);
      if (found) {
        setChannel(found);
      }
    };
    init();
  }, [channelId]);

  const isGroup = channel?.channel_type === 'channel';
  const isAdmin = isGroup && channel?.members?.some((m: any) => m.email === currentUserEmail && m.role === 'admin');

  const displayName = isGroup ? (channel?.channel_name || name) : (name as string || 'User');
  const displayStatus = isGroup ? `${channel?.members?.length || 0} members` : (status as string || 'Offline');
  const displayImage = localImage || (isGroup ? channel?.channel_image : image);
  
  const initials = displayName
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const [muted, setMuted] = useState(false);
  const [disappearing, setDisappearing] = useState(false);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);

  const handlePickImage = async () => {
    if (!isAdmin) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    
    if (!result.canceled) {
      uploadImage(result.assets[0].uri, result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const uploadImage = async (uri: string, mimeType: string) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('channel_id', channelId as string);
      
      const filename = uri.split('/').pop() || 'image.jpg';
      formData.append('channel_image', {
        uri,
        name: filename,
        type: mimeType
      } as any);

      const response = await mainApi.post('/connects/channel/update-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.data.status) {
        setLocalImage(response.data.channel_image);
      } else {
        Alert.alert("Error", response.data.message || "Failed to upload image");
      }
    } catch (err) {
      Alert.alert("Error", "Could not upload image");
    } finally {
      setUploading(false);
    }
  };

  const renderHeader = () => (
    <View>
      <View style={styles.profileSection}>
        <TouchableOpacity 
          activeOpacity={isAdmin ? 0.8 : (displayImage ? 0.8 : 1)} 
          onPress={() => { 
            if (isAdmin) {
              handlePickImage();
            } else if (displayImage) {
              setIsImageFullScreen(true); 
            }
          }}
          style={styles.avatarContainer}
        >
          {displayImage ? (
            <Image source={{ uri: displayImage as string }} style={styles.profileImage} contentFit="cover" />
          ) : (
            <View style={[styles.profileImage, styles.avatarPlaceholder]}>
              <AppText style={styles.avatarText}>{initials}</AppText>
            </View>
          )}
          {isAdmin && (
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={colors.text.inverse} />
            </View>
          )}
          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
        <AppText style={styles.nameText}>{displayName}</AppText>
        <AppText style={styles.statusText}>{displayStatus}</AppText>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.brand.primary} />
          <AppText style={styles.actionLabel}>Message</AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="search-outline" size={24} color={colors.brand.primary} />
          <AppText style={styles.actionLabel}>Search</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <AppText style={styles.sectionTitle}>About</AppText>
        <AppText style={styles.aboutText}>Hey there! I am using Pulse.</AppText>
        <AppText style={styles.dateText}>12 January 2026</AppText>
      </View>

      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.menuRow}
          onPress={() => router.push({ pathname: '/media', params: { channelId } })}
        >
          <View style={styles.menuIconContainer}>
            <Ionicons name="images-outline" size={22} color={colors.text.secondary} />
          </View>
          <AppText style={styles.menuText}>Media, links, and docs</AppText>
          <AppText style={styles.menuBadge}>24</AppText>
          <Ionicons name="chevron-forward" size={20} color={colors.border.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.menuRow}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="notifications-outline" size={22} color={colors.text.secondary} />
          </View>
          <AppText style={styles.menuText}>Mute notifications</AppText>
          <Switch
            value={muted}
            onValueChange={setMuted}
            trackColor={{ false: colors.border.primary, true: colors.brand.primaryLight }}
            thumbColor={muted ? colors.brand.primary : colors.text.inverse}
          />
        </View>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuRow}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="musical-notes-outline" size={22} color={colors.text.secondary} />
          </View>
          <AppText style={styles.menuText}>Custom notifications</AppText>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.menuRow}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="image-outline" size={22} color={colors.text.secondary} />
          </View>
          <AppText style={styles.menuText}>Media visibility</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.menuRow}>
          <View style={styles.menuIconContainer}>
            <Ionicons name="timer-outline" size={22} color={colors.text.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={styles.menuText}>Disappearing messages</AppText>
            <AppText style={styles.menuSubText}>{disappearing ? 'On' : 'Off'}</AppText>
          </View>
          <Switch
            value={disappearing}
            onValueChange={setDisappearing}
            trackColor={{ false: colors.border.primary, true: colors.brand.primaryLight }}
            thumbColor={disappearing ? colors.brand.primary : colors.text.inverse}
          />
        </View>
      </View>

      {!isGroup && (
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="ban-outline" size={22} color={colors.status.error} />
            </View>
            <AppText style={[styles.menuText, { color: colors.status.error }]}>Block {displayName}</AppText>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow}>
            <View style={styles.menuIconContainer}>
              <Ionicons name="thumbs-down-outline" size={22} color={colors.status.error} />
            </View>
            <AppText style={[styles.menuText, { color: colors.status.error }]}>Report {displayName}</AppText>
          </TouchableOpacity>
        </View>
      )}

      {isGroup && (
        <View style={styles.membersHeaderCard}>
           <AppText style={styles.membersHeaderTitle}>{channel.members?.length || 0} participants</AppText>
        </View>
      )}
    </View>
  );

  const renderMember = ({ item }: { item: any }) => {
    const memberInitials = (item.name || item.email || "User").substring(0, 2).toUpperCase();
    return (
      <View style={styles.memberItem}>
        {item.profile_image_url ? (
           <Image source={{ uri: item.profile_image_url }} style={styles.memberAvatar} />
        ) : (
           <View style={[styles.memberAvatar, styles.avatarPlaceholder]}>
             <AppText style={styles.memberAvatarText}>{memberInitials}</AppText>
           </View>
        )}
        <View style={styles.memberInfo}>
          <AppText style={styles.memberName}>{item.name || item.email}</AppText>
          <AppText style={styles.memberEmail}>{item.email}</AppText>
        </View>
        {item.role === 'admin' && (
          <View style={styles.adminBadge}>
            <AppText style={styles.adminBadgeText}>Group Admin</AppText>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" backgroundColor={colors.background.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={isGroup ? channel?.members : []}
        keyExtractor={(item, index) => item.email || String(index)}
        ListHeaderComponent={renderHeader}
        renderItem={renderMember}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

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
            <AppText style={styles.fullScreenName}>{displayName}</AppText>
          </View>
          <View style={styles.fullScreenImageWrapper}>
            <Image 
              source={{ uri: displayImage as string }} 
              style={styles.fullScreenImage} 
              contentFit="contain" 
            />
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
