import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows, ZIndices } from '../../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#F8FAFC",
    backgroundColor: colors.background.primary,
  },

  listContainer: {
    // paddingBottom: 20,
    paddingBottom: Spacing.xl,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    // fontSize: 30,
    // fontWeight: "700",
    // color: "#111827",
    // MOVED to AppText
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "#F97316", // Pulse Threads orange theme
    backgroundColor: colors.brand.primary,
    // paddingHorizontal: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    minHeight: 60,
  },

  actionBarCount: {
    // color: "#FFFFFF",
    // fontSize: 20,
    // fontWeight: "600",
    // marginLeft: 24,
    marginLeft: Spacing.xxl,
    flex: 1,
  },

  actionIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionIconButton: {
    // marginLeft: 24,
    marginLeft: Spacing.xxl,
  },

  newChatButton: {
    // padding: 8,
    padding: Spacing.sm,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#E2E8F0',
    backgroundColor: colors.border.primary, 
    // borderRadius: 20,
    borderRadius: Radius.xl,
    // marginHorizontal: 16,
    marginHorizontal: Spacing.lg,
    // paddingHorizontal: 16,
    paddingHorizontal: Spacing.lg,
    height: 40,
    // marginBottom: 12,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    // fontSize: 16,
    fontSize: 16,
    // color: '#1E293B',
    color: colors.text.primary,
  },
  filtersScrollContainer: {
    // paddingHorizontal: 16,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 10, // Added paddingBottom to prevent clipping of shadows/chips
    marginBottom: 4,
  },
  filterChip: {
    // paddingHorizontal: 16,
    paddingHorizontal: Spacing.lg,
    height: 30, 
    // borderRadius: 15, 
    borderRadius: Radius.full,

    // backgroundColor: '#FFFFFF', // White background for inactive
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    // borderColor: '#F97316', // Orange border
    borderColor: colors.border.brand,
    // marginRight: 8,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    // backgroundColor: '#F97316', // Orange background for active
    backgroundColor: colors.brand.primary,
    // borderColor: '#F97316',
    borderColor: colors.border.brand,
  },
  filterChipText: {
    // color: '#F97316', // Orange text for inactive
    // fontSize: 16,
    // fontWeight: '600',
    // MOVED to AppText
  },
  filterChipTextActive: {
    // color: '#FFFFFF', // White text for active
    // MOVED to AppText
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    // backgroundColor: '#F97316',
    backgroundColor: colors.brand.primary,
    width: 56,
    height: 56,
    // borderRadius: 28,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 4,
    // elevation: 6,
    ...Shadows.md,
  },

  popupMenu: {
    position: "absolute",
    top: 95,
    // right: 16,
    right: Spacing.lg,
    width: 150,
    // backgroundColor: "#FFFFFF",
    backgroundColor: colors.background.surface,
    // borderRadius: 14,
    borderRadius: Radius.lg,
    // paddingVertical: 8,
    paddingVertical: Spacing.sm,

    // elevation: 10,
    // shadowColor: "#000",
    // shadowOpacity: 0.15,
    // shadowRadius: 10,
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    ...Shadows.lg,

    // zIndex: 1000,
    zIndex: ZIndices.modal,
  },

  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // zIndex: 999,
    zIndex: ZIndices.modal - 1,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    // paddingHorizontal: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
  },

  menuText: {
    marginLeft: 14,
    // fontSize: 16,
    // color: "#111827",
    // MOVED to AppText
  },
});
