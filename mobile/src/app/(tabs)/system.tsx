import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { ApiService } from '../../services/ApiService';
import { SystemStatus } from '../../types';
import { useTheme } from '@/hooks/use-theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SystemScreen() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();

  const loadStatus = async () => {
    try {
      const data = await ApiService.getSystemStatus(true);
      setStatus(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatus();
    setRefreshing(false);
  };

  if (!status) return <View style={[styles.container, { backgroundColor: theme.background }]} />;

  const StatusIndicator = ({ isOnline }: { isOnline: boolean }) => (
    <View style={styles.indicatorContainer}>
      <View style={[styles.indicator, { backgroundColor: isOnline ? '#10b981' : '#ef4444' }]} />
      <Text style={[styles.indicatorText, { color: isOnline ? '#10b981' : '#ef4444' }]}>
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </Text>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
    >
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Core Infrastructure</Text>
        
        <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="raspberry-pi" size={24} color={theme.text} />
            <Text style={[styles.rowText, { color: theme.text }]}>Raspberry Pi Gateway</Text>
          </View>
          <StatusIndicator isOnline={status.raspberry_pi === 'online'} />
        </View>

        <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="api" size={24} color={theme.text} />
            <Text style={[styles.rowText, { color: theme.text }]}>API Services</Text>
          </View>
          <StatusIndicator isOnline={status.api === 'online'} />
        </View>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <MaterialCommunityIcons name="brain" size={24} color={theme.text} />
            <Text style={[styles.rowText, { color: theme.text }]}>ML Engine (XAI)</Text>
          </View>
          <StatusIndicator isOnline={status.ml_engine === 'online'} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border, marginTop: 16 }]}>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Hardware Nodes</Text>
        
        {status.nodes.map((node, index) => (
          <View 
            key={node.id} 
            style={[
              styles.row, 
              index < status.nodes.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }
            ]}
          >
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="cpu-64-bit" size={24} color={theme.text} />
              <View>
                <Text style={[styles.rowText, { color: theme.text }]}>{node.name}</Text>
                <Text style={[styles.subText, { color: theme.textSecondary }]}>{node.id}</Text>
              </View>
            </View>
            <StatusIndicator isOnline={node.status === 'online'} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    fontSize: 16,
    fontWeight: '500',
  },
  subText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
