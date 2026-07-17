import { StyleSheet } from 'react-native';
import { Colors, Shadows, Radius, Spacing } from '../../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -2,
    zIndex: 10,
  },
  myReactionsContainer: {
    alignSelf: 'flex-end',
    marginRight: Spacing.md,
  },
  otherReactionsContainer: {
    alignSelf: 'flex-start',
    marginLeft: Spacing.md,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.surface, 
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 0,
    height: 24,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...Shadows.sm,
  },
  reactionPillActive: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: colors.brand.primary,
  },
  reactionEmoji: {
    // fontSize: 16, Handled by AppText if possible, or leave as Text
    fontSize: 16,
  },
  reactionCount: {
    // fontSize: 11,
    marginLeft: Spacing.xs,
    color: colors.text.muted,
  }
});