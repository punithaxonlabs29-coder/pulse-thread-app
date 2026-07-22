import { StyleSheet } from "react-native";

export const createStyles = (colors: any) =>
  StyleSheet.create({
    sheet: {
      backgroundColor: colors.background?.surface || colors.background?.primary || '#FFFFFF',
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    handle: {
      width: 45,
      height: 5,
      borderRadius: 10,
      backgroundColor: "#CFCFCF",
    },
  });