import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './ui/AppText';
import { useColors } from '../design';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: string) => void;
}

export const DEAL_INPUT_OPTIONS = [
  "How to win this deal",
  "How to get client commitment",
  "How to reduce the PO cycle",
  "Offering discount or price bid",
  "How to cross-sell in this deal",
  "How to upsell in this deal",
];

export default function DealInputModal({ visible, onClose, onSelectOption }: Props) {
  const colors = useColors();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, { backgroundColor: colors.background.surface, borderColor: colors.border.primary }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border.primary }]}>
                <AppText variant="bodySemibold" style={styles.title}>Deal Input</AppText>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Options List */}
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {DEAL_INPUT_OPTIONS.map((option, idx) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionItem,
                      idx < DEAL_INPUT_OPTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border.primary }
                    ]}
                    onPress={() => {
                      onSelectOption(option);
                      onClose();
                    }}
                  >
                    <AppText style={[styles.optionText, { color: colors.text.primary }]}>{option}</AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    maxWidth: 340,
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
    fontSize: 18.5,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 2,
  },
  optionsList: {
    maxHeight: 320,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  optionText: {
    fontSize: 16.5,
    fontWeight: '500',
  },
});
