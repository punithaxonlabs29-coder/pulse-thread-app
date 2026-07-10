import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)', // Invisible overlay to capture taps outside, or subtle tint
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emojiButton: {
    paddingHorizontal: 8,
  },
  emojiText: {
    fontSize: 28,
  }
});