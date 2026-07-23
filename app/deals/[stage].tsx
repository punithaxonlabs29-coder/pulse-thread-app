import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useColors } from '../../design';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Filter, Download, Phone, DollarSign, Tag, Calendar, UserCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConnectsService, DealLead } from '../../services/connects.service';

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

  const filteredLeads = leads.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (item.customer_name && item.customer_name.toLowerCase().includes(query)) ||
      (item.customer_mobile && item.customer_mobile.includes(query)) ||
      (item.customer_email && item.customer_email.toLowerCase().includes(query)) ||
      (item.customer_assign_lead_to_name && item.customer_assign_lead_to_name.toLowerCase().includes(query)) ||
      (item.customer_leadsource_primary && item.customer_leadsource_primary.toLowerCase().includes(query)) ||
      (item.customer_project_name && item.customer_project_name.toLowerCase().includes(query))
    );
  });

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
              <AppText variant="caption" style={{ color: colors.text.secondary, fontSize: 11 }}>
                {item.customer_leadsource_primary}
              </AppText>
            </View>
          ) : null}
        </View>

        {item.customer_mobile ? (
          <View style={styles.infoRow}>
            <Phone size={14} color={colors.text.muted} />
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
          <Tag size={14} color={colors.text.muted} />
          <AppText variant="body" style={[styles.cardText, { color: colors.text.primary }]}>
            Status : <AppText variant="body" style={{ fontWeight: '600' }}>{item.customer_sales_stage || stageTitle}</AppText>
          </AppText>
        </View>

        {item.customer_assign_lead_to_name ? (
          <View style={styles.infoRow}>
            <UserCheck size={14} color={colors.text.muted} />
            <AppText variant="body" style={[styles.cardText, { color: colors.text.secondary }]}>
              Sales Rep : <AppText variant="body" style={{ color: colors.text.primary }}>{item.customer_assign_lead_to_name}</AppText>
            </AppText>
          </View>
        ) : null}

        {item.totalvalue_of_deal ? (
          <View style={styles.infoRow}>
            <DollarSign size={14} color={colors.brand.primary} />
            <AppText variant="body" style={[styles.cardText, { color: colors.brand.primary, fontWeight: '600' }]}>
              Deal Value : {item.totalvalue_of_deal}
            </AppText>
          </View>
        ) : null}

        {item.number_of_floors || item.number_of_people ? (
          <View style={styles.infoRow}>
            <AppText variant="caption" style={{ color: colors.text.muted }}>
              {item.number_of_floors ? `Floors: ${item.number_of_floors}` : ''}
              {item.number_of_floors && item.number_of_people ? '  •  ' : ''}
              {item.number_of_people ? `People: ${item.number_of_people}` : ''}
            </AppText>
          </View>
        ) : null}

        {item.added_by_timestamp ? (
          <View style={[styles.infoRow, { marginTop: 4 }]}>
            <Calendar size={12} color={colors.text.muted} />
            <AppText variant="caption" style={{ color: colors.text.muted, fontSize: 11 }}>
              {item.added_by_timestamp}
            </AppText>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const headerTitleText = `${stageTitle} (${total > 0 ? total : leads.length})`;

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
          <TouchableOpacity hitSlop={10}>
            <Download size={22} color={colors.brand.primary} />
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10}>
            <Filter size={22} color={colors.brand.primary} />
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
              <AppText style={{ color: colors.text.muted }}>No leads found in this stage</AppText>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 14,
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
