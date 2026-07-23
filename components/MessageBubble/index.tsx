import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, TouchableOpacity, Animated, Text, Image } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Ionicons } from "@expo/vector-icons";
import { Reaction } from "../../types/connects";

import { MessageText } from "./MessageText";
import { ReplyPreview } from "./ReplyPreview";
import { Attachments } from "./Attachments";
import { ReactionBar } from "./ReactionBar";
import { StatusIndicator } from "./StatusIndicator";
import { createStyles } from './index.styles';
import { useColors } from "../../design";
import { AppText } from "../ui/AppText";

const SENDER_COLORS = [
  '#34B7F1', '#E542A3', '#00A884', '#9B51E0',
  '#F2994A', '#27AE60', '#2F80ED', '#EC4899',
  '#F97316', '#10B981', '#6366F1', '#8B5CF6'
];

function getSenderColor(name: string = ''): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

export interface MessageBubbleProps {
  messageId: string;
  text: string;
  time: string;
  isMine: boolean;
  senderName?: string;
  senderAvatar?: string;
  senderEmail?: string;
  showSenderHeader?: boolean;
  showAvatar?: boolean;
  attachments?: any[];
  readStatus?: "sent" | "delivered" | "read" | "pending" | "sending" | "failed";
  reactions?: Reaction[];
  mentions?: any[];
  selected?: boolean;
  showTail?: boolean;
  replyTo?: {
    message_id: string;
    sender_name: string;
    text: string;
    attachments?: any[];
  };
  onLongPress?: (y: number, height: number) => void;
  onPress?: () => void;
  onReactionPress?: (emoji: string) => void;
  onSwipeReply?: () => void;
  onReplyPress?: (messageId: string) => void;
  isForwarded?: boolean;
  isDeleted?: boolean;
  highlighted?: boolean;
  isSingleEmoji?: boolean;
  isMediumEmoji?: boolean;
  isSmallEmoji?: boolean;
  searchText?: string;
  searchEnabled?: boolean;
  isVisible?: boolean;
  isStarred?: boolean;
  onMentionPress?: (userId: string) => void;
}

const MessageBubble = React.memo(({ 
  messageId, text, time, isMine, senderName, senderAvatar, senderEmail, showSenderHeader = false, showAvatar = false, attachments, readStatus, 
  isVisible = false, reactions, selected = false, showTail = true,
  replyTo, onLongPress, onPress, onReactionPress, onSwipeReply, onReplyPress,
  isForwarded = false, isDeleted = false, highlighted = false,
  isSingleEmoji = false, isMediumEmoji = false, isSmallEmoji = false,
  searchText = '', searchEnabled = false, mentions = [], isStarred = false, onMentionPress,
}: MessageBubbleProps) => {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const bubbleRef = React.useRef<View>(null);
  const swipeableRef = React.useRef<Swipeable>(null);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (highlighted) {
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
            <Ionicons name="arrow-undo" size={16} color={colors.text.inverse} />
          </View>
        </Animated.View>
      </View>
    );
  };

  const shouldShowAvatar = !isMine && (showAvatar || !!senderAvatar || !!senderName);
  const shouldShowSenderHeader = !isMine && (showSenderHeader || !!senderName);

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
        {/* Highlight flash overlay */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: colors.brand.primary,
            opacity: Animated.multiply(highlightAnim, new Animated.Value(0.35)),
            zIndex: 10,
            borderRadius: 10,
          }}
        />

        <View style={[styles.outerRow, isMine ? styles.outerRowMine : styles.outerRowOther]}>
          {shouldShowAvatar && (
            <View style={styles.avatarContainer}>
              {senderAvatar ? (
                <Image source={{ uri: senderAvatar }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: getSenderColor(senderName) }]}>
                  <Text style={styles.avatarInitial}>
                    {senderName ? senderName.trim().charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            ref={bubbleRef}
            activeOpacity={0.9}
            onLongPress={handleLongPress}
            onPress={onPress}
            delayLongPress={200}
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
                <Ionicons name="ban-outline" size={16} color={colors.text.muted} style={styles.deletedIcon} />
                <AppText variant="body" color={colors.text.muted} style={styles.deletedText}>{text || "This message was deleted"}</AppText>
              </View>
            ) : (
              <>
                {shouldShowSenderHeader && senderName ? (
                  <View style={styles.senderHeaderRow}>
                    <AppText style={[styles.senderNameText, { color: getSenderColor(senderName) }]} numberOfLines={1}>
                      ~ {senderName}
                    </AppText>
                  </View>
                ) : null}

                {isForwarded && (
                  <View style={styles.forwardedContainer}>
                    <Ionicons name="arrow-redo" size={14} color={colors.text.muted} style={styles.forwardedIcon} />
                    <AppText variant="caption" style={styles.forwardedText}>Forwarded</AppText>
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
                    searchText={searchText}
                    searchEnabled={searchEnabled}
                    mentions={mentions}
                    onMentionPress={onMentionPress}
                  />
                ) : null}

                {!showOverlayTime && hasText ? (
                  <StatusIndicator 
                    time={time}
                    readStatus={readStatus}
                    isMine={isMine}
                    isSingleEmoji={isSingleEmoji}
                    isStarred={isStarred}
                  />
                ) : null}
              </>
            )}
          </TouchableOpacity>
        </View>

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
         prev.searchText === next.searchText &&
         prev.searchEnabled === next.searchEnabled &&
         prev.isStarred === next.isStarred &&
         prev.senderName === next.senderName &&
         prev.senderAvatar === next.senderAvatar &&
         prev.senderEmail === next.senderEmail &&
         prev.showSenderHeader === next.showSenderHeader &&
         prev.showAvatar === next.showAvatar &&
         JSON.stringify(prev.reactions) === JSON.stringify(next.reactions) &&
         JSON.stringify(prev.mentions) === JSON.stringify(next.mentions);
});

export default MessageBubble;
