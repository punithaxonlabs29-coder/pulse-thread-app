import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9F6F0",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  backButton: {
    paddingRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerInfo: {
    marginLeft: 4,
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  status: {
    fontSize: 12,
    color: "#16A34A",
    marginTop: 2,
  },
  typingStatus: {
    fontSize: 12,
    color: "#F97316",
    fontStyle: "italic",
    marginTop: 2,
  },
  menuButton: {
    padding: 8,
  }
});