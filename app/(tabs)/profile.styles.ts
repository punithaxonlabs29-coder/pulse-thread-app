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
  
  // Edit Mode Specific Styles
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  headerLeft: {
    width: 60,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 60,
    alignItems: 'flex-end',
  },
  headerActionTextCancel: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '700',
  },
  headerActionTextEdit: {
    fontSize: 16,
    color: '#0a0b0c',
    fontWeight: '700',
  },
  changePhotoText: {
    marginTop: 8,
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  inputGroup: {
    marginBottom: 16,
    paddingHorizontal: 18,
  },
  inputLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabledInputContainer: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  disabledInputField: {
    color: '#6B7280',
  },
  lockIcon: {
    marginLeft: 8,
  },
  
  saveButton: {
    backgroundColor: "#3B82F6",
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: "#93C5FD",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 8,
  },
  editButton: {
  width: 48,
  height: 48,
  justifyContent: 'center',
  alignItems: 'center',
}
});