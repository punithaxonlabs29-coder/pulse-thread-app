import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Message } from "../types/connects";
import { formatDateHeader, formatTimeOnly } from "../utils/date";
import MessageBubble from "./MessageBubble";
import { styles } from './MessageInfo.styles';


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

