import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Message } from "../types/connects";
import { formatDateHeader, formatTimeOnly } from "../utils/date";
import MessageBubble from "./MessageBubble";

interface MessageInfoProps {
  message: Message;
  currentUserEmail: string;
  onClose: () => void;
}

export default function MessageInfo({ message, currentUserEmail, onClose }: MessageInfoProps) {
  // Use created_at for dummy receipt times to match UI design perfectly
  const timeString = `${formatDateHeader(message.created_at)}, ${formatTimeOnly(message.created_at)}`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Message info</Text>
      </View>

      <View style={styles.content}>
        {/* Top Half: Message Preview */}
        <ImageBackground 
          source={require('../assets/images/chat_bg.png')} 
          style={styles.halfScreen}
          resizeMode="cover"
        >
          <ScrollView contentContainerStyle={styles.messagePreviewContainer}>
          <MessageBubble
            messageId={message.message_id}
            text={message.text}
            time={formatTimeOnly(message.created_at)}
            isMine={true} // In MessageInfo, usually it's always displayed on the right like WhatsApp, or we can use isMine check
            attachments={message.attachments}
            readStatus="read"
            reactions={message.reactions}
            selected={false}
            showTail={true}
          />
          </ScrollView>
        </ImageBackground>

        {/* Bottom Half: Receipts */}
        <View style={styles.halfScreen}>
          <ScrollView style={styles.receiptsContainer} contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={styles.receiptRow}>
              <View style={styles.receiptLeft}>
                <Ionicons name="checkmark-done" size={20} color="#53BDEB" style={styles.receiptIcon} />
                <View>
                  <Text style={styles.receiptTitle}>Seen</Text>
                  <Text style={styles.receiptTime}>{timeString}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />

            <View style={styles.receiptRow}>
              <View style={styles.receiptLeft}>
                <Ionicons name="checkmark-done" size={20} color="#8696A0" style={styles.receiptIcon} />
                <View>
                  <Text style={styles.receiptTitle}>Delivered</Text>
                  <Text style={styles.receiptTime}>{timeString}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBE6DF', // App chat background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7dac3',
    paddingTop: 16, // Assuming safe area or header spacing
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  halfScreen: {
    flex: 1,
  },
  messagePreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'flex-end',
    flexGrow: 1,
  },
  receiptsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  receiptIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  receiptTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  receiptTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 48,
  },
});
