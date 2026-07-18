import { AppText } from "./ui/AppText";
import React from 'react';
import { View, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import { useColors } from '../design';

interface MentionPickerProps {
  query: string;
  members: any[];
  onSelect: (member: any) => void;
}

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

export default function MentionPicker({ query, members, onSelect }: MentionPickerProps) {
  const colors = useColors();

  const filtered = members
    .filter(m => {
      const name = (m.name || m.employee_name || '').toLowerCase();
      const email = (m.email || m.email_id || '').toLowerCase();
      const q = query.toLowerCase();
      return name.includes(q) || email.includes(q);
    })
    .slice(0, 6);

  if (filtered.length === 0) return null;

  return (
    <View style={[styles.container, {
      backgroundColor: colors.background.primary,
      borderColor: colors.border.primary,
      shadowColor: colors.text.primary,
    }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => (item.email || item.email_id || String(i))}
        keyboardShouldPersistTaps="always"
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          const name = item.name || item.employee_name || 'Unknown';
          const email = item.email || item.email_id || '';
          const isLast = index === filtered.length - 1;
          return (
            <TouchableOpacity
              style={[
                styles.item,
                { borderBottomColor: colors.border.primary },
                isLast && { borderBottomWidth: 0 },
              ]}
              onPress={() => onSelect({ ...item, name, email })}
              activeOpacity={0.7}
            >
              {item.profile_image_url ? (
                <Image source={{ uri: item.profile_image_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.placeholder, { backgroundColor: colors.brand.primary }]}>
                  <AppText style={styles.initials}>{getInitials(name)}</AppText>
                </View>
              )}
              <View style={styles.info}>
                <AppText style={[styles.name, { color: colors.text.primary }]} numberOfLines={1}>{name}</AppText>
                <AppText style={[styles.email, { color: colors.text.muted }]} numberOfLines={1}>{email}</AppText>
              </View>
              <AppText style={[styles.atHint, { color: colors.brand.primary }]}>@</AppText>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 1,
  },
  email: {
    fontSize: 12,
  },
  atHint: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
