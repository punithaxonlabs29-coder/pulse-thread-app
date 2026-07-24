import { StyleSheet } from 'react-native';
import { Colors } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 240, // Fixed width for audio player
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  playButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playButtonMine: {
    backgroundColor: colors.brand.primary,
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
    height: 32,
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
    fontWeight: '600',
  },
  textMine: {
    color: colors.bubble.own.text,
  },
  textOther: {
    color: colors.text.primary,
  },
  timeText: {
    fontSize: 11,
    marginLeft: 8,
    color: colors.text.muted,
  },
  tickIcon: {
    marginLeft: 4,
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
