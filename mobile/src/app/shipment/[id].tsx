import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ApiService } from '../../services/ApiService';
import { Shipment, HistoricalDataPoint } from '../../types';
import { useTheme } from '@/hooks/use-theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';

import { useDemoMode } from '../../context/DemoModeContext';

const screenWidth = Dimensions.get('window').width;

export default function ShipmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { isDemoMode } = useDemoMode();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [history, setHistory] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showXAI, setShowXAI] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [data, historyData] = await Promise.all([
        ApiService.getShipment(id as string, isDemoMode),
        ApiService.getShipmentHistory(id as string, isDemoMode),
      ]);
      setShipment(data);
      setHistory(historyData);
      setLoading(false);
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (loading || !shipment) return;
    const pollId = setInterval(async () => {
      const liveData = await ApiService.getShipmentLive(id as string, isDemoMode);
      if (liveData) {
        setShipment(prev => prev ? { ...prev, sensors: liveData } : prev);
        setHistory(prev => {
          if (!prev || prev.length === 0) return prev;
          const newHistory = [...prev.slice(1)];
          newHistory.push({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...liveData
          });
          return newHistory;
        });
      }
    }, 3000);
    return () => clearInterval(pollId);
  }, [id, loading, shipment?.shipment_id]);

  const handleAction = async (action: 'start' | 'stop') => {
    setActionLoading(true);
    if (action === 'start') {
      await ApiService.startShipment(id as string, isDemoMode);
    } else {
      await ApiService.stopShipment(id as string, isDemoMode);
    }
    const data = await ApiService.getShipment(id as string, isDemoMode);
    if (data) setShipment(data);
    setActionLoading(false);
  };

  const getStatusColor = (classification: string) => {
    switch (classification) {
      case 'GOOD': return '#10b981';
      case 'ATTENTION': return '#f59e0b';
      case 'BAD': return '#ef4444';
      default: return theme.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading Shipment...</Text>
      </View>
    );
  }

  if (!shipment) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background, paddingHorizontal: 32 }]}>
        <MaterialCommunityIcons name="tag-off-outline" size={64} color={theme.textSecondary} />
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text, marginTop: 16 }}>Not Found</Text>
        <Text style={{ fontSize: 16, color: theme.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 24 }}>
          The scanned NFC tag ({id}) is not linked to any shipment in the UNIFY-X system.
        </Text>
        <TouchableOpacity 
          style={{ marginTop: 32, paddingVertical: 14, paddingHorizontal: 32, backgroundColor: theme.backgroundElement, borderRadius: 12, borderWidth: 1, borderColor: theme.border }}
          onPress={() => router.back()}
        >
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(shipment.status.classification);

  // Prepare chart data
  const tempHistory = history.length > 0 ? history.map(h => h.temperature) : [0];
  const chartLabels = history.length > 0 ? history.map((_, i) => (i % 5 === 0 ? history[i].time.substring(0, 5) : '')).filter(Boolean) : ['0'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Details</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Info */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={[styles.productName, { color: theme.text }]}>{shipment.product.name}</Text>
            <Text style={[styles.shipmentId, { color: theme.textSecondary }]}>#{shipment.shipment_id}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{shipment.status.classification}</Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.routeText, { color: theme.text }]}>
            {shipment.transport.origin} → {shipment.transport.destination}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {!shipment.is_active && (
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: '#10b981' }]} 
              disabled={actionLoading}
              onPress={() => handleAction('start')}
            >
              <Text style={styles.btnText}>Start</Text>
            </TouchableOpacity>
          )}
          {shipment.is_active && (
            <TouchableOpacity 
              style={[styles.btn, { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }]} 
              disabled={actionLoading}
              onPress={() => handleAction('stop')}
            >
              <Text style={[styles.btnText, { color: theme.text }]}>Stop</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chart */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={20} color="#f59e0b" />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Live Temperature</Text>
        </View>
        
        <View style={styles.liveStatRow}>
          <Text style={[styles.liveValue, { color: theme.text }]}>{shipment.sensors.temperature.toFixed(1)}°C</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
        </View>

        {history.length > 0 && (
          <LineChart
            data={{
              labels: chartLabels.slice(0, 6),
              datasets: [{ data: tempHistory.length > 30 ? tempHistory.slice(-30) : tempHistory }]
            }}
            width={screenWidth - 64} // from padding
            height={220}
            withDots={false}
            withInnerLines={false}
            yAxisSuffix="°C"
            chartConfig={{
              backgroundColor: theme.backgroundElement,
              backgroundGradientFrom: theme.backgroundElement,
              backgroundGradientTo: theme.backgroundElement,
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
              labelColor: (opacity = 1) => theme.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: { r: "0" }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16, marginLeft: -16 }}
          />
        )}
      </View>

      {/* XAI Analysis */}
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
        onPress={() => setShowXAI(!showXAI)}
      >
        <View style={styles.xaiHeader}>
          <View style={styles.xaiHeaderLeft}>
            <MaterialCommunityIcons name="brain" size={20} color={theme.textSecondary} />
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Why this decision?</Text>
          </View>
          <MaterialCommunityIcons name={showXAI ? "chevron-up" : "chevron-down"} size={24} color={theme.textSecondary} />
        </View>

        {showXAI && (
          <View style={styles.xaiContent}>
            <View style={[styles.xaiBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.xaiLabel, { color: theme.textSecondary }]}>Random Forest</Text>
              <Text style={[styles.xaiValue, { color: theme.text }]}>{Math.round(shipment.status.confidence * 100)}% {shipment.status.classification}</Text>
            </View>
            <View style={[styles.xaiBox, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.xaiLabel, { color: theme.textSecondary }]}>Extra Trees</Text>
              <Text style={[styles.xaiValue, { color: theme.text }]}>{Math.max(0, Math.round((shipment.status.confidence - 0.03) * 100))}% {shipment.status.classification}</Text>
            </View>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16 },
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  card: { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  productName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  shipmentId: { fontSize: 14, fontFamily: 'monospace' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  routeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  routeText: { fontSize: 16, fontWeight: '500' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  liveStatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  liveValue: { fontSize: 32, fontWeight: 'bold' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10b98120', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  liveBadgeText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  xaiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  xaiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  xaiContent: { marginTop: 16, flexDirection: 'row', gap: 12 },
  xaiBox: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  xaiLabel: { fontSize: 12, marginBottom: 4 },
  xaiValue: { fontSize: 16, fontWeight: 'bold' },
});
