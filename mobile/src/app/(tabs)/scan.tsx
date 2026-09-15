import { View, Text, StyleSheet, Switch, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import NfcService from '@/services/NfcService';

export default function ScanScreen() {
  const router = useRouter();
  const theme = useTheme();
  const textColor = theme.text;
  const textSecondary = theme.textSecondary;
  const backgroundColor = theme.background;

  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(NfcService.getDemoMode());

  useEffect(() => {
    NfcService.init();
    startScan();

    return () => {
      NfcService.cancelScan();
    };
  }, [isDemoMode]);

  const startScan = async () => {
    try {
      setIsScanning(true);
      setError(null);
      const tagId = await NfcService.scanTag();
      setIsScanning(false);
      
      // Artificial delay just for UX so user sees "Tag Detected"
      setTimeout(() => {
        router.push(`/shipment/${tagId}` as any);
      }, 500);

    } catch (e: any) {
      setIsScanning(false);
      setError('Failed to read NFC tag. Please try again.');
    }
  };

  const toggleDemoMode = (value: boolean) => {
    NfcService.cancelScan();
    NfcService.setDemoMode(value);
    setIsDemoMode(value);
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.demoToggle}>
        <Text style={[styles.demoText, { color: textSecondary }]}>Demo Mode</Text>
        <Switch value={isDemoMode} onValueChange={toggleDemoMode} />
      </View>

      <View style={styles.centerContent}>
        {isScanning ? (
          <>
            <MaterialCommunityIcons name="cellphone-nfc" size={80} color={textColor} style={styles.iconPulse} />
            <Text style={[styles.statusTitle, { color: textColor }]}>Waiting for tag...</Text>
            <Text style={[styles.statusSubtitle, { color: textSecondary }]}>
              Hold your phone near the node's NFC tag
            </Text>
            <ActivityIndicator size="large" color={textColor} style={styles.loader} />
          </>
        ) : error ? (
          <>
            <MaterialCommunityIcons name="alert-circle-outline" size={80} color="#ef4444" />
            <Text style={[styles.statusTitle, { color: textColor }]}>Scan Failed</Text>
            <Text style={[styles.statusSubtitle, { color: '#ef4444' }]}>{error}</Text>
            <TouchableOpacity onPress={startScan} style={styles.retryButton}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <MaterialCommunityIcons name="check-circle" size={80} color="#10b981" />
            <Text style={[styles.statusTitle, { color: textColor }]}>Tag Detected</Text>
            <Text style={[styles.statusSubtitle, { color: textSecondary }]}>Identifying node...</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  demoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
  },
  demoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: -60,
  },
  iconPulse: {
    marginBottom: 32,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  statusSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  loader: {
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  }
});
