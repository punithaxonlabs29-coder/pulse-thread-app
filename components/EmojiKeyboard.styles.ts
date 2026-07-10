import { StyleSheet, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    height: 300,
    backgroundColor: '#F3F4F6',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryContainer: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    paddingHorizontal: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiWrapper: {
    width: width / Math.floor(width / 48), // Increased width hit area
    height: 52, // Increased height hit area
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 34,
  },
  backspaceTopButton: {
    padding: 4,
  }
});