import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiService } from '../../services/ApiService';
import { Shipment } from '../../types';
import { useTheme } from '@/hooks/use-theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useDemoMode } from '../../context/DemoModeContext';

export default function DashboardScreen() {
  const [activeShipment, setActiveShipment] = useState<Shipment | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const router = useRouter();
  const { isDemoMode } = useDemoMode();

  const loadData = async () => {
    try {
      const shipments = await ApiService.getShipments(isDemoMode);
      // Find an active one (prefer TEST_LIVE_001, then UX-1024)
      const active = shipments.find(s => s.shipment_id === 'TEST_LIVE_001' || s.shipment_id === 'UX-1024' || s.shipment_id === 'UX-1027') || shipments[0];
      
      if (active) {
        // Fetch live data immediately for the active shipment
        const liveData = await ApiService.getShipmentLive(active.shipment_id, isDemoMode);
        if (liveData) {
          active.sensors = liveData;
        }
      }
      setActiveShipment(active);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  useEffect(() => {
    if (!activeShipment) return;
    const pollId = setInterval(async () => {
      const liveData = await ApiService.getShipmentLive(activeShipment.shipment_id, isDemoMode);
      if (liveData) {
        setActiveShipment(prev => prev ? { ...prev, sensors: liveData } : prev);
      }
    }, 3000);
    return () => clearInterval(pollId);
  }, [activeShipment?.shipment_id, isDemoMode]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
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

  if (!activeShipment) return <View style={[styles.container, { backgroundColor: theme.background }]} />;

  const statusColor = getStatusColor(activeShipment.status.classification);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: theme.textSecondary }]}>UNIFY-X Dashboard</Text>
        <Text style={[styles.mainTitle, { color: theme.text }]}>Active Transport</Text>
      </View>

      <TouchableOpacity 
        style={[styles.mainCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        onPress={() => router.push(`/shipment/${activeShipment.shipment_id}` as any)}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.productName, { color: theme.text }]}>{activeShipment.product.name}</Text>
            <Text style={[styles.shipmentId, { color: theme.textSecondary }]}>#{activeShipment.shipment_id}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{activeShipment.status.classification}</Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.routeText, { color: theme.text }]}>
            {activeShipment.transport.origin} → {activeShipment.transport.destination}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.metricBox, { backgroundColor: theme.background }]}>
            <MaterialCommunityIcons name="thermometer" size={20} color={theme.textSecondary} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{activeShipment.sensors.temperature.toFixed(1)}°C</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Temperature</Text>
          </View>
          <View style={[styles.metricBox, { backgroundColor: theme.background }]}>
            <MaterialCommunityIcons name="water-percent" size={20} color={theme.textSecondary} />
            <Text style={[styles.metricValue, { color: theme.text }]}>{activeShipment.sensors.humidity.toFixed(1)}%</Text>
            <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Humidity</Text>
          </View>
        </View>
        
        <View style={styles.actionPrompt}>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Tap to view live data and charts →</Text>
        </View>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  mainTitle: { fontSize: 28, fontWeight: 'bold' },
  mainCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  productName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  shipmentId: { fontSize: 14, fontFamily: 'monospace' },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  routeText: { fontSize: 16, fontWeight: '500' },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  metricValue: { fontSize: 20, fontWeight: 'bold', marginTop: 8, marginBottom: 2 },
  metricLabel: { fontSize: 12 },
  actionPrompt: {
    marginTop: 20,
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  }
});
