import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { ApiService } from '../../services/ApiService';
import { Alert } from '../../types';
import { useTheme } from '@/hooks/use-theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const loadAlerts = async () => {
    try {
      const data = await ApiService.getAlerts(true);
      setAlerts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  const getAlertConfig = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return { color: '#ef4444', icon: 'alert-circle' as const };
      case 'WARNING': return { color: '#f59e0b', icon: 'alert' as const };
      case 'RESOLVED': return { color: '#10b981', icon: 'check-circle' as const };
      default: return { color: theme.textSecondary, icon: 'information' as const };
    }
  };

  const renderItem = ({ item }: { item: Alert }) => {
    const config = getAlertConfig(item.severity);
    return (
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name={config.icon} size={20} color={config.color} />
            <Text style={[styles.severityText, { color: config.color }]}>{item.severity}</Text>
          </View>
          <Text style={[styles.timeText, { color: theme.textSecondary }]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={[styles.message, { color: theme.text }]}>{item.message}</Text>
        <Text style={[styles.shipmentId, { color: theme.textSecondary }]}>Shipment #{item.shipment_id}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={alerts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContainer: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
  },
  message: {
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 22,
  },
  shipmentId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
