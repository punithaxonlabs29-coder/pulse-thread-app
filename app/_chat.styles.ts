import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows, ZIndices } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loader: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicatorContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  typingIndicatorText: {
    fontSize: 14,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
  keyboardView: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  floatingPill: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.lg,
    backgroundColor: colors.text.primary, // Dark gray/black for FAB
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    zIndex: 10,
  },
  floatingDateContainer: {
    position: 'absolute',
    top: 10,
    width: '100%',
    alignItems: 'center',
    zIndex: 20,
  },
  floatingDatePill: {
    backgroundColor: colors.background.surface, // Or maybe a slightly transparent surface
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    ...Shadows.sm,
  },
  floatingDateText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: colors.status.success,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  unreadBadgeText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  // ── Search counter pill ───────────────────────────────────────────────────
  searchCounterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primaryLight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.brand.primary,
    paddingVertical: 6,
    gap: Spacing.lg,
  },
  searchNavBtn: {
    padding: 4,
  },
  searchCounterText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    minWidth: 52,
    textAlign: 'center',
  },
  // ─────────────────────────────────────────────────────────────────────────
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.primary,
  },
  pinnedIcon: {
    marginRight: Spacing.md,
  },
  pinnedTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pinnedSubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  pinnedThumbnail: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    marginLeft: Spacing.md,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateHeaderPill: {
    backgroundColor: colors.background.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContainer: {
    width: '85%',
    backgroundColor: colors.background.primary,
    borderRadius: Radius.lg,
    padding: 20,
    ...Shadows.lg,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
  },
  deleteModalButton: {
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  deleteModalButtonText: {
    fontSize: 18,
    color: colors.brand.primary,
    fontWeight: '600',
  }
});
