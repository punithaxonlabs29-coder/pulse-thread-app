import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useColors, Spacing, Radius } from '../../design';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Hash, MoreVertical, Plus } from 'lucide-react-native';
import { router } from 'expo-router';
import { ConnectsService, SalesStageItem } from '../../services/connects.service';

export default function DealsScreen() {
  const colors = useColors();
  const [stages, setStages] = useState<SalesStageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadStages = async (isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // Primary API call for sales stages (which includes lead_count)
      let fetchedStages = await ConnectsService.getSalesStages();

      // Fallback to deal stages API if sales-stages returned empty
      if (!fetchedStages || fetchedStages.length === 0) {
        fetchedStages = await ConnectsService.getDealStages();
      }

      if (fetchedStages && fetchedStages.length > 0) {
        setStages(fetchedStages);
      }
    } catch (error) {
      console.log('Error fetching deal/sales stages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStages();
  }, []);

  const handleStagePress = (stageIndex: string, stageTitle: string) => {
    router.push({
      pathname: '/deals/[stage]',
      params: { stage: stageIndex, title: stageTitle }
    });
  };

  const filteredStages = stages.filter((s) =>
    s.sales_stage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStage = ({ item }: { item: SalesStageItem }) => (
    <Pressable
      style={({ pressed }) => [
        styles.stageRow,
        { 
          backgroundColor: pressed ? colors.background.selected : colors.background.surface,
          borderBottomColor: colors.border.primary,
        }
      ]}
      onPress={() => handleStagePress(item.sales_stage_index, item.sales_stage)}
    >
      <View style={styles.stageLeft}>
        <Hash size={18} color={colors.text.muted} />
        <AppText variant="body" style={styles.stageTitle}>
          {item.sales_stage}
        </AppText>
      </View>
      <View style={styles.stageRight}>
        {item.lead_count !== undefined && (
          <AppText variant="body" style={{ color: colors.brand.primary, fontWeight: '600' }}>
            ({item.lead_count})
          </AppText>
        )}
        <Pressable style={styles.moreButton}>
          <MoreVertical size={18} color={colors.text.muted} />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      {/* Top Header matching Chats screen */}
      <View style={styles.header}>
        <AppText variant="h1">Deals</AppText>
        <TouchableOpacity hitSlop={10}>
          <Plus size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar matching Chats screen */}
      <View style={[styles.searchContainer, { backgroundColor: colors.border.primary }]}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search Deals"
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredStages}
          keyExtractor={(item) => item.sales_stage_index}
          renderItem={renderStage}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadStages(true)}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText style={{ color: colors.text.muted }}>No stages found</AppText>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.xl,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    height: 40,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageTitle: {
    marginLeft: 12,
  },
  stageRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
});
