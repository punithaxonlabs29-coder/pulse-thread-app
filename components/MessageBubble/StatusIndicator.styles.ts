import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  absoluteFooter: {
    position: "absolute",
    bottom: -2,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  singleEmojiTimePillMy: {
    backgroundColor: colors.bubble.own.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    bottom: 4,
    right: 4,
    ...Shadows.sm,
  },
  singleEmojiTimePillOther: {
    backgroundColor: colors.bubble.other.background,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    bottom: 4,
    right: 4,
    ...Shadows.sm,
  },
  time: {
    // fontSize: 11, handled by AppText if possible, or just keep it small
    fontSize: 11,
  },
  myTimeText: {
    color: "rgba(17,24,39,0.6)", // Muted dark text
  },
  otherTimeText: {
    color: colors.text.muted,
  },
  tickIcon: {
    marginLeft: 2,
  },
});