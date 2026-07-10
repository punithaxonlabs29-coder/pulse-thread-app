import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionHeader: {
    color: "#64748B",
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
    borderBottomColor: "#F1F5F9",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF8C00",
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
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  channelSubtext: {
    color: "#64748B",
    fontSize: 14,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionCircleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF8C00",
  },
  bottomBar: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  previewContainer: {
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  previewText: {
    color: "#64748B",
    fontSize: 14,
    fontStyle: "italic",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  inputContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    minHeight: 48,
    maxHeight: 120,
    justifyContent: "center",
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textInput: {
    color: "#111827",
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF8C00",
    justifyContent: "center",
    alignItems: "center",
  },
});