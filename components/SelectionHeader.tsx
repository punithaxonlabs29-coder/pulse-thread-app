import { Ionicons } from "@expo/vector-icons";
import React, { useState, useMemo } from "react";
import { Text, TouchableOpacity, View, Modal, Pressable } from "react-native";
import { createStyles } from './SelectionHeader.styles';
import { useColors } from '../design';
import { AppText } from './ui/AppText';

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.leftContainer}>
        <TouchableOpacity onPress={onClearSelection} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
        <AppText style={styles.countText}>{selectedCount}</AppText>
      </View>

      <View style={styles.rightContainer}>
        {selectedCount === 1 && onReply && (
          <TouchableOpacity onPress={onReply} style={styles.iconButton}>
            <Ionicons name="arrow-undo-outline" size={22} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onStar} style={styles.iconButton}>
          <Ionicons name="star-outline" size={22} color={colors.text.inverse} />
        </TouchableOpacity>
        {selectedCount === 1 && onInfo && (
          <TouchableOpacity onPress={onInfo} style={styles.iconButton}>
            <Ionicons name="information-circle-outline" size={22} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.iconButton}>
            <Ionicons name="trash-outline" size={22} color={colors.text.inverse} />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onForward} style={styles.iconButton}>
          <Ionicons name="arrow-redo-outline" size={22} color={colors.text.inverse} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onCopy} style={styles.iconButton}>
          <Ionicons name="copy-outline" size={22} color={colors.text.inverse} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconButton}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text.inverse} />
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
              <AppText style={styles.menuItemText}>Share</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                if (onPinToggle) onPinToggle();
              }}
            >
              <AppText style={styles.menuItemText}>{isPinned ? 'Unpin' : 'Pin'}</AppText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={() => {
                setMenuVisible(false);
                onClearSelection();
              }}
            >
              <AppText style={styles.menuItemText}>Clear selection</AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
