import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius, Shadows } from '../design';

export const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.background.overlay,
  },
  menuContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: Radius.xl, // 16
    borderTopRightRadius: Radius.xl, // 16
    padding: Spacing.xl, // 20
    paddingBottom: Spacing.xxxl, // 40 (approx)
    ...Shadows.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  option: {
    alignItems: 'center',
    width: 70,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 12,
    color: colors.text.secondary,
  }
});