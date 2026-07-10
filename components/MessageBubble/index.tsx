import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, TouchableOpacity, Animated, Text } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { Reaction } from "../../types/connects";

import { MessageText } from "./MessageText";
import { ReplyPreview } from "./ReplyPreview";
import { Attachments } from "./Attachments";
import { ReactionBar } from "./ReactionBar";
import { StatusIndicator } from "./StatusIndicator";
import { styles } from './index.styles';


export interface MessageBubbleProps {
  messageId: string;
  text: string;
  time: string;
  isMine: boolean;
  attachments?: any[];
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  isVisible?: boolean;
  reactions?: Reaction[];
  selected?: boolean;
  showTail?: boolean;
  replyTo?: {
    message_id: string;
    sender_name: string;
    text: string;
    attachments?: any[];
  };
  onLongPress?: (y: number, height: number) => void;
  onReactionPress?: (emoji: string) => void;
  onSwipeReply?: () => void;
  onReplyPress?: (messageId: string) => void;
  isForwarded?: boolean;
  isDeleted?: boolean;
  highlighted?: boolean;
}

const MessageBubble = React.memo(({ 
  messageId, text, time, isMine, attachments, readStatus, 
  isVisible = false, reactions, selected = false, showTail = true,
  replyTo, onLongPress, onReactionPress, onSwipeReply, onReplyPress,
  isForwarded = false, isDeleted = false, highlighted = false
}: MessageBubbleProps) => {
  const bubbleRef = React.useRef<View>(null);
  const swipeableRef = React.useRef<Swipeable>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (highlighted) {
      // Flash in then out
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(800),
        Animated.timing(highlightAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [highlighted]);

  const hasAttachments = attachments && attachments.length > 0;
  const hasText = !!text;
  const showOverlayTime = !hasText; 

  const isEmojiOnly = hasText && /^[\s\p{Emoji}\uFE0F\u200D]+$/u.test(text);
  const emojiCount = hasText && isEmojiOnly ? Array.from(text.replace(/[\s\uFE0F\u200D]/g, '')).length : 0;
  
  const isSingleEmoji = isEmojiOnly && emojiCount === 1;
  const isMediumEmoji = isEmojiOnly && emojiCount > 1 && emojiCount <= 3;
  const isSmallEmoji = isEmojiOnly && emojiCount > 3;

  const handleLongPress = () => {
    if (onLongPress && bubbleRef.current) {
      bubbleRef.current.measureInWindow((x, y, width, height) => {
        onLongPress(y, height);
      });
    }
  };

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [0, 50, 100],
      outputRange: [0, 1, 1],
      extrapolate: 'clamp',
    });
    return (
      <View style={styles.swipeReplyAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <View style={styles.replyIconCircle}>
            <Ionicons name="arrow-undo" size={16} color="#FFFFFF" />
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      onSwipeableWillOpen={() => {
        if (onSwipeReply) onSwipeReply();
        swipeableRef.current?.close();
      }}
      friction={2}
      leftThreshold={40}
    >
      <View style={[
        styles.bubbleWrapper, 
        selected && styles.selectedWrapper
      ]}>
        {/* Highlight flash overlay - like WhatsApp */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#F97316',
            opacity: Animated.multiply(highlightAnim, new Animated.Value(0.35)),
            zIndex: 10,
            borderRadius: 10,
          }}
        />
        <TouchableOpacity
          ref={bubbleRef}
          activeOpacity={0.9}
          onLongPress={handleLongPress}
          style={[
            styles.messageContainer,
            isMine ? styles.myMessage : styles.otherMessage,
            !showTail && (isMine ? styles.myMessageNoTail : styles.otherMessageNoTail),
            hasAttachments && !hasText && { paddingHorizontal: 4, paddingVertical: 4 },
            isSingleEmoji && styles.transparentMessage
          ]}
        >
          {showTail && !isSingleEmoji && (isMine ? <View style={styles.myTail} /> : <View style={styles.otherTail} />)}

          {isDeleted ? (
            <View style={styles.deletedContainer}>
              <Ionicons name="ban-outline" size={16} color="#8F98A0" style={styles.deletedIcon} />
              <Text style={styles.deletedText}>{text || "This message was deleted"}</Text>
            </View>
          ) : (
            <>
              {isForwarded && (
                <View style={styles.forwardedContainer}>
                  <Ionicons name="arrow-redo" size={14} color="#71828A" style={styles.forwardedIcon} />
                  <Text style={styles.forwardedText}>Forwarded</Text>
                </View>
              )}

              <ReplyPreview replyTo={replyTo} onReplyPress={onReplyPress} />

              <Attachments 
                attachments={attachments}
                messageId={messageId}
                time={time}
                readStatus={readStatus}
                isMine={isMine}
                showOverlayTime={showOverlayTime}
                isVisible={isVisible}
              />

              {hasText ? (
                <MessageText 
                  text={text}
                  isMine={isMine}
                  isSingleEmoji={isSingleEmoji}
                  isMediumEmoji={isMediumEmoji}
                  isSmallEmoji={isSmallEmoji}
                  hasAttachments={hasAttachments ?? false}
                  readStatus={readStatus}
                />
              ) : null}

              {!showOverlayTime && hasText ? (
                <StatusIndicator 
                  time={time}
                  readStatus={readStatus}
                  isMine={isMine}
                  isSingleEmoji={isSingleEmoji}
                />
              ) : null}
            </>
          )}
        </TouchableOpacity>

        <ReactionBar 
          reactions={reactions}
          isMine={isMine}
          onReactionPress={onReactionPress}
        />
      </View>
    </Swipeable>
  );
}, (prev, next) => {
  return prev.messageId === next.messageId &&
         prev.text === next.text &&
         prev.time === next.time &&
         prev.readStatus === next.readStatus &&
         prev.isVisible === next.isVisible &&
         prev.selected === next.selected &&
         prev.showTail === next.showTail &&
         prev.isForwarded === next.isForwarded &&
         prev.isDeleted === next.isDeleted &&
         JSON.stringify(prev.reactions) === JSON.stringify(next.reactions);
});

export default MessageBubble;
