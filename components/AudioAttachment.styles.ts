import { StyleSheet } from 'react-native';
import { Colors } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 240, // Fixed width prevents collapsing
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonMine: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  playButtonOther: {
    backgroundColor: colors.brand.primary,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
  },
  bar: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  durationText: {
    fontSize: 12,
    opacity: 0.9,
    fontWeight: '500',
  },
  textMine: {
    color: '#FFFFFF',
  },
  textOther: {
    color: colors.text.secondary,
  },
  timeText: {
    fontSize: 11,
    marginLeft: 8,
    opacity: 0.7,
  },
  tickIcon: {
    marginLeft: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
