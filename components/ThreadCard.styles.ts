import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },

  avatarPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
  },

  initials: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },

  center: {
    flex: 1,
    marginLeft: 14,
  },

  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },
  
  typingSubtitle: {
    marginTop: 4,
    color: "#22C55E",
    fontSize: 14,
    fontStyle: "italic",
    fontWeight: "500",
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 50,
  },

  time: {
    fontSize: 12,
    color: "#6B7280",
  },

  badge: {
    backgroundColor: "#22C55E",
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});