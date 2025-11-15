import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import { BluetoothEscposPrinter } from 'react-native-bluetooth-escpos-printer';

// Type definitions
export interface BluetoothPrinterDevice {
  address: string;
  name: string;
  isConnected?: boolean;
}

export interface ConnectedPrinterInfo {
  address: string;
  name: string;
  connectedAt: string;
  model?: string;
}

export interface PrintOptions {
  imageWidth?: number;
  alignment?: 'left' | 'center' | 'right';
  copies?: number;
}

export interface ScanResult {
  paired: BluetoothPrinterDevice[];
  unpaired: BluetoothPrinterDevice[];
}

type PermissionStatus = 'granted' | 'denied' | 'never_asked_again';

class PrinterService {
  private connectedPrinter: BluetoothPrinterDevice | null = null;
  private scanTimeout: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'connected_printer_info';
  private readonly PHOMEMO_PM2_WIDTH = 384; // pixels
  private readonly SCAN_TIMEOUT = 10000; // 10 seconds

  /**
   * Request necessary Bluetooth permissions
   */
  private async requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const androidVersion = Platform.Version as number;
      const permissions = [];

      // Android 12+ requires BLUETOOTH_SCAN and BLUETOOTH_CONNECT
      if (androidVersion >= 31) {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        );
      }

      // Required for both old and new Android versions
      permissions.push(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );

      try {
        const results = await PermissionsAndroid.requestMultiple(permissions);

        const allGranted = Object.values(results).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.warn(
            'Some Bluetooth permissions were denied. Scanning may not work properly.'
          );
          return false;
        }

        return true;
      } catch (error) {
        console.error('Error requesting Bluetooth permissions:', error);
        return false;
      }
    }

    // iOS permissions are handled automatically
    return true;
  }

  /**
   * Scan for available Bluetooth printers
   * Returns both paired and unpaired devices
   */
  async scanPrinters(): Promise<ScanResult> {
    try {
      // Request necessary permissions
      const permissionGranted = await this.requestBluetoothPermissions();
      if (!permissionGranted) {
        console.warn(
          'Bluetooth permissions not fully granted. Results may be incomplete.'
        );
      }

      // Get paired devices
      let pairedDevices: BluetoothPrinterDevice[] = [];
      let unpairedDevices: BluetoothPrinterDevice[] = [];

      try {
        const paired = await BluetoothEscposPrinter.getPrinterSerialNumber();
        if (paired && typeof paired === 'object') {
          pairedDevices = [];
        }
      } catch (error) {
        // Try alternative method for getting paired devices
      }

      // Start scanning for unpaired devices
      try {
        unpairedDevices = await this.performDeviceScan();
      } catch (error) {
        console.error('Error scanning for devices:', error);
        throw new Error(
          `Failed to scan for Bluetooth printers: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }

      // Combine results
      const result: ScanResult = {
        paired: pairedDevices.length > 0 ? pairedDevices : unpairedDevices,
        unpaired: unpairedDevices,
      };

      return result;
    } catch (error) {
      console.error('Error scanning for printers:', error);
      throw error;
    }
  }

  /**
   * Perform the actual device scan with timeout
   */
  private async performDeviceScan(): Promise<BluetoothPrinterDevice[]> {
    return new Promise((resolve, reject) => {
      const devices: BluetoothPrinterDevice[] = [];

      // Set timeout for scan
      this.scanTimeout = setTimeout(() => {
        reject(new Error('Bluetooth scan timeout'));
      }, this.SCAN_TIMEOUT);

      try {
        // Use the built-in scan functionality
        BluetoothEscposPrinter.scan()
          .then((scannedDevices: any) => {
            if (this.scanTimeout) {
              clearTimeout(this.scanTimeout);
              this.scanTimeout = null;
            }

            if (Array.isArray(scannedDevices)) {
              scannedDevices.forEach((device: any) => {
                devices.push({
                  address: device.address || device.macAddress || '',
                  name: device.name || 'Unknown Device',
                  isConnected: false,
                });
              });
            }

            resolve(devices);
          })
          .catch((error: any) => {
            if (this.scanTimeout) {
              clearTimeout(this.scanTimeout);
              this.scanTimeout = null;
            }
            reject(error);
          });
      } catch (error) {
        if (this.scanTimeout) {
          clearTimeout(this.scanTimeout);
          this.scanTimeout = null;
        }
        reject(error);
      }
    });
  }

  /**
   * Connect to a Bluetooth printer
   */
  async connectToPrinter(
    device: BluetoothPrinterDevice
  ): Promise<ConnectedPrinterInfo> {
    try {
      if (!device.address) {
        throw new Error('Invalid device address');
      }

      // Attempt connection
      await BluetoothEscposPrinter.connectPrinter(device.address);

      // Verify connection
      const connectionInfo = await this.verifyConnection();

      if (!connectionInfo) {
        throw new Error('Failed to verify printer connection');
      }

      // Store in memory
      this.connectedPrinter = device;

      // Determine printer model
      const model = this.detectPrinterModel(device.name);

      // Store in AsyncStorage
      const printerInfo: ConnectedPrinterInfo = {
        address: device.address,
        name: device.name,
        model,
        connectedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(printerInfo));

      return printerInfo;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      throw new Error(
        `Failed to connect to printer "${device.name}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Verify that the printer is actually connected
   */
  private async verifyConnection(): Promise<boolean> {
    try {
      // Try to get printer serial number as a connection check
      const result = await BluetoothEscposPrinter.getPrinterSerialNumber();
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detect printer model from device name
   */
  private detectPrinterModel(deviceName: string): string {
    const nameLower = deviceName.toLowerCase();

    if (nameLower.includes('phomemo') || nameLower.includes('pm2')) {
      return 'Phomemo PM2';
    }

    if (nameLower.includes('phomemo') || nameLower.includes('pm1')) {
      return 'Phomemo PM1';
    }

    if (
      nameLower.includes('xprinter') ||
      nameLower.includes('xp') ||
      nameLower.includes('printer')
    ) {
      return 'Thermal Printer';
    }

    return 'Unknown';
  }

  /**
   * Disconnect from the current printer
   */
  async disconnectPrinter(): Promise<void> {
    try {
      if (!this.connectedPrinter) {
        throw new Error('No printer currently connected');
      }

      await BluetoothEscposPrinter.closeConn();

      // Clear from AsyncStorage
      await AsyncStorage.removeItem(this.STORAGE_KEY);

      // Clear from memory
      this.connectedPrinter = null;
    } catch (error) {
      console.error('Error disconnecting from printer:', error);
      throw new Error(
        `Failed to disconnect from printer: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Print a base64 encoded image
   */
  async printImage(
    base64Image: string,
    options: PrintOptions = {}
  ): Promise<void> {
    try {
      if (!this.connectedPrinter) {
        throw new Error('No printer connected. Please connect to a printer first.');
      }

      // Ensure base64 is properly formatted
      const cleanBase64 = this.cleanBase64String(base64Image);

      // Determine image width based on printer model
      const imageWidth = this.determineImageWidth(options.imageWidth);

      // Default options
      const alignment = options.alignment || 'center';
      const copies = Math.max(1, options.copies || 1);

      // Parse alignment to printer value
      const alignmentValue =
        alignment === 'left'
          ? 0
          : alignment === 'right'
            ? 2
            : 1; // center is default (1)

      // Print the image
      for (let i = 0; i < copies; i++) {
        await BluetoothEscposPrinter.printPic(cleanBase64, {
          width: imageWidth,
          height: 0, // Auto height based on aspect ratio
          paddingX: 0,
          paddingY: 0,
          align: alignmentValue,
        });

        // Add line break between copies
        if (i < copies - 1) {
          await BluetoothEscposPrinter.printText('\n\n\n');
        }
      }

      // Print final line breaks for paper feed
      await BluetoothEscposPrinter.printText('\n\n');
    } catch (error) {
      console.error('Error printing image:', error);
      throw new Error(
        `Failed to print image: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Clean base64 string (remove data URI prefix if present)
   */
  private cleanBase64String(base64: string): string {
    // Remove data URI prefix if present
    if (base64.startsWith('data:')) {
      return base64.split(',')[1] || base64;
    }
    return base64;
  }

  /**
   * Determine the appropriate image width based on printer model
   */
  private determineImageWidth(requestedWidth?: number): number {
    // If user specified a width, use it
    if (requestedWidth && requestedWidth > 0) {
      return requestedWidth;
    }

    // Check connected printer model
    if (
      this.connectedPrinter &&
      this.detectPrinterModel(this.connectedPrinter.name) === 'Phomemo PM2'
    ) {
      return this.PHOMEMO_PM2_WIDTH;
    }

    // Default width for thermal printers
    return 384;
  }

  /**
   * Get the currently connected printer info
   */
  async getConnectedPrinter(): Promise<ConnectedPrinterInfo | null> {
    try {
      // First check in-memory cache
      if (this.connectedPrinter) {
        const model = this.detectPrinterModel(this.connectedPrinter.name);
        return {
          address: this.connectedPrinter.address,
          name: this.connectedPrinter.name,
          model,
          connectedAt: new Date().toISOString(),
        };
      }

      // Check AsyncStorage as fallback
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const printerInfo = JSON.parse(stored) as ConnectedPrinterInfo;

        // Verify the connection is still active
        const isConnected = await this.verifyConnection();
        if (isConnected) {
          // Restore in-memory cache
          this.connectedPrinter = {
            address: printerInfo.address,
            name: printerInfo.name,
            isConnected: true,
          };
          return printerInfo;
        } else {
          // Printer was disconnected externally
          await AsyncStorage.removeItem(this.STORAGE_KEY);
          return null;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting connected printer info:', error);
      return null;
    }
  }

  /**
   * Force reconnect to the last connected printer
   */
  async reconnectLastPrinter(): Promise<ConnectedPrinterInfo | null> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return null;
      }

      const printerInfo = JSON.parse(stored) as ConnectedPrinterInfo;

      // Attempt connection
      const device: BluetoothPrinterDevice = {
        address: printerInfo.address,
        name: printerInfo.name,
      };

      return await this.connectToPrinter(device);
    } catch (error) {
      console.error('Error reconnecting to last printer:', error);
      // Clear the stored info if reconnection fails
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      return null;
    }
  }

  /**
   * Check if a printer is currently connected
   */
  async isPrinterConnected(): Promise<boolean> {
    try {
      return this.connectedPrinter !== null && (await this.verifyConnection());
    } catch {
      return false;
    }
  }

  /**
   * Print text (useful for labels, headers, etc.)
   */
  async printText(text: string, alignment: 'left' | 'center' | 'right' = 'left'): Promise<void> {
    try {
      if (!this.connectedPrinter) {
        throw new Error('No printer connected. Please connect to a printer first.');
      }

      const alignmentValue =
        alignment === 'left'
          ? 0
          : alignment === 'right'
            ? 2
            : 1; // center

      await BluetoothEscposPrinter.printText(text, {
        align: alignmentValue,
      });
    } catch (error) {
      console.error('Error printing text:', error);
      throw new Error(
        `Failed to print text: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Print a line break
   */
  async printLineBreak(lines: number = 1): Promise<void> {
    try {
      if (!this.connectedPrinter) {
        throw new Error('No printer connected. Please connect to a printer first.');
      }

      const lineBreaks = '\n'.repeat(lines);
      await BluetoothEscposPrinter.printText(lineBreaks);
    } catch (error) {
      console.error('Error printing line breaks:', error);
      throw new Error(
        `Failed to print line breaks: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Reset printer
   */
  async resetPrinter(): Promise<void> {
    try {
      if (!this.connectedPrinter) {
        throw new Error('No printer connected. Please connect to a printer first.');
      }

      await BluetoothEscposPrinter.printerInit();
    } catch (error) {
      console.error('Error resetting printer:', error);
      throw new Error(
        `Failed to reset printer: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Feed paper (advance print position)
   */
  async feedPaper(lines: number = 3): Promise<void> {
    try {
      if (!this.connectedPrinter) {
        throw new Error('No printer connected. Please connect to a printer first.');
      }

      const feedCommand = '\n'.repeat(Math.max(1, lines));
      await BluetoothEscposPrinter.printText(feedCommand);
    } catch (error) {
      console.error('Error feeding paper:', error);
      throw new Error(
        `Failed to feed paper: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Clear all stored printer data
   */
  async clearStoredPrinterData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      this.connectedPrinter = null;
    } catch (error) {
      console.error('Error clearing stored printer data:', error);
      throw new Error(
        `Failed to clear stored printer data: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}

// Create and export singleton instance
const printerService = new PrinterService();

export {
  printerService,
  // Export type for use in other modules
};

// Export the class as default for dependency injection if needed
export default printerService;
