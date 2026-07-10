import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  attachmentWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});