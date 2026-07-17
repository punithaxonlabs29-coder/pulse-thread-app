import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Radius, Spacing } from '../design';

const { width, height } = Dimensions.get('window');

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  videoContainer: {
    width: 240,
    height: 180,
    backgroundColor: '#1F2937', // Always dark for video letterboxing
    borderRadius: Radius.lg,
    marginTop: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.5)', // Video overlay always dark
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoFooter: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDuration: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 240,
  },
  myDocument: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  otherDocument: {
    backgroundColor: colors.background.surface,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myIconBox: {
    backgroundColor: colors.background.primary,
  },
  otherIconBox: {
    backgroundColor: colors.brand.primary,
  },
  documentInfoOld: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.sm,
  },
  fileName: {
    color: colors.text.primary,
    fontWeight: "500",
    fontSize: 14,
  },
  myFileName: {
    color: colors.text.inverse,
  },
  downloadIcon: {
    padding: 4,
  },
  documentCard: {
    width: 250,
    backgroundColor: colors.background.primary,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.primary,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentCardTop: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  myDocumentTop: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  otherDocumentTop: {
    backgroundColor: colors.background.primary,
  },
  pdfIconContainer: {
    width: 40,
    height: 48,
    backgroundColor: colors.status.error,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfIconText: {
    color: colors.text.inverse,
    fontSize: 11,
    fontWeight: 'bold',
  },
  documentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  documentCardName: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentCardMeta: {
    color: colors.text.secondary,
    marginTop: 2,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    width: 240,
  },
  audioAvatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  audioMicBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.status.success,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.background.primary,
  },
  audioPlayButton: {
    marginRight: 10,
  },
  audioWaveformContainer: {
    flex: 1,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  audioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand.primary, // Or info
    marginRight: 4,
  },
  waveformBar: {
    width: 3,
    backgroundColor: colors.text.muted,
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  audioDurationText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  documentCardBottom: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border.primary,
    alignItems: 'center',
  },
  myDocumentBottom: {
    backgroundColor: 'rgba(252, 178, 125, 0.3)',
  },
  otherDocumentBottom: {
    backgroundColor: colors.background.surface,
  },
  documentActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  myActionText: {
    color: colors.brand.primary,
  },
  otherActionText: {
    color: colors.text.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullScreenVideo: {
    flex: 1,
    width: width,
    height: height,
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  pdfCloseButton: {
    marginRight: Spacing.lg,
  },
  pdfTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  pdfViewer: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: colors.background.surface,
  },
  timeOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.md,
  },
  timeText: {
    color: colors.text.inverse,
    fontSize: 11,
  },
  docTimeOverlay: {
    position: 'absolute',
    bottom: 40, // Above the bottom action bar
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  docTimeText: {
    color: colors.text.muted,
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 24,
    padding: 2,
  }
});