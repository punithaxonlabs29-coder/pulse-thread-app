import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -2,
    zIndex: 10,
  },
  myReactionsContainer: {
    alignSelf: 'flex-end',
    marginRight: 12,
  },
  otherReactionsContainer: {
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 0,
    height: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  reactionPillActive: {
    backgroundColor: '#F3F4F6', 
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 11,
    marginLeft: 4,
    color: '#6B7280',
    fontWeight: '500',
  }
});