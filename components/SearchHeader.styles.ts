import { StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  backBtn: {
    marginRight: Spacing.sm,
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border.primary,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 0, 
  }
});
