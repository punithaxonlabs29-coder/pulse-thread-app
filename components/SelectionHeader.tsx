import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Modal, Pressable } from "react-native";

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

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#f7dac3", // App theme orange
    borderBottomWidth: 1,
    borderColor: "#f7dac3",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 16,
  },
  menuOverlay: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
  }
});
