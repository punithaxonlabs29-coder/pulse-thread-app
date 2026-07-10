import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#f7dac3", // App theme orange
    borderBottomWidth: 1,
    borderColor: "#f7dac3",
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    padding: 8,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 16,
  },
  menuOverlay: {
    flex: 1,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 50,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
  }
});