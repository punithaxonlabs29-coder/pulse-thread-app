import { StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    position: 'relative',
    marginTop: 2,
    marginBottom: 2,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: Radius.md,
  },
  loadingContainer: {
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', // Keep specific semi-transparent overlay
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.md,
  },
  timeText: {
    color: colors.text.inverse,
    fontSize: 11,
  },
  tickIcon: {
    marginLeft: 2,
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  downloadCircle: {
    backgroundColor: 'rgba(0,0,0,0.6)', // Specific for download button
    borderRadius: 24,
    padding: 2,
  }
});