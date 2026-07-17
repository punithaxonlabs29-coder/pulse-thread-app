import { StyleSheet } from 'react-native';
import { Colors, Spacing, Shadows } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary, // App chat background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingTop: Spacing.lg, // Assuming safe area or header spacing
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    ...Shadows.md,
  },
  backButton: {
    marginRight: Spacing.lg,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.text.inverse,
  },
  content: {
    flex: 1,
  },
  halfScreen: {
    flex: 1,
  },
  messagePreviewContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'flex-end',
    flexGrow: 1,
  },
  receiptsContainer: {
    flex: 1,
    backgroundColor: colors.background.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.primary,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  receiptIcon: {
    marginTop: 2,
    marginRight: Spacing.md,
  },
  receiptTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  receiptTime: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.primary,
    marginLeft: 48,
  },
});