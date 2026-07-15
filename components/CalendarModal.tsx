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
            <Text style={styles.headerYear}>{headerYear}</Text>
            <Text style={styles.headerDate}>
              {headerDayName}, {headerDay} {headerMonthAbb}
            </Text>
          </View>

          {/* ── Month navigation ── */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={22} color="#F97316" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-forward" size={22} color="#F97316" />
            </TouchableOpacity>
          </View>

          {/* ── Day-of-week header ── */}
          <View style={styles.dowRow}>
            {DAYS.map((d, i) => (
              <Text key={i} style={styles.dowLabel}>{d}</Text>
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
                    <Text style={[
                      styles.dayText,
                      sel && styles.selectedDayText,
                      tod && styles.todayText,
                    ]}>
                      {day}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Divider + buttons ── */}
          <View style={styles.divider} />
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={onDismiss}>
              <Text style={styles.actionText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.actionSep} />
            <TouchableOpacity style={styles.actionBtn} onPress={handleOK}>
              <Text style={styles.actionText}>OK</Text>
            </TouchableOpacity>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },

  // Header
  cardHeader: {
    backgroundColor: '#FFF7ED',
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  headerYear: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F97316',
    marginBottom: 2,
  },
  headerDate: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  // Day-of-week row
  dowRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  dowLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 12,
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
    borderRadius: CELL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    backgroundColor: '#F97316',
  },
  dayText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '400',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayText: {
    color: '#F97316',
    fontWeight: '700',
  },

  // Footer
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
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
    backgroundColor: '#E5E7EB',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F97316',
  },
});
