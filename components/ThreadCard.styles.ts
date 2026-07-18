import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#FFFFFF",
    backgroundColor: colors.background.surface,
    // paddingHorizontal: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14, // Keeping 14 as it's not a standard spacing scale token yet
    // borderBottomWidth: 0.5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor: "#E5E7EB",
    borderBottomColor: colors.border.primary,
  },

  selectedContainer: {
    // backgroundColor: "rgba(249, 115, 22, 0.12)",
    backgroundColor: colors.brand.primaryLight,
  },

  avatarContainer: {
    position: "relative",
  },

  checkmark: {
    position: "absolute",
    bottom: -2,
    right: -2,
    // backgroundColor: "#FFFFFF",
    backgroundColor: colors.background.surface,
    // borderRadius: 12,
    borderRadius: Radius.lg, // 14 is close to 12, or use Radius.full
  },

  avatar: {
    width: 58,
    height: 58,
    // borderRadius: 29,
    borderRadius: Radius.full,
  },

  avatarPlaceholder: {
    width: 58,
    height: 58,
    // borderRadius: 29,
    borderRadius: Radius.full,
    // backgroundColor: "#F97316",
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  initials: {
    // color: "#FFFFFF",
    // fontWeight: "700",
    // fontSize: 20,
    // MOVED to AppText in component
  },

  center: {
    flex: 1,
    // marginLeft: 14,
    marginLeft: 14,
  },

  title: {
    // fontSize: 19,
    // fontWeight: "600",
    // color: "#111827",
    // MOVED to AppText
  },

  subtitle: {
    // marginTop: 4,
    marginTop: Spacing.xs,
    // color: "#6B7280",
    // fontSize: 16,
    // MOVED to AppText
  },
  
  typingSubtitle: {
    // marginTop: 4,
    marginTop: Spacing.xs,
    // color: "#22C55E",
    // fontSize: 16,
    // fontStyle: "italic",
    // fontWeight: "500",
    // MOVED to AppText
    fontStyle: "italic",
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 50,
  },

  time: {
    // fontSize: 14,
    // color: "#6B7280",
    // MOVED to AppText
  },

  badge: {
    // backgroundColor: "#22C55E",
    backgroundColor: colors.status.success,
    minWidth: 22,
    height: 22,
    // borderRadius: 11,
    borderRadius: Radius.full,
    justifyContent: "center",
    alignItems: "center",
    // paddingHorizontal: 6,
    paddingHorizontal: 6,
  },

  badgeText: {
    // color: "#FFFFFF",
    // fontSize: 14,
    // fontWeight: "700",
    // MOVED to AppText
  },
});