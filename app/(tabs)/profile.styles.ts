import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    paddingHorizontal: 20,
  },

  header: {
    fontSize: 30,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 20,
    color: "#111827",
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 15,
  },

  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  avatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 30,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  designation: {
    marginTop: 5,
    fontSize: 16,
    color: "#F97316",
    fontWeight: "600",
  },

  email: {
    marginTop: 5,
    fontSize: 15,
    color: "#6B7280",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 18,
    overflow: "hidden",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 8,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  menuText: {
    marginLeft: 15,
    fontSize: 15,
    color: "#1F2937",
    flexShrink: 1,
  },

  logoutButton: {
    backgroundColor: "#EF4444",
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 10,
  },

  version: {
    textAlign: "center",
    color: "#9CA3AF",
    marginBottom: 30,
    fontSize: 13,
  },
});