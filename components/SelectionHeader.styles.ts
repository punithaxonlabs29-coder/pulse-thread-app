import { StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadows } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.brand.primary, // App theme orange
    borderBottomWidth: 1,
    borderColor: colors.brand.primary,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: Spacing.sm,
  },
  countText: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: '500',
    marginLeft: Spacing.lg,
  },
  menuOverlay: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 12,
    backgroundColor: colors.background.surface,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    minWidth: 180,
    ...Shadows.md,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text.primary,
  }
});