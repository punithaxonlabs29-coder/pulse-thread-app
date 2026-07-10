import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  replySnippetContainer: {
    flexDirection: 'row',
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  replySnippetLeftBar: {
    width: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  replySnippetContent: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  replySnippetName: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  replySnippetText: {
    fontSize: 12,
    color: '#6B7280',
  },
  replySnippetThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
});