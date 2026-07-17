import { StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  replySnippetContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  replySnippetLeftBar: {
    width: 6,
    borderTopLeftRadius: Radius.md,
    borderBottomLeftRadius: Radius.md,
    backgroundColor: colors.brand.primary,
  },
  replySnippetContent: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    justifyContent: 'center',
    backgroundColor: colors.brand.primaryLight,
  },
  replySnippetName: {
    // fontSize: 15,
    // fontWeight: 'bold',
    marginBottom: 2,
    color: colors.brand.accent,
  },
  replySnippetText: {
    // fontSize: 14,
    color: colors.text.muted,
  },
  replySnippetThumbnail: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
  },
});