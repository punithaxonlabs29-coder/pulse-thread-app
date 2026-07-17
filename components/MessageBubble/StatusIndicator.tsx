import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from './StatusIndicator.styles';
import { AppText } from '../ui/AppText';
import { useColors } from '../../design';


interface StatusIndicatorProps {
  time: string;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  isMine: boolean;
  isSingleEmoji: boolean;
}

export const StatusIndicator = React.memo(({ time, readStatus, isMine, isSingleEmoji }: StatusIndicatorProps) => {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[
      styles.absoluteFooter,
      isSingleEmoji && (isMine ? styles.singleEmojiTimePillMy : styles.singleEmojiTimePillOther)
    ]}>
      <AppText style={[
        styles.time, 
        isMine ? styles.myTimeText : styles.otherTimeText,
        isSingleEmoji && { color: colors.text.muted }
      ]}>
        {time}
      </AppText>
      {isMine && readStatus && (
        <Ionicons
          name={
            readStatus === "failed" ? "alert-circle-outline" :
            readStatus === "pending" || readStatus === "sending" ? "time-outline" :
            readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"
          }
          size={14}
          color={
            readStatus === "failed" ? colors.status.error :
            readStatus === "read" ? colors.status.info : 
            colors.text.muted
          }
          style={styles.tickIcon}
        />
      )}
    </View>
  );
}, (prev, next) => {
  return prev.time === next.time && 
         prev.readStatus === next.readStatus && 
         prev.isMine === next.isMine &&
         prev.isSingleEmoji === next.isSingleEmoji;
});
