import React from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { AppText } from '../../components/ui/AppText';
import { useColors } from '../../design';
import { SafeAreaView } from 'react-native-safe-area-context';
import InputField from '../../components/Input/InputField';
import { Hash, MoreVertical, Plus } from 'lucide-react-native';
import { router } from 'expo-router';

const DEAL_STAGES = [
  { id: 'new_lead', title: 'New Lead', count: 4 },
  { id: 'hot', title: 'Hot', count: 13 },
  { id: 'warm', title: 'Warm', count: 12 },
  { id: 'cold', title: 'Cold', count: 46 },
  { id: 'no_closure', title: 'No Closure', count: 9 },
  { id: 'lost', title: 'Lost', count: 7 },
];

export default function DealsScreen() {
  const colors = useColors();

  const handleStagePress = (stageId: string, stageTitle: string) => {
    router.push({
      pathname: '/deals/[stage]',
      params: { stage: stageId, title: stageTitle }
    });
  };

  const renderStage = ({ item }: { item: typeof DEAL_STAGES[0] }) => (
    <Pressable
      style={({ pressed }) => [
        styles.stageRow,
        { backgroundColor: pressed ? colors.background.muted : colors.background.surface }
      ]}
      onPress={() => handleStagePress(item.id, item.title)}
    >
      <View style={styles.stageLeft}>
        <Hash size={18} color={colors.text.muted} />
        <AppText variant="body" style={styles.stageTitle}>
          {item.title}
        </AppText>
      </View>
      <View style={styles.stageRight}>
        <AppText variant="body" style={{ color: colors.brand.primary, fontWeight: '600' }}>
          ({item.count})
        </AppText>
        <Pressable style={styles.moreButton}>
          <MoreVertical size={18} color={colors.text.muted} />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.surface }]} edges={['top']}>
      <View style={styles.header}>
        <InputField placeholder="Search Deals" icon="search" />
      </View>

      <View style={styles.sectionHeader}>
        <AppText variant="title" style={{ color: colors.text.secondary }}>Deals</AppText>
        <Pressable>
          <Plus size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      <FlatList
        data={DEAL_STAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderStage}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  }
});
