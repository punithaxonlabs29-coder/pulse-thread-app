import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from "react-native";
import { AppText } from "./ui/AppText";
import { useColors, Spacing, Radius } from "../design";
import { Ionicons } from "@expo/vector-icons";
import {
  DEAL_FILTER_CATEGORIES,
  DEAL_FILTER_OPTIONS,
} from "../constants/filterConstants";

interface DealFilterModalProps {
  visible: boolean;
  appliedFilters: Record<string, string[]>;
  dynamicOptions?: Record<string, string[]>;
  onClose: () => void;
  onApply: (filters: Record<string, string[]>) => void;
  onClear: () => void;
}

export default function DealFilterModal({
  visible,
  appliedFilters,
  dynamicOptions,
  onClose,
  onApply,
  onClear,
}: DealFilterModalProps) {
  const colors = useColors();
  const [activeCategoryKey, setActiveCategoryKey] = useState<string>("status");
  const [draftFilters, setDraftFilters] = useState<Record<string, string[]>>(appliedFilters);

  useEffect(() => {
    if (visible) {
      setDraftFilters(appliedFilters || {});
    }
  }, [visible, appliedFilters]);

  if (!visible) return null;

  const activeCategoryObj =
    DEAL_FILTER_CATEGORIES.find((cat) => cat.key === activeCategoryKey) ||
    DEAL_FILTER_CATEGORIES[0];

  const currentCategoryOptions =
    dynamicOptions && dynamicOptions[activeCategoryKey] && dynamicOptions[activeCategoryKey].length > 0
      ? dynamicOptions[activeCategoryKey]
      : (DEAL_FILTER_OPTIONS[activeCategoryKey] || []);

  const toggleOption = (categoryKey: string, value: string) => {
    setDraftFilters((prev) => {
      const currentSelected = prev[categoryKey] || [];
      const exists = currentSelected.includes(value);
      let updated: string[];
      if (exists) {
        updated = currentSelected.filter((v) => v !== value);
      } else {
        updated = [...currentSelected, value];
      }
      return {
        ...prev,
        [categoryKey]: updated,
      };
    });
  };

  const handleApply = () => {
    onApply(draftFilters);
    onClose();
  };

  const handleClearAll = () => {
    setDraftFilters({});
    onClear();
  };

  // Count total selected filter options across all categories
  const totalSelectedCount = Object.values(draftFilters).reduce(
    (acc, arr) => acc + (arr ? arr.length : 0),
    0
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        
        <View style={[styles.dialog, { backgroundColor: colors.background.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border.primary }]}>
            <View style={styles.headerLeft}>
              <AppText variant="h2" style={{ color: colors.text.primary, fontSize: 18, fontWeight: "700" }}>
                Filter
              </AppText>
              {totalSelectedCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.brand.primary }]}>
                  <AppText variant="caption" style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "700" }}>
                    {totalSelectedCount}
                  </AppText>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* 2-Column Body */}
          <View style={styles.bodyContainer}>
            {/* Left Category List */}
            <View style={[styles.sidebar, { borderRightColor: colors.border.primary, backgroundColor: colors.background.primary }]}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {DEAL_FILTER_CATEGORIES.map((cat) => {
                  const isActive = cat.key === activeCategoryKey;
                  const catSelectedCount = (draftFilters[cat.key] || []).length;

                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.categoryItem,
                        isActive && [
                          styles.categoryItemActive,
                          { backgroundColor: colors.background.surface },
                        ],
                      ]}
                      onPress={() => setActiveCategoryKey(cat.key)}
                    >
                      <View style={styles.categoryItemTextRow}>
                        <AppText
                          variant="body"
                          style={[
                            styles.categoryText,
                            {
                              color: isActive ? colors.brand.primary : colors.text.primary,
                              fontWeight: isActive ? "700" : "500",
                            },
                          ]}
                        >
                          {cat.label}
                        </AppText>
                        {catSelectedCount > 0 && (
                          <View style={[styles.miniBadge, { backgroundColor: colors.brand.primary }]}>
                            <AppText variant="caption" style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
                              {catSelectedCount}
                            </AppText>
                          </View>
                        )}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={isActive ? colors.brand.primary : colors.text.muted}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Right Options List */}
            <View style={styles.optionsPanel}>
              <AppText variant="body" style={[styles.optionsTitle, { color: colors.text.primary }]}>
                {activeCategoryObj.label}
              </AppText>
              
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.optionsListContent}>
                {currentCategoryOptions.map((opt) => {
                  const isSelected = (draftFilters[activeCategoryKey] || []).includes(opt);

                  return (
                    <TouchableOpacity
                      key={opt}
                      style={styles.optionRow}
                      onPress={() => toggleOption(activeCategoryKey, opt)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: isSelected ? colors.brand.primary : colors.border.primary },
                          isSelected && { backgroundColor: colors.brand.primary },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                      <AppText variant="body" style={[styles.optionText, { color: colors.text.primary }]}>
                        {opt}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border.primary }]}>
            <TouchableOpacity
              style={[styles.applyBtn, { backgroundColor: colors.brand.primary }]}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <AppText variant="body" style={styles.applyBtnText}>
                Apply Filters
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
              <AppText variant="body" style={[styles.clearBtnText, { color: colors.brand.primary }]}>
                Clear All
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  dialog: {
    width: "95%",
    maxHeight: "82%",
    borderRadius: Radius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  closeBtn: {
    padding: 4,
  },
  bodyContainer: {
    flexDirection: "row",
    height: 340,
  },
  sidebar: {
    width: "42%",
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0, 0, 0, 0.05)",
  },
  categoryItemActive: {
    borderLeftWidth: 3,
    borderLeftColor: "#F97316",
  },
  categoryItemTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  categoryText: {
    fontSize: 14.5,
  },
  miniBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  optionsPanel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  optionsListContent: {
    paddingBottom: 16,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  optionText: {
    fontSize: 15.5,
    fontWeight: "500",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    alignItems: "center",
  },
  applyBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  applyBtnText: {
    color: "#FFFFFF",
    fontSize: 16.5,
    fontWeight: "700",
  },
  clearBtn: {
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
