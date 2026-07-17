import { View } from "react-native";
import { useColors } from "../../design";
import { AppText } from "../../components/ui/AppText";
import React from 'react';

export default function RegisterScreen() {
  const colors = useColors();

  return (
    <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background.primary}}>
      <AppText style={{color: colors.text.primary}}>Registration Screen</AppText>
    </View>
  );
}
