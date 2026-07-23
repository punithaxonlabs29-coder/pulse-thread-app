import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing } from '../design';

const { width, height } = Dimensions.get('window');

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    height: 270,
    backgroundColor: colors.background.primary,
    borderTopWidth: 1,
    borderColor: colors.border.primary,
    paddingBottom: 10,
  },
  categoryContainer: {
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: Spacing.md,
  },
  categoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    paddingHorizontal: Spacing.md,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiWrapper: {
    width: width / Math.floor(width / 44),
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 26,
    lineHeight: 34,
    textAlign: 'center',
    color: '#000000',
  },
  backspaceTopButton: {
    padding: 4,
  }
});