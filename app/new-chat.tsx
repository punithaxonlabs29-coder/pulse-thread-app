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
import { CacheService } from "../services/cache.service";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from './_new-chat.styles';
import { useColors } from '../design';
import { AppText } from '../components/ui/AppText';


export default function NewChatScreen() {
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
      let currentEmail = "";
      if (user) {
        currentEmail = user.email_id;
        setCurrentUserEmail(currentEmail);
      }

      // 1. Instant Load from Cache
      const cachedPeople = await CacheService.getCachedPeople();
      if (cachedPeople && cachedPeople.length > 0) {
        const others = cachedPeople.filter(
          (p: any) => {
            const pEmail = p.email || p.email_id;
            return pEmail?.toLowerCase() !== currentEmail?.toLowerCase();
          }
        );
        setPeople(others);
        setLoading(false);
      }

      // 2. Fetch live data
      const allPeople = await ConnectsService.getPeople();
      
      if (allPeople && allPeople.length > 0) {
        // Save to cache
        await CacheService.savePeople(allPeople);

        // Filter out the current user
        const others = allPeople.filter(
          (p: any) => {
            const pEmail = p.email || p.email_id;
            return pEmail?.toLowerCase() !== currentEmail?.toLowerCase();
          }
        );
        setPeople(others);
      }
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
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <AppText style={styles.title}>New Chat</AppText>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item, index) => item.email || item.email_id || index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.personCard} onPress={() => startChat(item)}>
              <View style={styles.avatar}>
                <AppText style={styles.avatarText}>
                  {(item.name || item.employee_name || "U").charAt(0).toUpperCase()}
                </AppText>
              </View>
              <View style={styles.personInfo}>
                <AppText style={styles.personName}>{item.name || item.employee_name}</AppText>
                <AppText style={styles.personEmail}>{item.email || item.email_id}</AppText>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <AppText style={styles.emptyText}>No other users found.</AppText>
          }
        />
      )}
    </SafeAreaView>
  );
}

