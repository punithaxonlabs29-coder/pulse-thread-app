import { StyleSheet, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  videoContainer: {
    width: 240,
    height: 180,
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoFooter: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoDuration: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 240,
  },
  myDocument: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  otherDocument: {
    backgroundColor: '#F3F4F6',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myIconBox: {
    backgroundColor: '#FFFFFF',
  },
  otherIconBox: {
    backgroundColor: '#F97316',
  },
  documentInfoOld: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  fileName: {
    color: "#1F2937",
    fontWeight: "500",
    fontSize: 14,
  },
  myFileName: {
    color: "#FFFFFF",
  },
  downloadIcon: {
    padding: 4,
  },
  documentCard: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  myDocumentTop: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  otherDocumentTop: {
    backgroundColor: '#FFFFFF',
  },
  pdfIconContainer: {
    width: 40,
    height: 48,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfIconText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  documentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  documentCardName: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  documentCardMeta: {
    color: "#6B7280",
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
    backgroundColor: '#10B981',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DCF8C6',
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
    backgroundColor: '#3B82F6',
    marginRight: 4,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#9CA3AF',
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
  audioDurationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  documentCardBottom: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  myDocumentBottom: {
    backgroundColor: 'rgba(252, 178, 125, 0.3)',
  },
  otherDocumentBottom: {
    backgroundColor: '#F9FAFB',
  },
  documentActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  myActionText: {
    color: '#C2410C',
  },
  otherActionText: {
    color: '#374151',
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pdfCloseButton: {
    marginRight: 16,
  },
  pdfTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pdfViewer: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#F3F4F6',
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
    borderRadius: 10,
  },
  timeText: {
    color: '#FFFFFF',
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
    color: '#8696A0',
    fontSize: 11,
  },
  tickIcon: {
    marginLeft: 2,
  }
});