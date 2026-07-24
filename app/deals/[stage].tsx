import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useColors } from '../../design';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Filter, Phone, DollarSign, Tag, Calendar, UserCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectsService, DealLead } from '../../services/connects.service';
import DealFilterModal from '../../components/DealFilterModal';

export default function StageDealsScreen() {
  const colors = useColors();
  const { stage, title } = useLocalSearchParams();

  const stageIndex = typeof stage === 'string' ? stage : '0';
  const stageTitle = typeof title === 'string' ? title : 'Deals';

  const [leads, setLeads] = useState<DealLead[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string[]>>({});
  const [people, setPeople] = useState<any[]>([]);

  useEffect(() => {
    ConnectsService.getPeople()
      .then((res) => {
        if (Array.isArray(res)) setPeople(res);
      })
      .catch((err) => console.log('Error fetching people for filter:', err));
  }, []);

  const dynamicOptions = React.useMemo(() => {
    const repSet = new Set<string>();

    // Extract names from fetched team members
    people.forEach((p) => {
      const name = (p.name || p.full_name || p.customer_name || '').trim();
      if (name) repSet.add(name);
    });

    // Extract sales rep names assigned on actual deal leads
    leads.forEach((l) => {
      const name = (l.customer_assign_lead_to_name || '').trim();
      if (name) repSet.add(name);
    });

    const sortedReps = Array.from(repSet).sort((a, b) => a.localeCompare(b));

    const mgrSet = new Set<string>();
    leads.forEach((l) => {
      const name = ((l as any).customer_manager_name || '').trim();
      if (name) mgrSet.add(name);
    });
    const sortedMgrs = Array.from(mgrSet).sort((a, b) => a.localeCompare(b));

    const result: Record<string, string[]> = {};
    if (sortedReps.length > 0) result.salesRep = sortedReps;
    if (sortedMgrs.length > 0) result.manager = sortedMgrs;

    return result;
  }, [people, leads]);

  const fetchLeads = useCallback(async (pageNum: number = 1, isRefresh: boolean = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await ConnectsService.getDealLeads(stageIndex, 'default', pageNum, 25);
      
      if (response && response.leads) {
        if (pageNum === 1) {
          setLeads(response.leads);
        } else {
          setLeads(prev => [...prev, ...response.leads]);
        }
        if (response.total !== undefined) {
          setTotal(response.total);
        }
      }
    } catch (error) {
      console.log('Error loading deal leads:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [stageIndex]);

  useEffect(() => {
    setPage(1);
    fetchLeads(1);
  }, [fetchLeads]);

  const handleRefresh = () => {
    setPage(1);
    fetchLeads(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && leads.length < total) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLeads(nextPage);
    }
  };

  const getDealValueNumber = (valStr?: string) => {
    if (!valStr) return 0;
    const num = Number(valStr.replace(/\D/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const filteredLeads = leads.filter((item) => {
    // 1. Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (item.customer_name && item.customer_name.toLowerCase().includes(query)) ||
        (item.customer_mobile && item.customer_mobile.includes(query)) ||
        (item.customer_email && item.customer_email.toLowerCase().includes(query)) ||
        (item.customer_assign_lead_to_name && item.customer_assign_lead_to_name.toLowerCase().includes(query)) ||
        (item.customer_leadsource_primary && item.customer_leadsource_primary.toLowerCase().includes(query)) ||
        (item.customer_project_name && item.customer_project_name.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // 2. Applied Filters
    const selectedStatuses = appliedFilters.status || [];
    const selectedDealValues = appliedFilters.dealValue || [];
    const selectedSalesReps = appliedFilters.salesRep || [];
    const selectedManagers = appliedFilters.manager || [];

    // Filter by Status
    if (selectedStatuses.length > 0) {
      const currentStatus = item.customer_sales_stage || stageTitle;
      if (!selectedStatuses.includes(currentStatus)) return false;
    }

    // Filter by Deal Value
    if (selectedDealValues.length > 0) {
      const val = getDealValueNumber(item.totalvalue_of_deal);
      const matchesValue = selectedDealValues.some((range) => {
        if (range === '0 - 5L') return val <= 5;
        if (range === '5L - 10L') return val > 5 && val <= 10;
        if (range === '10L - 20L') return val > 10 && val <= 20;
        if (range === '20L - 50L') return val > 20 && val <= 50;
        if (range === '50L+') return val > 50;
        return true;
      });
      if (!matchesValue) return false;
    }

    // Filter by Sales Rep
    if (selectedSalesReps.length > 0) {
      const repName = item.customer_assign_lead_to_name || '';
      if (!selectedSalesReps.includes(repName)) return false;
    }

    // Filter by Manager
    if (selectedManagers.length > 0) {
      const mgrName = (item as any).customer_manager_name || '';
      if (!selectedManagers.includes(mgrName)) return false;
    }

    return true;
  });

  const totalActiveFilterCount = Object.values(appliedFilters).reduce(
    (acc, arr) => acc + (arr ? arr.length : 0),
    0
  );

  const renderDealCard = ({ item }: { item: DealLead }) => {
    const displayName = item.customer_name || item.customer_project_name || 'Unnamed Lead';
    
    return (
      <Pressable
        onPress={() => {
          router.push({
            pathname: '/chat',
            params: {
              channelId: `lead-${item.customer_lead_unique_id}`,
              channelName: displayName,
              channelType: 'lead',
              leadId: item.customer_lead_unique_id,
            }
          });
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: pressed ? colors.background.selected : colors.background.surface,
            borderColor: colors.border.primary,
          }
        ]}
      >
        <View style={styles.cardHeader}>
          <AppText variant="title" style={[styles.cardTitle, { color: colors.brand.primary }]}>
            {displayName}
          </AppText>
          {item.customer_leadsource_primary ? (
            <View style={[styles.sourceBadge, { backgroundColor: colors.background.primary }]}>
              <AppText variant="caption" style={{ color: colors.text.secondary, fontSize: 12.5, fontWeight: '600' }}>
                {item.customer_leadsource_primary}
              </AppText>
            </View>
          ) : null}
        </View>

        {item.customer_mobile ? (
          <View style={styles.infoRow}>
            <Phone size={15} color={colors.text.muted} />
            <AppText variant="body" style={[styles.cardText, { color: colors.text.secondary }]}>
              {item.customer_mobile} {item.customer_email ? `• ${item.customer_email}` : ''}
            </AppText>
          </View>
        ) : item.customer_email ? (
          <View style={styles.infoRow}>
            <AppText variant="body" style={[styles.cardText, { color: colors.text.secondary }]}>
              {item.customer_email}
            </AppText>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <Tag size={15} color={colors.text.muted} />
          <AppText variant="body" style={[styles.cardText, { color: colors.text.primary }]}>
            Status : <AppText variant="body" style={{ fontWeight: '600', fontSize: 15.5 }}>{item.customer_sales_stage || stageTitle}</AppText>
          </AppText>
        </View>

        {item.customer_assign_lead_to_name ? (
          <View style={styles.infoRow}>
            <UserCheck size={15} color={colors.text.muted} />
            <AppText variant="body" style={[styles.cardText, { color: colors.text.secondary }]}>
              Sales Rep : <AppText variant="body" style={{ color: colors.text.primary, fontSize: 15.5 }}>{item.customer_assign_lead_to_name}</AppText>
            </AppText>
          </View>
        ) : null}

        {item.totalvalue_of_deal ? (
          <View style={styles.infoRow}>
            <DollarSign size={15} color={colors.brand.primary} />
            <AppText variant="body" style={[styles.cardText, { color: colors.brand.primary, fontWeight: '600', fontSize: 15.5 }]}>
              Deal Value : {item.totalvalue_of_deal}
            </AppText>
          </View>
        ) : null}

        {item.number_of_floors || item.number_of_people ? (
          <View style={styles.infoRow}>
            <AppText variant="caption" style={{ color: colors.text.muted, fontSize: 13 }}>
              {item.number_of_floors ? `Floors: ${item.number_of_floors}` : ''}
              {item.number_of_floors && item.number_of_people ? '  •  ' : ''}
              {item.number_of_people ? `People: ${item.number_of_people}` : ''}
            </AppText>
          </View>
        ) : null}

        {item.added_by_timestamp ? (
          <View style={[styles.infoRow, { marginTop: 4 }]}>
            <Calendar size={13} color={colors.text.muted} />
            <AppText variant="caption" style={{ color: colors.text.muted, fontSize: 12.5 }}>
              {item.added_by_timestamp}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const headerTitleText = `${stageTitle} (${filteredLeads.length})`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header matching app top-level header design */}
      <View style={styles.header}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <AppText variant="h1">{headerTitleText}</AppText>
        </View>

        <View style={styles.headerRightRow}>
          <TouchableOpacity hitSlop={10} onPress={() => setIsFilterModalOpen(true)} style={styles.filterBtnWrapper}>
            <Filter size={22} color={totalActiveFilterCount > 0 ? colors.brand.primary : colors.text.primary} />
            {totalActiveFilterCount > 0 && (
              <View style={[styles.badgeContainer, { backgroundColor: colors.brand.primary }]}>
                <AppText variant="caption" style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                  {totalActiveFilterCount}
                </AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar matching Chats & Deals tab search bar design */}
      <View style={[styles.searchContainer, { backgroundColor: colors.border.primary }]}>
        <Ionicons name="search" size={20} color={colors.text.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder="Search Leads"
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Active Filter Chips Bar */}
      {totalActiveFilterCount > 0 && (
        <View style={styles.activeFilterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFilterContent}>
            {Object.entries(appliedFilters).map(([catKey, values]) =>
              values.map((val) => (
                <TouchableOpacity
                  key={`${catKey}-${val}`}
                  style={[styles.chip, { backgroundColor: colors.background.surface, borderColor: colors.brand.primary }]}
                  onPress={() => {
                    const updated = (appliedFilters[catKey] || []).filter((v) => v !== val);
                    const newFilters = { ...appliedFilters, [catKey]: updated };
                    if (updated.length === 0) delete newFilters[catKey];
                    setAppliedFilters(newFilters);
                  }}
                >
                  <AppText variant="caption" style={{ color: colors.brand.primary, fontSize: 13, fontWeight: '600' }}>
                    {val}
                  </AppText>
                  <Ionicons name="close-circle" size={15} color={colors.brand.primary} />
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.clearAllChipsBtn} onPress={() => setAppliedFilters({})}>
              <AppText variant="caption" style={{ color: colors.text.muted, fontSize: 13, fontWeight: '600' }}>
                Clear All
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => item.customer_lead_unique_id}
          renderItem={renderDealCard}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
              colors={[colors.brand.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppText style={{ color: colors.text.muted, fontSize: 15 }}>No leads found in this stage</AppText>
            </View>
          }
        />
      )}

      {/* Filter Modal Component */}
      <DealFilterModal
        visible={isFilterModalOpen}
        appliedFilters={appliedFilters}
        dynamicOptions={dynamicOptions}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={(filters) => setAppliedFilters(filters)}
        onClear={() => setAppliedFilters({})}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterBtnWrapper: {
    position: 'relative',
    padding: 2,
  },
  badgeContainer: {
    position: 'absolute',
    top: -4,
    right: -6,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 42,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 17,
  },
  activeFilterContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  activeFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  clearAllChipsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  sourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardText: {
    fontSize: 15.5,
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
