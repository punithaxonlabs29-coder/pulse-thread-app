import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  listContainer: {
    paddingBottom: 20,
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  newChatButton: {
    padding: 8,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1E293B',
  },
  filtersScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10, // Added paddingBottom to prevent clipping of shadows/chips
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 16,
    height: 25, // Reduced from 36 to 30
    borderRadius: 15, // Reduced from 18 to 15 (half of height)
    backgroundColor: '#FFFFFF', // White background for inactive
    borderWidth: 1,
    borderColor: '#F97316', // Orange border
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#F97316', // Orange background for active
    borderColor: '#F97316',
  },
  filterChipText: {
    color: '#F97316', // Orange text for inactive
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF', // White text for active
  },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#F97316',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  popupMenu: {
  position: "absolute",
  top: 95,
  right: 16,
  width: 150,
  backgroundColor: "#FFFFFF",
  borderRadius: 14,
  paddingVertical: 8,

  elevation: 10,

  shadowColor: "#000",
  shadowOpacity: 0.15,
  shadowRadius: 10,
  shadowOffset: {
    width: 0,
    height: 4,
  },

  zIndex: 1000,
},

menuOverlay: {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 999,
},

menuItem: {
  flexDirection: "row",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 6,
},

menuText: {
  marginLeft: 14,
  fontSize: 16,
  color: "#111827",
},
});

