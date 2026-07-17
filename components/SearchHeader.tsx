import React, { useRef, useEffect, useMemo } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "./SearchHeader.styles";
import { useColors } from "../design";

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
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <Ionicons name="arrow-back" size={24} color={colors.brand.primary} />
      </TouchableOpacity>

      {/* Search bar pill */}
      <View style={styles.searchPill}>
        <Ionicons name="search-outline" size={18} color={colors.text.muted} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          id="search-header-input"
          style={styles.input}
          placeholder="Search..."
          placeholderTextColor={colors.text.muted}
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
          <Ionicons name="calendar-outline" size={20} color={colors.text.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
