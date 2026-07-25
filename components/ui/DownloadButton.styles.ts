import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    padding: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  progressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  progressText: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
