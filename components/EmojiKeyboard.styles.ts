import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing } from '../design';

const { width, height } = Dimensions.get('window');

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: colors.background.primary, // Usually light gray or primary
    borderTopWidth: 1,
    borderColor: colors.border.primary,
  },
  categoryContainer: {
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: Spacing.md,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    paddingHorizontal: Spacing.md,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiWrapper: {
    width: width / Math.floor(width / 48), // Increased width hit area
    height: 52, // Increased height hit area
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 34,
  },
  backspaceTopButton: {
    padding: 4,
  }
});