import { StyleSheet } from 'react-native';
import { Colors } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
  },
  addButtonText: {
    color: colors.brand.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    color: colors.text.muted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
  listContainer: {
    paddingVertical: 8,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.primary,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  placeholderAvatar: {
    backgroundColor: colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text.secondary,
    fontSize: 18,
    fontWeight: '600',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  personEmail: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  checkboxContainer: {
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border.primary,
    marginLeft: 80,
  }
});
