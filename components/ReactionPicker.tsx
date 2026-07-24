import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { createStyles } from './ReactionPicker.styles';
import { useColors } from '../design';


interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
  position?: { y: number; height: number } | null;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👏'];

export default function ReactionPicker({ visible, onClose, onSelectReaction, position }: ReactionPickerProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { top: 70 }]} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

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
    </View>
  );
}
