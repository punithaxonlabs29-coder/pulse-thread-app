import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBE6DF', // App chat background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7dac3',
    paddingTop: 16, // Assuming safe area or header spacing
    paddingBottom: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  halfScreen: {
    flex: 1,
  },
  messagePreviewContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'flex-end',
    flexGrow: 1,
  },
  receiptsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  receiptLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  receiptIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  receiptTitle: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 4,
  },
  receiptTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 48,
  },
});