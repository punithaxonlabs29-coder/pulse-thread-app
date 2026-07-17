import { StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)', // Invisible overlay to capture taps outside, or subtle tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.lg,
  },
  emojiButton: {
    paddingHorizontal: Spacing.sm,
  },
  emojiText: {
    fontSize: 28,
  }
});