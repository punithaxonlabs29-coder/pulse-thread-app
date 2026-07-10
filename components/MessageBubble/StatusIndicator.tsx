import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { styles } from './StatusIndicator.styles';


interface StatusIndicatorProps {
  time: string;
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  isMine: boolean;
  isSingleEmoji: boolean;
}

export const StatusIndicator = React.memo(({ time, readStatus, isMine, isSingleEmoji }: StatusIndicatorProps) => {
  return (
    <View style={[
      styles.absoluteFooter,
      isSingleEmoji && (isMine ? styles.singleEmojiTimePillMy : styles.singleEmojiTimePillOther)
    ]}>
      <Text style={[
        styles.time, 
        isMine ? styles.myTimeText : styles.otherTimeText,
        isSingleEmoji && { color: '#6B7280' }
      ]}>
        {time}
      </Text>
      {isMine && readStatus && (
        <Ionicons
          name={
            readStatus === "failed" ? "alert-circle-outline" :
            readStatus === "pending" || readStatus === "sending" ? "time-outline" :
            readStatus === "sent" ? "checkmark-outline" : "checkmark-done-outline"
          }
          size={14}
          color={
            readStatus === "failed" ? "#EF4444" :
            readStatus === "read" ? "#53BDEB" : 
            "#8696A0"
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

