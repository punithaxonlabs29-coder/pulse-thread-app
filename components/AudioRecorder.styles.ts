import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../design';

const { width } = Dimensions.get('window');

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  micButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheetContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: 'center',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
    marginBottom: 24,
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
  },
  timerText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text.primary,
    marginRight: 16,
    width: 45,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  bar: {
    width: 3,
    backgroundColor: colors.brand.primary,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 32,
    borderRadius: 28,
    backgroundColor: colors.brand.primary + '20',
  },
  pauseText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.brand.primary,
    marginLeft: 8,
  },
  sendButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  }
});