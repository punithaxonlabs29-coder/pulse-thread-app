import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Reaction } from '../../types/connects';
import { createStyles } from './ReactionBar.styles';
import { AppText } from '../ui/AppText';
import { useColors } from '../../design';


interface ReactionBarProps {
  reactions?: Reaction[];
  isMine: boolean;
  onReactionPress?: (emoji: string) => void;
}

export const ReactionBar = React.memo(({ reactions, isMine, onReactionPress }: ReactionBarProps) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          {reaction.count > 1 && <AppText variant="caption" style={styles.reactionCount}>{reaction.count}</AppText>}
        </TouchableOpacity>
      ))}
    </View>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions) &&
         prevProps.isMine === nextProps.isMine;
});
