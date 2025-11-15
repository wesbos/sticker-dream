/**
 * USAGE EXAMPLE - Sticker Dream UI Components
 *
 * This file demonstrates how to use all components together
 * in a real-world screen scenario. Not meant to be imported,
 * just as reference documentation.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  ImagePreview,
  TranscriptDisplay,
  PrinterStatus,
  type PrinterInfo,
} from './index';

// EXAMPLE 1: Complete Screen Flow
export const ExampleStickerGenerationScreen: React.FC = () => {
  const [transcript, setTranscript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printerInfo, setPrinterInfo] = useState<PrinterInfo>({
    name: 'Epson TM-m30II-H',
    model: 'TM-m30II-H',
    isConnected: true,
    batteryLevel: 85,
    status: 'ready',
    signal: 92,
  });

  // Handle image generation
  const handleGenerateSticker = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setGeneratedImage('file:///path/to/generated/sticker.png');
    } catch (err) {
      setError('Failed to generate sticker. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle print
  const handlePrint = async () => {
    try {
      // Simulate print
      setPrinterInfo(prev => ({ ...prev, status: 'printing' }));
      await new Promise(resolve => setTimeout(resolve, 3000));
      setPrinterInfo(prev => ({ ...prev, status: 'ready' }));
    } catch (err) {
      setPrinterInfo(prev => ({ ...prev, status: 'error' }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Error State Example */}
      {error && (
        <ErrorMessage
          title="Generation Error"
          message={error}
          severity="error"
          onRetry={handleGenerateSticker}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Loading State Example */}
      {isGenerating && (
        <View style={styles.centerContent}>
          <LoadingSpinner
            size="large"
            color="#FFE5F1"
            label="Generating your sticker..."
          />
        </View>
      )}

      {/* Transcript Display Example */}
      {transcript && (
        <View style={styles.section}>
          <TranscriptDisplay
            transcript={transcript}
            isAnimating={false}
            language="en"
            confidence={0.92}
            showTimestamp={true}
          />
        </View>
      )}

      {/* Image Preview Example */}
      {generatedImage && (
        <View style={styles.section}>
          <ImagePreview
            imageUri={generatedImage}
            onShare={() => console.log('Share tapped')}
            onPrintAgain={handlePrint}
            onClose={() => setGeneratedImage(null)}
          />
        </View>
      )}

      {/* Printer Status Example */}
      <View style={styles.section}>
        <PrinterStatus
          printerInfo={printerInfo}
          onRetry={() => setPrinterInfo(prev => ({ ...prev, status: 'ready' }))}
          onSettings={() => console.log('Settings tapped')}
        />
      </View>

      {/* Button Examples */}
      <View style={styles.buttonGroup}>
        <Button
          title="Generate Sticker"
          onPress={handleGenerateSticker}
          variant="primary"
          disabled={isGenerating}
          loading={isGenerating}
        />
        <Button
          title="Clear All"
          onPress={() => {
            setTranscript('');
            setGeneratedImage(null);
          }}
          variant="secondary"
        />
        <Button
          title="Reset Printer"
          onPress={() =>
            setPrinterInfo(prev => ({ ...prev, status: 'error' }))
          }
          variant="danger"
        />
      </View>
    </ScrollView>
  );
};

// EXAMPLE 2: Loading State Showcase
export const LoadingStateExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.exampleSection}>
        <LoadingSpinner size="small" label="Small" />
      </View>
      <View style={styles.exampleSection}>
        <LoadingSpinner size="medium" label="Medium" />
      </View>
      <View style={styles.exampleSection}>
        <LoadingSpinner size="large" label="Large" />
      </View>
    </View>
  );
};

// EXAMPLE 3: Error Variations
export const ErrorStateExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <ErrorMessage
        title="Connection Error"
        message="Unable to connect to the printer"
        severity="error"
        onRetry={() => console.log('Retrying...')}
        showRetryButton={true}
      />
      <ErrorMessage
        title="Low Battery"
        message="Printer battery is running low (15%)"
        severity="warning"
        showDismissButton={true}
      />
      <ErrorMessage
        title="Information"
        message="Your sticker has been saved to gallery"
        severity="info"
        showDismissButton={true}
      />
    </View>
  );
};

// EXAMPLE 4: Button Variants
export const ButtonVariantsExample: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonGroup}>
        <Button
          title="Primary Action"
          onPress={() => console.log('Primary')}
          variant="primary"
        />
        <Button
          title="Secondary Action"
          onPress={() => console.log('Secondary')}
          variant="secondary"
        />
        <Button
          title="Danger Action"
          onPress={() => console.log('Danger')}
          variant="danger"
        />
      </View>

      <View style={styles.buttonGroup}>
        <Button
          title="Loading State"
          onPress={() => {}}
          variant="primary"
          loading={true}
          disabled={true}
        />
        <Button
          title="Disabled State"
          onPress={() => {}}
          variant="secondary"
          disabled={true}
        />
      </View>
    </View>
  );
};

// EXAMPLE 5: Printer Status Variations
export const PrinterStatusVariantsExample: React.FC = () => {
  const statuses: PrinterInfo[] = [
    {
      name: 'Ready Printer',
      model: 'TM-m30II-H',
      isConnected: true,
      batteryLevel: 90,
      status: 'ready',
      signal: 95,
    },
    {
      name: 'Printing Printer',
      model: 'TM-m30II-H',
      isConnected: true,
      batteryLevel: 50,
      status: 'printing',
      signal: 80,
    },
    {
      name: 'Low Battery Printer',
      model: 'TM-m30II-H',
      isConnected: true,
      batteryLevel: 15,
      status: 'ready',
      signal: 60,
    },
    {
      name: 'Error Printer',
      model: 'TM-m30II-H',
      isConnected: false,
      batteryLevel: 0,
      status: 'error',
      signal: 0,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {statuses.map((status, index) => (
        <PrinterStatus
          key={index}
          printerInfo={status}
          onRetry={() => console.log('Retry')}
          onSettings={() => console.log('Settings')}
        />
      ))}
    </ScrollView>
  );
};

// EXAMPLE 6: Transcript Display Variations
export const TranscriptDisplayExample: React.FC = () => {
  const transcript = 'Create a sticker of a smiling cat with pink flowers and a butterfly. Make it colorful and whimsical.';

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <TranscriptDisplay
          transcript={transcript}
          isAnimating={true}
          duration={3000}
          language="en"
          confidence={0.95}
          showTimestamp={true}
        />
      </View>

      <View style={styles.section}>
        <TranscriptDisplay
          transcript={transcript}
          isAnimating={false}
          language="en"
          confidence={0.87}
          showTimestamp={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    padding: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  section: {
    marginBottom: 16,
  },
  buttonGroup: {
    gap: 12,
    marginVertical: 12,
  },
  exampleSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
});
