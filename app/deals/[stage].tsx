import React from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useColors } from '../../design';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import InputField from '../../components/Input/InputField';
import { ChevronLeft, Filter, Download } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const DUMMY_DEALS = [
  {
    id: '1',
    company: 'Orbit Digital',
    contact: 'Sunil Pal',
    status: 'New Lead',
    salesRep: 'Karan',
    value: '5L',
  },
  {
    id: '2',
    company: 'Vriksha Foods',
    contact: 'Sowndarya HS',
    status: 'New Lead',
    salesRep: 'Rajit Kumar',
    value: '4L',
  }
];

export default function StageDealsScreen() {
  const colors = useColors();
  const { stage, title } = useLocalSearchParams();

  const stageTitle = typeof title === 'string' ? title : 'Deals';

  const renderDealCard = ({ item }: { item: typeof DUMMY_DEALS[0] }) => (
    <Pressable
      onPress={() => {
        router.push({
          pathname: '/chat',
          params: {
            channelId: `dummy-deal-${item.id}`,
            channelName: `${item.company} Chat`,
            channelType: 'channel',
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
      <AppText variant="title" style={[styles.cardTitle, { color: colors.brand.primary }]}>
        {item.company}
      </AppText>
      <AppText variant="body" style={styles.cardText}>{item.contact}</AppText>
      <AppText variant="body" style={styles.cardText}>Status : {item.status}</AppText>
      <AppText variant="body" style={styles.cardText}>Sales Rep : {item.salesRep}</AppText>
      <AppText variant="body" style={styles.cardText}>Deal Value : {item.value}</AppText>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['bottom']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: `${stageTitle} (${DUMMY_DEALS.length})`,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginRight: 16 }}>
              <ChevronLeft size={24} color={colors.text.primary} />
            </Pressable>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <Pressable>
                <Download size={20} color={colors.brand.primary} />
              </Pressable>
              <Pressable>
                <Filter size={20} color={colors.brand.primary} />
              </Pressable>
            </View>
          ),
          headerStyle: {
            backgroundColor: colors.background.surface,
          },
          headerTitleStyle: {
            color: colors.text.primary,
            fontSize: 18,
            fontWeight: '600',
          },
          headerShadowVisible: false,
        }} 
      />

      <View style={styles.searchContainer}>
        <InputField placeholder="Search" icon="search" />
      </View>

      <FlatList
        data={DUMMY_DEALS}
        keyExtractor={(item) => item.id}
        renderItem={renderDealCard}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
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
  cardTitle: {
    marginBottom: 8,
  },
  cardText: {
    marginBottom: 4,
  }
});
