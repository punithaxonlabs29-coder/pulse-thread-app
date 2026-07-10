import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './AttachmentMenu.styles';


interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'camera' | 'gallery' | 'document' | 'video') => void;
}

export default function AttachmentMenu({ visible, onClose, onSelectOption }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menuContainer}>
          <View style={styles.row}>
            <MenuOption icon="camera" color="#EF4444" label="Camera" onPress={() => { onSelectOption('camera'); onClose(); }} />
            <MenuOption icon="image" color="#3B82F6" label="Gallery" onPress={() => { onSelectOption('gallery'); onClose(); }} />
            <MenuOption icon="document" color="#8B5CF6" label="Document" onPress={() => { onSelectOption('document'); onClose(); }} />
            <MenuOption icon="videocam" color="#F59E0B" label="Video" onPress={() => { onSelectOption('video'); onClose(); }} />
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const MenuOption = ({ icon, color, label, onPress }: any) => (
  <TouchableOpacity style={styles.option} onPress={onPress}>
    <View style={[styles.iconCircle, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="#FFF" />
    </View>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
);

