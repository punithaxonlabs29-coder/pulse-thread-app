import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
  position?: { y: number; height: number } | null;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export default function ReactionPicker({ visible, onClose, onSelectReaction, position }: ReactionPickerProps) {
  let containerStyle: any = styles.pickerContainer;
  if (position) {
    const isNearTop = position.y < 150;
    containerStyle = [
      styles.pickerContainer,
      {
        position: 'absolute',
        top: isNearTop ? position.y + position.height + 10 : position.y - 60,
      }
    ];
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={containerStyle}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity 
                  key={emoji} 
                  style={styles.emojiButton}
                  onPress={() => {
                    onSelectReaction(emoji);
                    onClose();
                  }}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
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
    backgroundColor: 'rgba(0,0,0,0)', // Invisible overlay to capture taps outside, or subtle tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiButton: {
    paddingHorizontal: 8,
  },
  emojiText: {
    fontSize: 28,
  }
});
