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
import { createStyles, createMenuStyles } from './ChatHeader.styles';
import { AppText } from "./ui/AppText";
import { useColors } from "../design";

interface ChatHeaderProps {
  name: string;
  status: string;
  imageUrl?: string;
  typingUsers?: string[];
  channelId?: string;
  channelType?: string;
  onSearch?: () => void;
  onMediaPress?: () => void;
  onProfilePress?: () => void;
  onClearChat?: () => void;
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
  channelType,
  onSearch,
  onMediaPress,
  onProfilePress,
  onClearChat,
}: ChatHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const menuStyles = React.useMemo(() => createMenuStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isSubMenu, setIsSubMenu] = useState(false);

  const initials = (name || "U")
    .split(" ")
    .map(word => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const openMenu = () => {
    setIsSubMenu(false);
    setMenuVisible(true);
  };

  const handleMenuAction = (itemId: string) => {
    if (itemId === 'more') {
      setIsSubMenu(true);
      return;
    }

    setMenuVisible(false);
    setIsSubMenu(false);
    
    switch (itemId) {
      case 'add_people':
        router.push({ pathname: '/add-people', params: { channelId } });
        break;
      case 'new_group':
        Alert.alert('New Group', 'Create a new group');
        break;
      case 'view_contact':
        if (onProfilePress) onProfilePress();
        break;
      case 'search':
        if (onSearch) onSearch();
        break;
      case 'media':
        if (onMediaPress) onMediaPress();
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
      case 'clear_chat':
        if (onClearChat) {
          onClearChat();
        } else {
          Alert.alert('Clear Chat', 'Clear chat functionality coming soon');
        }
        break;
    }
  };

  const getMenuItems = (): MenuItem[] => {
    if (isSubMenu) {
      return [
        { id: 'clear_chat', label: 'Clear chat', icon: 'trash-outline' }
      ];
    }

    const items: MenuItem[] = [
      { id: 'view_contact', label: 'View contact', icon: 'person-outline' },
      { id: 'search', label: 'Search', icon: 'search-outline' },
      { id: 'media', label: 'Media, links, and docs', icon: 'image-outline' },
      { id: 'more', label: 'More', icon: 'ellipsis-horizontal-circle-outline', hasArrow: true },
    ];

    if (channelType === 'channel') {
      items.splice(items.length - 1, 0, { id: 'add_people', label: 'Add people', icon: 'person-add-outline' });
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <>
      <View style={styles.header}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Profile Info */}
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          onPress={() => {
            if (onProfilePress) onProfilePress();
          }}
          activeOpacity={0.7}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.avatarPlaceholder]}>
              <AppText variant="h2" color={colors.text.inverse}>
                {initials}
              </AppText>
            </View>
          )}

          <View style={styles.headerInfo}>
            <AppText variant="title" numberOfLines={1}>{name}</AppText>
            {typingUsers.length > 0 ? (
              <AppText variant="body" color={colors.brand.primary} style={styles.typingStatus} numberOfLines={1}>
                {typingUsers.length === 1
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </AppText>
            ) : (
              <AppText variant="body" color={colors.status.success} numberOfLines={1}>{status}</AppText>
            )}
          </View>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={menuStyles.actionButtons}>
          <TouchableOpacity
            id="chat-header-menu-btn"
            style={[styles.menuButton, menuStyles.actionBtn]}
            onPress={openMenu}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setMenuVisible(false);
          setIsSubMenu(false);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setMenuVisible(false);
          setIsSubMenu(false);
        }}>
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
                        color={colors.text.secondary}
                        style={menuStyles.menuIcon}
                      />
                      <AppText variant="body" style={menuStyles.menuLabel}>{item.label}</AppText>
                      {item.hasArrow && (
                        <Ionicons name="chevron-forward" size={16} color={colors.text.secondary} />
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
