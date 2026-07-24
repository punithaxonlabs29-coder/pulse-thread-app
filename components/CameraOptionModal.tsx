import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { useColors } from '../design';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectPhoto: () => void;
  onSelectVideo: () => void;
}

export default function CameraOptionModal({ visible, onClose, onSelectPhoto, onSelectVideo }: Props) {
  const colors = useColors();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: colors.background.surface, borderColor: colors.border.primary }]}>
              <View style={[styles.header, { borderBottomColor: colors.border.primary }]}>
                <AppText variant="bodySemibold" style={styles.title}>Camera</AppText>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <TouchableOpacity
                  style={[styles.optionBtn, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.primary }]}
                  onPress={() => {
                    onClose();
                    onSelectPhoto();
                  }}
                >
                  <View style={[styles.iconBadge, { backgroundColor: '#FFF7ED' }]}>
                    <Ionicons name="camera" size={22} color="#F97316" />
                  </View>
                  <AppText style={[styles.optionText, { color: colors.text.primary }]}>Take Photo</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionBtn}
                  onPress={() => {
                    onClose();
                    onSelectVideo();
                  }}
                >
                  <View style={[styles.iconBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="videocam" size={22} color="#2563EB" />
                  </View>
                  <AppText style={[styles.optionText, { color: colors.text.primary }]}>Record Video</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 2,
  },
  content: {
    paddingVertical: 4,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
