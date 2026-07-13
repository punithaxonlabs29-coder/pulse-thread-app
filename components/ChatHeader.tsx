import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { styles } from './ChatHeader.styles';

interface ChatHeaderProps {
  name: string;
  status: string;
  imageUrl?: string;
  typingUsers?: string[];
  channelId?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  iconFamily?: 'Ionicons' | 'MaterialIcons';
  hasArrow?: boolean;
  onPress?: () => void;
}

export default function ChatHeader({
  name,
  status,
  imageUrl,
  typingUsers = [],
  channelId,
}: ChatHeaderProps) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const initials = (name || "U")
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const openMenu = () => {
    setMenuVisible(true);
  };

  const handleMenuAction = (itemId: string) => {
    setMenuVisible(false);
    switch (itemId) {
      case 'new_group':
        Alert.alert('New Group', 'Create a new group');
        break;
      case 'view_contact':
        Alert.alert('View Contact', `Viewing ${name}`);
        break;
      case 'search':
        Alert.alert('Search', 'Search in conversation');
        break;
      case 'media':
        Alert.alert('Media, links, and docs', 'Opening media browser');
        break;
      case 'mute':
        Alert.alert('Mute Notifications', 'Notification settings');
        break;
      case 'disappearing':
        Alert.alert('Disappearing Messages', 'Set timer for disappearing messages');
        break;
      case 'chat_theme':
        Alert.alert('Chat Theme', 'Choose a chat theme');
        break;
      case 'more':
        Alert.alert('More', 'More options');
        break;
    }
  };

  const menuItems: MenuItem[] = [
    { id: 'view_contact', label: 'View contact', icon: 'person-outline' },
    { id: 'search', label: 'Search', icon: 'search-outline' },
    { id: 'media', label: 'Media, links, and docs', icon: 'image-outline' },
    { id: 'more', label: 'More', icon: 'ellipsis-horizontal-circle-outline', hasArrow: true },
  ];

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#F97316" />
        </TouchableOpacity>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.profileImage} />
        ) : (
          <View style={[styles.profileImage, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {typingUsers.length > 0 ? (
            <Text style={styles.typingStatus} numberOfLines={1}>
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </Text>
          ) : (
            <Text style={styles.status} numberOfLines={1}>{status}</Text>
          )}
        </View>

        {/* Action buttons */}
        <View style={menuStyles.actionButtons}>
          <TouchableOpacity
            id="chat-header-menu-btn"
            style={[styles.menuButton, menuStyles.actionBtn]}
            onPress={openMenu}
          >
            <Ionicons name="ellipsis-vertical" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={menuStyles.overlay}>
            <TouchableWithoutFeedback>
              <View style={[menuStyles.dropdown, { top: 130, right: 8 }]}>
                {menuItems.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      id={`chat-menu-${item.id}`}
                      style={[
                        menuStyles.menuItem,
                        index === menuItems.length - 1 && menuStyles.menuItemLast,
                      ]}
                      onPress={() => handleMenuAction(item.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color="#6B7280"
                        style={menuStyles.menuIcon}
                      />
                      <Text style={menuStyles.menuLabel}>{item.label}</Text>
                      {item.hasArrow && (
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                    {index < menuItems.length - 1 && (
                      <View style={menuStyles.separator} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const menuStyles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 7,
    marginLeft: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 230,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginRight: 14,
    width: 20,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '400',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
});
