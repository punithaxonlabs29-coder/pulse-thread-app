import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ConnectsService } from "../services/connects.service";
import { SessionService } from "../services/session.service";
import { Ionicons } from "@expo/vector-icons";
import { styles } from './_new-chat.styles';


export default function NewChatScreen() {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await SessionService.getUser();
      if (user) {
        setCurrentUserEmail(user.email_id);
      }

      const allPeople = await ConnectsService.getPeople();
      // Filter out the current user
      const others = allPeople.filter(
        (p: any) => {
          const pEmail = p.email || p.email_id;
          return pEmail?.toLowerCase() !== user?.email_id?.toLowerCase();
        }
      );
      setPeople(others);
    } catch (error) {
      console.log('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (person: any) => {
    try {
      setLoading(true);
      const channelName = person.name || person.employee_name || "Direct Chat";
      const personEmail = person.email || person.email_id;
      
      const response = await ConnectsService.createChannel(
        channelName,
        personEmail,
        channelName
      );

      if (response && response.channel) {
        const item = response.channel;
        const currentUser = await SessionService.getUser();
        const otherMember = item.channel_type === "direct" 
            ? item.members?.find((m: any) => m.email?.toLowerCase() !== currentUser?.email_id?.toLowerCase())
            : null;
            
        const resolvedChannelName = (item.channel_type === "direct" 
            ? otherMember?.name ?? item.channel_name 
            : item.channel_name) || "Unknown";
            
        const resolvedChannelImage = item.channel_type === "direct"
            ? otherMember?.profile_image_url || ""
            : item.channel_image || "";

        // Navigate to chat
        router.replace({
          pathname: "/chat",
          params: { 
            channelId: item.channel_id,
            channelName: resolvedChannelName,
            channelImage: resolvedChannelImage,
          }
        });
      }
    } catch (error) {
      console.log("Error creating channel:", error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>New Chat</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item, index) => item.email || item.email_id || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.personCard} onPress={() => startChat(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.name || item.employee_name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>{item.name || item.employee_name}</Text>
                <Text style={styles.personEmail}>{item.email || item.email_id}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No other users found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

