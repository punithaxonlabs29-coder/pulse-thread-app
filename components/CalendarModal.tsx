import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, Colors, Radius, Shadows, Spacing } from '../design';
import { AppText } from './ui/AppText';

interface CalendarModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (date: Date) => void;
  initialDate?: Date;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarModal({
  visible,
  onDismiss,
  onConfirm,
  initialDate,
}: CalendarModalProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(initialDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate?.getMonth() ?? today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate ?? today);

  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }, [viewMonth]);

  const handleDayPress = (day: number) => {
    setSelectedDate(new Date(viewYear, viewMonth, day));
  };

  const handleOK = () => {
    onConfirm(selectedDate);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow   = getFirstDayOfWeek(viewYear, viewMonth);

  // Build calendar grid — empty slots before the 1st
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  const selDay   = selectedDate.getDate();
  const selMonth = selectedDate.getMonth();
  const selYear  = selectedDate.getFullYear();

  const todayDay   = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear  = today.getFullYear();

  const isSelected = (day: number) =>
    day === selDay && viewMonth === selMonth && viewYear === selYear;

  const isToday = (day: number) =>
    day === todayDay && viewMonth === todayMonth && viewYear === todayYear;

  // Header display
  const headerDayName  = DAY_NAMES[selectedDate.getDay()];
  const headerDay      = selectedDate.getDate();
  const headerMonthAbb = MONTHS[selectedDate.getMonth()].slice(0, 3);
  const headerYear     = selectedDate.getFullYear();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={() => {}}>

          {/* ── Top header: year + full date ── */}
          <View style={styles.cardHeader}>
            <AppText style={styles.headerYear}>{headerYear}</AppText>
            <AppText style={styles.headerDate}>
              {headerDayName}, {headerDay} {headerMonthAbb}
            </AppText>
          </View>

          {/* ── Month navigation ── */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={22} color={colors.brand.primary} />
            </TouchableOpacity>
            <AppText style={styles.monthTitle}>
              {MONTHS[viewMonth]} {viewYear}
            </AppText>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-forward" size={22} color={colors.brand.primary} />
            </TouchableOpacity>
          </View>

          {/* ── Day-of-week header ── */}
          <View style={styles.dowRow}>
            {DAYS.map((d, i) => (
              <AppText key={i} style={styles.dowLabel}>{d}</AppText>
            ))}
          </View>

          {/* ── Calendar grid ── */}
          <View style={styles.grid}>
            {cells.map((day, idx) => {
              if (day === null) {
                return <View key={`e-${idx}`} style={styles.cell} />;
              }
              const sel = isSelected(day);
              const tod = isToday(day) && !sel;
              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  style={styles.cell}
                  onPress={() => handleDayPress(day)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.dayCircle,
                    sel && styles.selectedCircle,
                  ]}>
                    <AppText style={[
                      styles.dayText,
                      sel && styles.selectedDayText,
                      tod && styles.todayText,
                    ]}>
                      {day}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Divider + buttons ── */}
          <View style={styles.divider} />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onDismiss}>
              <AppText style={styles.actionText}>Cancel</AppText>
            </TouchableOpacity>
            <View style={styles.actionSep} />
            <TouchableOpacity style={styles.actionBtn} onPress={handleOK}>
              <AppText style={styles.actionText}>OK</AppText>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL_SIZE = 40;

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.background.primary,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },

  // Header
  cardHeader: {
    backgroundColor: colors.brand.primaryLight,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  headerYear: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.brand.primary,
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },

  // Day-of-week row
  dowRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: 4,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.muted,
    textTransform: 'uppercase',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: colors.brand.primary,
  },
  dayText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '400',
  },
  selectedDayText: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  todayText: {
    color: colors.brand.primary,
    fontWeight: '700',
  },

  // Footer
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.primary,
  },
  actions: {
    flexDirection: 'row',
    height: 52,
  },
  actionBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionSep: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.primary,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.brand.primary,
  },
});
