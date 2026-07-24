import { StyleSheet } from 'react-native';
import { Colors } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  listContent: {
    paddingBottom: 100, // padding for bottom bar
  },
  channelItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.surface,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: "bold",
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  channelSubtext: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionCircleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.brand.primary,
  },
  bottomBar: {
    backgroundColor: colors.background.surface,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
  },
  previewContainer: {
    backgroundColor: colors.background.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  previewText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  textInput: {
    color: colors.text.primary,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});