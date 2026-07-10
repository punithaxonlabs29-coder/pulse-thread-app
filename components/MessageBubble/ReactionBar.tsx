import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Reaction } from '../../types/connects';
import { styles } from './ReactionBar.styles';


interface ReactionBarProps {
  reactions?: Reaction[];
  isMine: boolean;
  onReactionPress?: (emoji: string) => void;
}

export const ReactionBar = React.memo(({ reactions, isMine, onReactionPress }: ReactionBarProps) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <View style={[styles.reactionsContainer, isMine ? styles.myReactionsContainer : styles.otherReactionsContainer]}>
      {reactions.map((reaction, index) => (
        <TouchableOpacity 
          key={index} 
          style={[styles.reactionPill, reaction.user_reacted && styles.reactionPillActive]}
          onPress={() => onReactionPress && onReactionPress(reaction.emoji)}
        >
          <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
          {reaction.count > 1 && <Text style={styles.reactionCount}>{reaction.count}</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions) &&
         prevProps.isMine === nextProps.isMine;
});

