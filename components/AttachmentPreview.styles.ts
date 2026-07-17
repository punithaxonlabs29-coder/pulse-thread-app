import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.background.surface,
    borderTopWidth: 1,
    borderColor: colors.border.primary,
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  attachmentWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: Radius.md,
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.status.error,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.surface,
  },
});