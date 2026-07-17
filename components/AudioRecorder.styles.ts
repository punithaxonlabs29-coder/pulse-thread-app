import { StyleSheet } from 'react-native';
import { Colors } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  micButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    borderRadius: 20,
  },
  recordingActive: {
    backgroundColor: colors.status.error,
  }
});