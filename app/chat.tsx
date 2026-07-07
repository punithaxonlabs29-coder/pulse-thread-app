import React, { useState, useRef, useEffect } from "react";
import { FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, View, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

import ChatHeader from "../components/ChatHeader";
import MessageBubble from "../components/MessageBubble";
import MessageInput from "../components/MessageInput";
import { ConnectsService } from "../services/connects.service";
import { SessionService } from "../services/session.service";
import { Message } from "../types/connects";
import { formatMessageTime } from "../utils/date";

export default function ChatScreen() {
  const { channelId, channelName } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadData();
  }, [channelId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const user = await SessionService.getUser();
      if (user) {
        setCurrentUserEmail(user.email_id);
      }

      if (channelId) {
        const messageList = await ConnectsService.getMessages(channelId as string);
        setMessages(messageList);
      }
    } catch (error) {
      console.log("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (text: string, attachments?: any[]) => {
    try {
      const response = await ConnectsService.sendMessage(channelId as string, text, attachments);
      
      if (response && response.created_message) {
        setMessages((prev) => [...prev, response.created_message]);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.log("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loader]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
      >
        <ChatHeader 
          name={(channelName as string) || "Unknown"} 
          status="Online" 
        />

        <ImageBackground 
          source={require('../assets/images/chat_bg.png')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.message_id}
            renderItem={({ item }) => (
              <MessageBubble 
                messageId={item.message_id}
                text={item.text} 
                attachments={item.attachments || []}
                time={formatMessageTime(item.created_at)} 
                isMine={item.sender_email === currentUserEmail} 
              />
            )}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        </ImageBackground>

        <MessageInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loader: {
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardView: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
});
