import React, { useRef, useEffect } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  onBack: () => void;
  onCalendar: () => void;
}

export default function SearchHeader({
  value,
  onChangeText,
  onBack,
  onCalendar,
}: SearchHeaderProps) {
  const inputRef = useRef<TextInput>(null);

  // Auto-focus when the search header mounts
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.header}>
      {/* Back arrow */}
      <TouchableOpacity
        id="search-header-back-btn"
        onPress={onBack}
        style={styles.backBtn}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={24} color="#F97316" />
      </TouchableOpacity>

      {/* Search bar pill */}
      <View style={styles.searchPill}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          id="search-header-input"
          style={styles.input}
          placeholder="Search..."
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {/* Calendar / date-filter icon */}
        <TouchableOpacity
          id="search-header-calendar-btn"
          onPress={onCalendar}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: "#F9F6F0",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: {
    marginRight: 8,
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 0,
    ...Platform.select({ android: { paddingVertical: 0 } }),
  },
});
