import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiService } from '../../services/ApiService';
import { Shipment } from '../../types';
import { useTheme } from '@/hooks/use-theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ShipmentsScreen() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const loadShipments = async () => {
    try {
      const data = await ApiService.getShipments(true); // default true demo mode
      setShipments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadShipments();
    setRefreshing(false);
  };

  const getStatusColor = (classification: string) => {
    switch (classification) {
      case 'GOOD': return '#10b981';
      case 'ATTENTION': return '#f59e0b';
      case 'BAD': return '#ef4444';
      default: return theme.textSecondary;
    }
  };

  const renderItem = ({ item }: { item: Shipment }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
      onPress={() => router.push(`/shipment/${item.shipment_id}` as any)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>{item.product.name}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>#{item.shipment_id}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status.classification) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status.classification) }]}>
            {item.status.classification}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.routeContainer}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.routeText, { color: theme.textSecondary }]}>
            {item.transport.origin} → {item.transport.destination}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={shipments}
        renderItem={renderItem}
        keyExtractor={item => item.shipment_id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginTop: 8,
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    fontSize: 14,
  },
});
