import React, { useMemo } from 'react';
import { View, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createStyles } from './AttachmentMenu.styles';
import { useColors } from '../design';
import { AppText } from './ui/AppText';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'camera' | 'gallery' | 'document' | 'video') => void;
}

export default function AttachmentMenu({ visible, onClose, onSelectOption }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={styles.row}>
            <MenuOption styles={styles} colors={colors} icon="camera" color="#EF4444" label="Camera" onPress={() => { onSelectOption('camera'); onClose(); }} />
            <MenuOption styles={styles} colors={colors} icon="image" color="#3B82F6" label="Gallery" onPress={() => { onSelectOption('gallery'); onClose(); }} />
            <MenuOption styles={styles} colors={colors} icon="document" color="#8B5CF6" label="Document" onPress={() => { onSelectOption('document'); onClose(); }} />
            <MenuOption styles={styles} colors={colors} icon="videocam" color="#F59E0B" label="Video" onPress={() => { onSelectOption('video'); onClose(); }} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const MenuOption = ({ icon, color, label, onPress, styles, colors }: any) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <View style={[styles.iconCircle, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={colors.text.inverse} />
    </View>
    <AppText style={styles.label}>{label}</AppText>
  </TouchableOpacity>
);
