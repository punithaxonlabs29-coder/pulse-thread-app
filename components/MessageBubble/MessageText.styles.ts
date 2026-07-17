import { StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  messageText: {
    // fontSize: 18,
    // lineHeight: 24,
    // Handled by AppText
  },
  singleEmojiText: {
    fontSize: 80,
    lineHeight: 96,
  },
  mediumEmojiText: {
    fontSize: 44,
    lineHeight: 52,
  },
  smallEmojiText: {
    fontSize: 32,
    lineHeight: 40,
  },
  myMessageText: {
    // color: "#111827",
    color: colors.bubble.own.text,
  },
  otherMessageText: {
    // color: "#111827",
    color: colors.bubble.other.text,
  },
  readMoreText: {
    // fontSize: 16,
    // fontWeight: "bold",
    // marginTop: 4,
    marginTop: Spacing.xs,
  },
  myReadMoreText: {
    // color: "#3B82F6",
    color: colors.brand.primary, // Using brand instead of a blue hardcoded color
  },
  otherReadMoreText: {
    // color: "#3B82F6",
    color: colors.brand.primary,
  },
  urlText: {
    textDecorationLine: 'underline',
  },
  myUrlText: {
    color: colors.bubble.own.text,
  },
  otherUrlText: {
    color: colors.brand.primary,
  },
  searchHighlight: {
    backgroundColor: '#FDE68A', // Keep literal for search highlight or add to colors
    color: colors.text.primary,
    borderRadius: 2,
  }
});