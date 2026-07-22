import { MessageCircle, Handshake, User } from "lucide-react-native";
import { withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useColors } from "../../design";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { Navigator } = createMaterialTopTabNavigator();
const MaterialTopTabs = withLayoutContext(Navigator);

export default function TabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  return (
    <MaterialTopTabs
      tabBarPosition="bottom"
      screenOptions={{
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarShowIcon: true,
        tabBarIndicatorStyle: {
           backgroundColor: colors.brand.primary,
           height: 3,
           position: 'absolute',
           top: 0
        },
        tabBarStyle: {
          backgroundColor: colors.background.surface,
          borderTopColor: colors.border.primary,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          textTransform: 'none',
          fontSize: 12,
        },
        swipeEnabled: true,
      }}
    >
      <MaterialTopTabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color }: { color: string }) => (
            <MessageCircle
              color={color}
              size={24}
            />
          ),
        }}
      />

      <MaterialTopTabs.Screen
        name="deals"
        options={{
          title: "Deals",
          tabBarIcon: ({ color }: { color: string }) => (
            <Handshake
              color={color}
              size={24}
            />
          ),
        }}
      />

      <MaterialTopTabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }: { color: string }) => (
            <User
              color={color}
              size={24}
            />
          ),
        }}
      />
    </MaterialTopTabs>
  );
}