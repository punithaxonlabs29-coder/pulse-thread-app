import { StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../design';

const { width } = Dimensions.get('window');
const CELL = (width - 4) / 3;

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.surface },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.primary,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text.primary },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.primary,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: { fontSize: 15, fontWeight: '500', color: colors.text.secondary },
  tabLabelActive: { color: colors.brand.primary, fontWeight: '700' },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2.5,
    backgroundColor: colors.brand.primary,
    borderRadius: 2,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // Section header
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.text.muted,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },

  // Grid
  grid: { paddingHorizontal: 1 },
  gridRow: { flexDirection: 'row', marginBottom: 2 },
  cell: {
    width: CELL,
    height: CELL,
    marginHorizontal: 1,
    backgroundColor: colors.background.surface,
    overflow: 'hidden',
    borderRadius: 6,
  },
  cellImage: { width: '100%', height: '100%' },

  // Video overlay
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  durationText: { fontSize: 11, color: colors.text.inverse, fontWeight: '600' },

  // Doc cell (in 3-col grid)
  docCell: { backgroundColor: colors.background.primary, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border.primary },
  docPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 8 },
  docIconBig: { width: 48, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  docCellName: { fontSize: 10, color: colors.text.primary, fontWeight: '600', textAlign: 'center' },
  docCellFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  docCellFileName: { fontSize: 9, fontWeight: '700', color: colors.text.primary },
  docCellMeta: { fontSize: 8, color: colors.text.muted },

  // Doc list row
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background.surface,
  },
  docRowInfo: { flex: 1, marginLeft: 12 },
  docRowName: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  docRowMeta: { fontSize: 12, color: colors.text.muted, marginTop: 2 },
  docRowDate: { fontSize: 11, color: colors.text.muted },

  // Link row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.background.surface,
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.brand.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkInfo: { flex: 1, marginLeft: 12 },
  linkTitle: { fontSize: 14, fontWeight: '600', color: colors.text.primary },
  linkDomain: { fontSize: 12, color: colors.text.muted, marginTop: 2 },

  // Empty state
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: colors.text.muted },
});
