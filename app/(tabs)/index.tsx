import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import ThreadCard from "../../components/ThreadCard";
import { ConnectsService } from "../../services/connects.service";
import { SessionService } from "../../services/session.service";
import { Channel } from "../../types/connects";

export default function ChatsScreen() {
  const [channels, setChannels] = useState<Channel[]>([]);
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

      const channelList = await ConnectsService.getChannels();

      setChannels(channelList);

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (channel: Channel) => {
    console.log("Navigating to Chat:", channel.channel_id);

    router.push({
      pathname: "/chat",
      params: { 
        channelId: channel.channel_id,
        channelName: channel.channel_name
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Pulse Threads
      </Text>

      <FlatList
        data={channels}
        keyExtractor={(item) => item.channel_id}
        renderItem={({ item }) => (
          <ThreadCard
            channel={item}
            currentUserEmail={currentUserEmail}
            onPress={() => openChat(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
});