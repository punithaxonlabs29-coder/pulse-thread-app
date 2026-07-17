import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows, ZIndices } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    // padding: 16,
    padding: Spacing.lg,
    // backgroundColor: "#F9F6F0",
    backgroundColor: colors.background.primary,
    // borderBottomWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderColor: "#E5E7EB",
    borderColor: colors.border.primary,
  },
  backButton: {
    // paddingRight: 12,
    paddingRight: Spacing.md,
  },
  profileImage: {
    width: 40,
    height: 40,
    // borderRadius: 20,
    borderRadius: Radius.full,
    // marginRight: 12,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    // backgroundColor: "#F97316",
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    // color: "#FFFFFF",
    // fontSize: 20,
    // fontWeight: "bold",
    // MOVED to AppText
  },
  headerInfo: {
    // marginLeft: 4,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  name: {
    // fontSize: 20,
    // fontWeight: "600",
    // color: "#111827",
    // MOVED to AppText
  },
  status: {
    // fontSize: 14,
    // color: "#16A34A",
    // marginTop: 2,
    // MOVED to AppText
  },
  typingStatus: {
    // fontSize: 14,
    // color: "#F97316",
    // fontStyle: "italic",
    // marginTop: 2,
    fontStyle: "italic",
    marginTop: Spacing.xxs,
  },
  menuButton: {
    // padding: 8,
    padding: Spacing.sm,
  }
});

export const createMenuStyles = (colors: typeof Colors.light) => StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 7,
    marginLeft: 2,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdown: {
    position: 'absolute',
    // backgroundColor: '#FFFFFF',
    backgroundColor: colors.background.surface,
    // borderRadius: 12,
    borderRadius: Radius.lg,
    minWidth: 230,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.18,
    // shadowRadius: 12,
    // elevation: 10,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal: 18,
    paddingHorizontal: Spacing.lg,
    // paddingVertical: 14,
    paddingVertical: 14,
    // backgroundColor: '#FFFFFF',
    backgroundColor: colors.background.surface,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    // marginRight: 14,
    marginRight: 14,
    width: 20,
  },
  menuLabel: {
    flex: 1,
    // fontSize: 15,
    // color: '#111827',
    // fontWeight: '400',
    // MOVED to AppText
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    // backgroundColor: '#F3F4F6',
    backgroundColor: colors.background.primary,
    // marginHorizontal: 16,
    marginHorizontal: Spacing.lg,
  },
});