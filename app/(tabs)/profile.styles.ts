import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.surface,
    paddingHorizontal: Spacing.xl,
  },

  header: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    color: colors.text.primary,
  },

  profileCard: {
    backgroundColor: colors.background.primary,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: "center",
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: Spacing.lg,
  },

  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },

  avatarText: {
    color: colors.text.inverse,
    fontWeight: "700",
    fontSize: 30,
  },

  name: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
  },

  designation: {
    marginTop: Spacing.xs,
    fontSize: 18,
    color: colors.brand.primary,
    fontWeight: "600",
  },

  email: {
    marginTop: Spacing.xs,
    fontSize: 17,
    color: colors.text.secondary,
  },

  section: {
    backgroundColor: colors.background.primary,
    borderRadius: Radius.xl,
    marginBottom: 18,
    overflow: "hidden",
    ...Shadows.sm,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.secondary,
    paddingHorizontal: 18,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: colors.border.primary,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  menuText: {
    marginLeft: 15,
    fontSize: 17,
    color: colors.text.primary,
    flexShrink: 1,
  },

  logoutButton: {
    backgroundColor: colors.status.error,
    marginTop: 10,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },

  logoutText: {
    color: colors.text.inverse,
    fontSize: 19,
    fontWeight: "600",
    marginLeft: 10,
  },

  version: {
    textAlign: "center",
    color: colors.text.muted,
    marginBottom: 30,
    fontSize: 13,
  },
  
  // Edit Mode Specific Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text.primary,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerActionTextCancel: {
    fontSize: 16,
    color: colors.status.info,
    fontWeight: '700',
  },
  headerActionTextEdit: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '700',
  },
  changePhotoText: {
    marginTop: 8,
    color: colors.status.info,
    fontSize: 16,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: colors.background.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  
  inputGroup: {
    marginBottom: 16,
    paddingHorizontal: 18,
  },
  inputLabel: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.primary,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledInputContainer: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.primary,
  },
  inputField: {
    flex: 1,
    fontSize: 17,
    color: colors.text.primary,
  },
  disabledInputField: {
    color: colors.text.secondary,
  },
  lockIcon: {
    marginLeft: 8,
  },
  
  saveButton: {
    backgroundColor: colors.brand.primary,
    marginTop: 10,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: colors.brand.primaryLight,
  },
  saveText: {
    color: colors.text.inverse,
    fontSize: 19,
    fontWeight: "600",
    marginLeft: 8,
  },
  editButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  }
});