import { StyleSheet } from 'react-native';
import { Colors, Radius } from '../../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 260, // Fixed width to ensure stable 2x2 wrapping
    justifyContent: 'space-between',
    padding: 2,
    backgroundColor: '#000',
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  gridItem: {
    width: '49.5%',
    aspectRatio: 1,
    marginBottom: '1%',
    position: 'relative',
    overflow: 'hidden',
  },
  extraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  extraText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 5,
  },
  timeText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  tickIcon: {
    marginLeft: 4,
  },
  uploadingCenterOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  uploadingCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(24, 115, 68, 0.8)', // WhatsApp style green circle
    justifyContent: 'center',
    alignItems: 'center',
  }
});
