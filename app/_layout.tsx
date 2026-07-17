import { Stack, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChatProvider } from "../contexts/ChatContext";
import NotificationService from "../services/notification.service";

import { DatabaseService } from "../services/database.service";
import { backgroundWorker } from "../services/background.worker";
import { useColors } from "../design";

let navigating = false;

export default function RootLayout() {
  const colors = useColors();
  useEffect(() => {
    // Initialize SQLite Database on startup
    DatabaseService.init().then(() => {
      backgroundWorker.start();
    }).catch(console.error);

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    
    NotificationService.initialize((channelId) => {
      if (navigating) return;
      navigating = true;

      // Small timeout ensures the router is fully mounted if opening from completely closed state
      setTimeout(() => {
        router.push({
          pathname: "/chat",
          params: { channelId: channelId }
        });

        // Release the lock after navigation completes
        setTimeout(() => {
          navigating = false;
        }, 1000);
      }, 300);
    }).then(unsub => {
      if (cancelled) {
        unsub(); // component already unmounted before init finished — clean up immediately
      } else {
        unsubscribe = unsub;
      }
    });

    return () => {
      cancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ChatProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={colors.background.surface} />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </SafeAreaProvider>
      </ChatProvider>
    </GestureHandlerRootView>
  );
}
