import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  printerService,
  BluetoothPrinterDevice,
  ScanResult,
  ConnectedPrinterInfo,
} from '../../services/printer.service';
import { THEME } from '../_layout';

type ScanStatus = 'idle' | 'scanning' | 'error';

interface PrinterUIState {
  scanStatus: ScanStatus;
  devices: BluetoothPrinterDevice[];
  connectedPrinter: ConnectedPrinterInfo | null;
  selectedDevice: BluetoothPrinterDevice | null;
  showTestModal: boolean;
  isConnecting: boolean;
  error: string | null;
}

/**
 * Printer Setup Screen
 * Allows users to scan and connect to Bluetooth thermal printers
 */
export default function PrinterScreen() {
  const router = useRouter();
  const [state, setState] = useState<PrinterUIState>({
    scanStatus: 'idle',
    devices: [],
    connectedPrinter: null,
    selectedDevice: null,
    showTestModal: false,
    isConnecting: false,
    error: null,
  });

  // Check for connected printer on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const printer = await printerService.getConnectedPrinter();
        setState((prev) => ({
          ...prev,
          connectedPrinter: printer,
        }));
      } catch (error) {
        console.warn('Error checking printer connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Scan for available printers
  const handleScanPrinters = async () => {
    try {
      setState((prev) => ({
        ...prev,
        scanStatus: 'scanning',
        error: null,
        devices: [],
      }));

      const result: ScanResult = await printerService.scanPrinters();

      // Combine paired and unpaired devices
      const allDevices = [
        ...result.paired.map((d) => ({ ...d, isPaired: true })),
        ...result.unpaired.map((d) => ({ ...d, isPaired: false })),
      ];

      // Remove duplicates by address
      const uniqueDevices = Array.from(
        new Map(allDevices.map((item) => [item.address, item])).values()
      );

      setState((prev) => ({
        ...prev,
        scanStatus: uniqueDevices.length > 0 ? 'idle' : 'error',
        devices: uniqueDevices as BluetoothPrinterDevice[],
        error:
          uniqueDevices.length === 0
            ? 'No printers found. Make sure your printer is powered on and in pairing mode.'
            : null,
      }));
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : 'Failed to scan for printers. Please try again.';

      setState((prev) => ({
        ...prev,
        scanStatus: 'error',
        error: errorMsg,
        devices: [],
      }));
    }
  };

  // Connect to selected printer
  const handleConnectPrinter = async (device: BluetoothPrinterDevice) => {
    try {
      setState((prev) => ({
        ...prev,
        isConnecting: true,
        error: null,
        selectedDevice: device,
      }));

      const printerInfo = await printerService.connectToPrinter(device);

      setState((prev) => ({
        ...prev,
        connectedPrinter: printerInfo,
        isConnecting: false,
        selectedDevice: null,
      }));

      Alert.alert('Success', `Connected to ${printerInfo.name}`, [
        {
          text: 'Test Print',
          onPress: () => {
            setState((prev) => ({
              ...prev,
              showTestModal: true,
            }));
          },
        },
        {
          text: 'Done',
          onPress: () => {
            // Stay on printer screen or go back
          },
        },
      ]);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to connect to printer';

      setState((prev) => ({
        ...prev,
        isConnecting: false,
        selectedDevice: null,
        error: errorMsg,
      }));

      Alert.alert('Connection Failed', errorMsg);
    }
  };

  // Disconnect from printer
  const handleDisconnectPrinter = async () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from this printer?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await printerService.disconnectPrinter();
              setState((prev) => ({
                ...prev,
                connectedPrinter: null,
              }));
              Alert.alert('Disconnected', 'Printer disconnected successfully');
            } catch (error) {
              const errorMsg =
                error instanceof Error ? error.message : 'Disconnection failed';
              Alert.alert('Error', errorMsg);
            }
          },
        },
      ]
    );
  };

  // Test print
  const handleTestPrint = async () => {
    try {
      // Print test pattern
      await printerService.printText('TEST PRINT', 'center');
      await printerService.printLineBreak(2);
      await printerService.printText('Sticker Dream', 'center');
      await printerService.printLineBreak(4);

      setState((prev) => ({
        ...prev,
        showTestModal: false,
      }));

      Alert.alert('Test Print', 'Test print sent to printer successfully!');
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Test print failed';
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.primary }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <TouchableOpacity onPress={() => router.back()} style={{ width: 44 }}>
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: THEME.text,
              flex: 1,
              marginLeft: 12,
            }}
          >
            Connect Printer
          </Text>
        </View>

        {/* Info Card */}
        <View
          style={{
            backgroundColor: THEME.secondary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: THEME.text,
              lineHeight: 20,
            }}
          >
            <Text style={{ fontWeight: '700' }}>Supported Printers:</Text>
            {'\n'}Phomemo PM2, PM1, and other ESC/POS thermal printers
          </Text>
        </View>

        {/* Connected Printer Section */}
        {state.connectedPrinter && (
          <View
            style={{
              backgroundColor: THEME.tertiary,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderWidth: 2,
              borderColor: '#27AE60',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: THEME.text,
                    marginBottom: 4,
                  }}
                >
                  ✅ Connected
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: THEME.text,
                    opacity: 0.8,
                    marginBottom: 4,
                  }}
                >
                  {state.connectedPrinter.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: THEME.text,
                    opacity: 0.6,
                  }}
                >
                  {state.connectedPrinter.model}
                </Text>
              </View>
              <Text style={{ fontSize: 28 }}>🖨️</Text>
            </View>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setState((prev) => ({
                    ...prev,
                    showTestModal: true,
                  }));
                }}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: THEME.secondary,
                  paddingVertical: 10,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: THEME.text,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  Test Print
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDisconnectPrinter}
                activeOpacity={0.7}
                style={{
                  flex: 1,
                  backgroundColor: THEME.accent,
                  paddingVertical: 10,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: THEME.error,
                    fontWeight: '700',
                    fontSize: 13,
                  }}
                >
                  Disconnect
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scan Section */}
        <View
          style={{
            marginBottom: 20,
          }}
        >
          <TouchableOpacity
            onPress={handleScanPrinters}
            disabled={state.scanStatus === 'scanning'}
            activeOpacity={0.8}
            style={{
              backgroundColor: THEME.text,
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 10,
              justifyContent: 'center',
              alignItems: 'center',
              opacity: state.scanStatus === 'scanning' ? 0.6 : 1,
            }}
          >
            {state.scanStatus === 'scanning' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ActivityIndicator color={THEME.textLight} size="small" />
                <Text
                  style={{
                    color: THEME.textLight,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Scanning...
                </Text>
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 20, marginBottom: 4 }}>🔍</Text>
                <Text
                  style={{
                    color: THEME.textLight,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Scan for Printers
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {state.error && (
          <View
            style={{
              backgroundColor: '#FFE5E5',
              borderLeftWidth: 4,
              borderLeftColor: THEME.error,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: THEME.error,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              {state.error}
            </Text>
          </View>
        )}

        {/* Devices List */}
        {state.devices.length > 0 && (
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: THEME.text,
                marginBottom: 12,
              }}
            >
              Available Printers ({state.devices.length})
            </Text>

            <View style={{ gap: 8 }}>
              {state.devices.map((device) => (
                <TouchableOpacity
                  key={device.address}
                  onPress={() => handleConnectPrinter(device)}
                  disabled={
                    state.isConnecting && state.selectedDevice?.address === device.address
                  }
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: THEME.secondary,
                    borderRadius: 10,
                    padding: 14,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity:
                      state.isConnecting &&
                      state.selectedDevice?.address === device.address
                        ? 0.6
                        : 1,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: THEME.text,
                        marginBottom: 2,
                      }}
                    >
                      {device.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: THEME.text,
                        opacity: 0.6,
                      }}
                    >
                      {device.address}
                    </Text>
                  </View>

                  {state.isConnecting &&
                  state.selectedDevice?.address === device.address ? (
                    <ActivityIndicator color={THEME.text} size="small" />
                  ) : (
                    <Text style={{ fontSize: 18 }}>→</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {state.devices.length === 0 && state.scanStatus === 'idle' && !state.error && (
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 40,
            }}
          >
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🖨️</Text>
            <Text
              style={{
                fontSize: 14,
                color: THEME.text,
                opacity: 0.6,
                textAlign: 'center',
              }}
            >
              No printers scanned yet.{'\n'}Tap the button above to find available
              printers.
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View
          style={{
            marginTop: 'auto',
            backgroundColor: THEME.accent,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: THEME.text,
              marginBottom: 8,
            }}
          >
            Setup Instructions:
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: THEME.text,
              lineHeight: 18,
            }}
          >
            1. Turn on your thermal printer{'\n'}
            2. Enable Bluetooth on your device{'\n'}
            3. Put printer in pairing mode{'\n'}
            4. Tap "Scan for Printers"{'\n'}
            5. Select your printer to connect
          </Text>
        </View>
      </ScrollView>

      {/* Test Print Modal */}
      <Modal
        visible={state.showTestModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setState((prev) => ({
            ...prev,
            showTestModal: false,
          }));
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              backgroundColor: THEME.primary,
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 300,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 36, marginBottom: 16 }}>🖨️</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: THEME.text,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              Test Print
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: THEME.text,
                opacity: 0.7,
                marginBottom: 24,
                textAlign: 'center',
              }}
            >
              Send a test print to your printer to verify the connection is working correctly.
            </Text>

            <View style={{ width: '100%', gap: 10 }}>
              <TouchableOpacity
                onPress={handleTestPrint}
                activeOpacity={0.8}
                style={{
                  backgroundColor: THEME.text,
                  paddingVertical: 12,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: THEME.textLight,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  Print Test Pattern
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setState((prev) => ({
                    ...prev,
                    showTestModal: false,
                  }));
                }}
                activeOpacity={0.8}
                style={{
                  backgroundColor: THEME.border,
                  paddingVertical: 12,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: THEME.text,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
