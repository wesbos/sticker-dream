import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  ViewStyle,
  Pressable,
} from 'react-native';

export interface PrinterInfo {
  name: string;
  model?: string;
  isConnected: boolean;
  batteryLevel?: number;
  status?: 'ready' | 'printing' | 'error' | 'offline';
  signal?: number;
}

interface PrinterStatusProps {
  printerInfo: PrinterInfo;
  onRetry?: () => void;
  onSettings?: () => void;
  style?: ViewStyle;
}

const PASTEL_COLORS = {
  pink: '#FFE5F1',
  blue: '#B8E6FF',
  lightBlue: '#D4E5FF',
  lavender: '#FFD4F1',
  cream: '#FFFACD',
};

const STATUS_COLORS = {
  ready: '#4CAF50',
  printing: '#2196F3',
  error: '#FF6B6B',
  offline: '#999999',
};

const getStatusLabel = (status?: string): string => {
  switch (status) {
    case 'ready':
      return 'Ready to Print';
    case 'printing':
      return 'Printing...';
    case 'error':
      return 'Error';
    case 'offline':
      return 'Offline';
    default:
      return 'Unknown Status';
  }
};

const getStatusIcon = (status?: string): string => {
  switch (status) {
    case 'ready':
      return '✓';
    case 'printing':
      return '⟳';
    case 'error':
      return '!';
    case 'offline':
      return '✕';
    default:
      return '?';
  }
};

const getBatteryIcon = (level?: number): string => {
  if (level === undefined) return '🔌';
  if (level >= 80) return '🔋';
  if (level >= 50) return '🔋';
  if (level >= 20) return '⚠️';
  return '🪫';
};

const getSignalBars = (signal?: number): string => {
  if (signal === undefined) return '—';
  if (signal >= 80) return '████';
  if (signal >= 60) return '███';
  if (signal >= 40) return '██';
  if (signal >= 20) return '█';
  return '▁';
};

export const PrinterStatus: React.FC<PrinterStatusProps> = ({
  printerInfo,
  onRetry,
  onSettings,
  style,
}) => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const batteryAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slide in animation
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Pulse animation for printing status
    if (printerInfo.status === 'printing') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    // Battery warning animation
    if (printerInfo.batteryLevel !== undefined && printerInfo.batteryLevel < 20) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(batteryAnim, {
            toValue: 0.7,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(batteryAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [printerInfo.status, printerInfo.batteryLevel, slideAnim, pulseAnim, batteryAnim]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const statusColor = STATUS_COLORS[printerInfo.status || 'offline'];
  const backgroundColor = printerInfo.isConnected ? PASTEL_COLORS.blue : PASTEL_COLORS.cream;

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateX }, { scale: pulseAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor,
            borderColor: printerInfo.isConnected ? '#6DD4FF' : '#D4A5A5',
          },
          style,
        ]}
        accessible
        accessibilityRole="status"
        accessibilityLabel={`Printer: ${printerInfo.name}`}
        accessibilityHint={`Status: ${getStatusLabel(printerInfo.status)}`}
      >
        {/* Main status section */}
        <View style={styles.mainSection}>
          {/* Status icon and info */}
          <View style={styles.statusSection}>
            <View
              style={[
                styles.statusIcon,
                { backgroundColor: statusColor },
              ]}
              accessible={false}
            >
              <Text
                style={styles.statusIconText}
                allowFontScaling={false}
              >
                {getStatusIcon(printerInfo.status)}
              </Text>
            </View>

            <View style={styles.printerInfo}>
              <Text
                style={styles.printerName}
                numberOfLines={1}
              >
                {printerInfo.name}
              </Text>

              {printerInfo.model && (
                <Text
                  style={styles.printerModel}
                  numberOfLines={1}
                  accessible
                  accessibilityLabel={`Model: ${printerInfo.model}`}
                >
                  {printerInfo.model}
                </Text>
              )}

              <Text
                style={[
                  styles.statusLabel,
                  { color: statusColor },
                ]}
                accessible
                accessibilityLabel={getStatusLabel(printerInfo.status)}
              >
                {getStatusLabel(printerInfo.status)}
              </Text>
            </View>
          </View>

          {/* Quick settings button */}
          {onSettings && (
            <Pressable
              style={styles.settingsButton}
              onPress={onSettings}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Printer settings"
            >
              <Text style={styles.settingsButtonText}>⚙</Text>
            </Pressable>
          )}
        </View>

        {/* Details section */}
        <View style={styles.detailsSection}>
          {/* Battery status */}
          {printerInfo.batteryLevel !== undefined && (
            <Animated.View
              style={[
                styles.detailItem,
                { opacity: batteryAnim },
              ]}
              accessible
              accessibilityLabel={`Battery level: ${printerInfo.batteryLevel}%`}
              accessibilityHint={printerInfo.batteryLevel < 20 ? 'Low battery' : undefined}
            >
              <Text style={styles.detailLabel}>
                {getBatteryIcon(printerInfo.batteryLevel)}
              </Text>
              <Text style={styles.detailValue}>
                {printerInfo.batteryLevel}%
              </Text>
              <View
                style={[
                  styles.batteryBar,
                  {
                    backgroundColor: getBatteryColor(printerInfo.batteryLevel),
                  },
                ]}
              >
                <View
                  style={[
                    styles.batteryBarFill,
                    {
                      width: `${printerInfo.batteryLevel}%`,
                      backgroundColor: getBatteryColor(printerInfo.batteryLevel),
                    },
                  ]}
                />
              </View>
            </Animated.View>
          )}

          {/* Signal strength */}
          {printerInfo.signal !== undefined && (
            <View
              style={styles.detailItem}
              accessible
              accessibilityLabel={`Signal strength: ${printerInfo.signal}%`}
            >
              <Text style={styles.detailLabel}>📶</Text>
              <Text style={styles.detailValue}>
                {getSignalBars(printerInfo.signal)}
              </Text>
            </View>
          )}

          {/* Connection status dot */}
          <View style={styles.detailItem}>
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: printerInfo.isConnected ? '#4CAF50' : '#999999',
                },
              ]}
              accessible={false}
            />
            <Text style={styles.detailValue}>
              {printerInfo.isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Error state with retry button */}
        {printerInfo.status === 'error' && onRetry && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>Connection lost. Try reconnecting.</Text>
            <Pressable
              style={styles.retryButton}
              onPress={onRetry}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Retry printer connection"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const getBatteryColor = (level: number): string => {
  if (level >= 50) return '#4CAF50';
  if (level >= 20) return '#FFC107';
  return '#FF6B6B';
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  mainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  printerInfo: {
    flex: 1,
  },
  printerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  printerModel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 2,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingsButtonText: {
    fontSize: 20,
  },
  detailsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    width: 20,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  batteryBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  batteryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  errorSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: PASTEL_COLORS.pink,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB3D9',
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
});
