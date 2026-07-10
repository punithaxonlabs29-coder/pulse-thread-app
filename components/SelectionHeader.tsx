import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Modal, Pressable } from "react-native";
import { styles } from './SelectionHeader.styles';


interface SelectionHeaderProps {
  selectedCount: number;
  onClearSelection: () => void;
  onReply?: () => void;
  onStar?: () => void;
  onInfo?: () => void;
  onDelete?: () => void;
  onForward?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
  isPinned?: boolean;
  onPinToggle?: () => void;
}

export default function SelectionHeader({
  selectedCount,
  onClearSelection,
  onReply,
  onStar,
  onInfo,
  onDelete,
  onForward,
  onCopy,
  onShare,
  isPinned,
  onPinToggle,
}: SelectionHeaderProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        <TouchableOpacity onPress={onClearSelection} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.countText}>{selectedCount}</Text>
      </View>

      <View style={styles.rightContainer}>
        {selectedCount === 1 && onReply && (
          <TouchableOpacity onPress={onReply} style={styles.iconButton}>
            <Ionicons name="arrow-undo-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onStar} style={styles.iconButton}>
          <Ionicons name="star-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        {selectedCount === 1 && onInfo && (
          <TouchableOpacity onPress={onInfo} style={styles.iconButton}>
            <Ionicons name="information-circle-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onForward} style={styles.iconButton}>
          <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCopy} style={styles.iconButton}>
          <Ionicons name="copy-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      <Modal visible={menuVisible} transparent={true} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.dropdownMenu}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                if (onShare) onShare();
              }}
            >
              <Text style={styles.menuItemText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                if (onPinToggle) onPinToggle();
              }}
            >
              <Text style={styles.menuItemText}>{isPinned ? 'Unpin' : 'Pin'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

