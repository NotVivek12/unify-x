import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export type StatusType = 'ONLINE' | 'OFFLINE' | 'ERROR' | 'UNKNOWN' | 'GOOD' | 'WARNING';

export function StatusBadge({ status, label }: { status: StatusType; label?: string }) {
  const theme = useTheme();
  const getStatusColorName = () => {
    switch (status) {
      case 'ONLINE':
      case 'GOOD':
        return 'success';
      case 'OFFLINE':
      case 'UNKNOWN':
        return 'textSecondary';
      case 'ERROR':
        return 'error';
      case 'WARNING':
        return 'warning';
      default:
        return 'textSecondary';
    }
  };

  const color = theme[getStatusColorName() as keyof typeof theme] as string;
  
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label || status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
