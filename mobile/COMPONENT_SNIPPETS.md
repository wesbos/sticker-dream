# Component Code Snippets - Copy & Paste Ready

Quick copy-paste code examples for each component with common use cases.

## Button Component

### Basic Primary Button
```tsx
<Button
  title="Generate Sticker"
  onPress={() => handleGenerateSticker()}
  variant="primary"
  accessibilityLabel="Generate a new sticker based on voice input"
/>
```

### Loading Button
```tsx
<Button
  title="Generating..."
  onPress={() => {}}
  variant="primary"
  loading={true}
  disabled={true}
/>
```

### Danger Button with Callback
```tsx
<Button
  title="Clear All"
  onPress={() => {
    setTranscript('');
    setImage(null);
  }}
  variant="danger"
  accessibilityLabel="Delete all saved data"
/>
```

## LoadingSpinner Component

### Full Screen Loading
```tsx
<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  <LoadingSpinner
    size="large"
    color="#FFE5F1"
    label="Creating your sticker..."
  />
</View>
```

### Inline Loading Indicator
```tsx
<LoadingSpinner
  size="small"
  color="#B8E6FF"
  label="Processing..."
/>
```

## ErrorMessage Component

### Network Error with Retry
```tsx
<ErrorMessage
  title="Connection Failed"
  message="Unable to connect to the printer. Check your Bluetooth settings and try again."
  severity="error"
  onRetry={() => {
    reconnectPrinter();
  }}
  onDismiss={() => {
    setError(null);
  }}
  showRetryButton={true}
  showDismissButton={true}
/>
```

### Warning Message
```tsx
<ErrorMessage
  title="Low Battery"
  message="Printer battery is at 15%. Consider charging before printing more stickers."
  severity="warning"
  onDismiss={() => {
    dismissWarning();
  }}
  showRetryButton={false}
  showDismissButton={true}
/>
```

### Info Message
```tsx
<ErrorMessage
  title="Success!"
  message="Your sticker has been printed and saved to your photo library."
  severity="info"
  onDismiss={() => {
    closeModal();
  }}
  showDismissButton={true}
/>
```

## ImagePreview Component

### Complete Image Viewer
```tsx
<ImagePreview
  imageUri={generatedImageUri}
  onShare={() => {
    Share.share({
      message: 'Check out my sticker!',
      url: generatedImageUri,
      title: 'My Sticker',
    });
  }}
  onPrintAgain={() => {
    handlePrintSticker(generatedImageUri);
  }}
  onClose={() => {
    setPreviewVisible(false);
  }}
/>
```

### Image Only (No Actions)
```tsx
<ImagePreview
  imageUri={stickerUri}
/>
```

## TranscriptDisplay Component

### With Typing Animation
```tsx
<TranscriptDisplay
  transcript={fullTranscript}
  isAnimating={true}
  duration={2500}
  language="en"
  confidence={0.94}
  showTimestamp={true}
/>
```

### Complete Transcript (No Animation)
```tsx
<TranscriptDisplay
  transcript="Create a purple butterfly with stars and moon"
  isAnimating={false}
  language="en"
  confidence={0.89}
  showTimestamp={false}
/>
```

### Low Confidence Display
```tsx
<TranscriptDisplay
  transcript={userSpeech}
  isAnimating={false}
  language="en"
  confidence={0.67}
  showTimestamp={true}
/>
```

## PrinterStatus Component

### Connected and Ready
```tsx
<PrinterStatus
  printerInfo={{
    name: "Epson TM-m30II-H",
    model: "TM-m30II-H",
    isConnected: true,
    batteryLevel: 85,
    status: "ready",
    signal: 92,
  }}
  onSettings={() => {
    navigateTo('PrinterSettings');
  }}
/>
```

### Currently Printing
```tsx
<PrinterStatus
  printerInfo={{
    name: "Epson TM-m30II-H",
    model: "TM-m30II-H",
    isConnected: true,
    batteryLevel: 60,
    status: "printing",
    signal: 85,
  }}
/>
```

### Low Battery Warning
```tsx
<PrinterStatus
  printerInfo={{
    name: "Epson TM-m30II-H",
    model: "TM-m30II-H",
    isConnected: true,
    batteryLevel: 18,
    status: "ready",
    signal: 75,
  }}
  onRetry={() => reconnectPrinter()}
/>
```

### Connection Error
```tsx
<PrinterStatus
  printerInfo={{
    name: "Epson TM-m30II-H",
    model: "TM-m30II-H",
    isConnected: false,
    batteryLevel: 0,
    status: "error",
    signal: 0,
  }}
  onRetry={() => reconnectPrinter()}
  onSettings={() => navigateTo('BluetoothSettings')}
/>
```

## Complete Screen Example

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  LoadingSpinner,
  ErrorMessage,
  ImagePreview,
  TranscriptDisplay,
  PrinterStatus,
  type PrinterInfo,
} from '@/components';

export const StickerGenerationScreen: React.FC = () => {
  const [state, setState] = useState<'idle' | 'recording' | 'generating' | 'preview'>('idle');
  const [transcript, setTranscript] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [printer, setPrinter] = useState<PrinterInfo>({
    name: 'Epson TM-m30II-H',
    isConnected: true,
    batteryLevel: 85,
    status: 'ready',
    signal: 92,
  });

  const handleGenerateSticker = async () => {
    setState('generating');
    setError(null);
    try {
      // Call API
      const result = await generateStickerFromTranscript(transcript);
      setImageUri(result.imageUri);
      setState('preview');
    } catch (err) {
      setError('Failed to generate sticker');
      setState('idle');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {error && (
        <ErrorMessage
          title="Generation Error"
          message={error}
          severity="error"
          onRetry={handleGenerateSticker}
          onDismiss={() => setError(null)}
        />
      )}

      {state === 'generating' && (
        <View style={styles.centerContent}>
          <LoadingSpinner
            size="large"
            label="Creating your sticker..."
          />
        </View>
      )}

      {transcript && state === 'idle' && (
        <View style={styles.section}>
          <TranscriptDisplay
            transcript={transcript}
            isAnimating={false}
            language="en"
            showTimestamp={true}
          />
        </View>
      )}

      {imageUri && state === 'preview' && (
        <View style={styles.section}>
          <ImagePreview
            imageUri={imageUri}
            onShare={() => shareImage(imageUri)}
            onPrintAgain={handlePrint}
            onClose={() => setState('idle')}
          />
        </View>
      )}

      <View style={styles.section}>
        <PrinterStatus
          printerInfo={printer}
          onRetry={() => reconnectPrinter()}
        />
      </View>

      <View style={styles.buttonGroup}>
        <Button
          title="Generate Sticker"
          onPress={handleGenerateSticker}
          variant="primary"
          disabled={!transcript || state === 'generating'}
          loading={state === 'generating'}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FAFAFA',
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
    marginVertical: 16,
  },
});
```

## Common Patterns

### Loading → Result → Action
```tsx
{isLoading ? (
  <LoadingSpinner size="large" label="Processing..." />
) : imageUri ? (
  <ImagePreview
    imageUri={imageUri}
    onPrintAgain={handlePrint}
  />
) : null}
```

### Error Handling Pattern
```tsx
{error && (
  <ErrorMessage
    title="Error"
    message={error}
    severity="error"
    onRetry={retryFunction}
    onDismiss={() => setError(null)}
  />
)}
```

### Form Submission Pattern
```tsx
<Button
  title={isSubmitting ? 'Submitting...' : 'Submit'}
  onPress={handleSubmit}
  disabled={!isFormValid || isSubmitting}
  loading={isSubmitting}
/>
```

### Status Monitor Pattern
```tsx
<PrinterStatus
  printerInfo={printerStatus}
  onRetry={reconnect}
  onSettings={openSettings}
/>
```

---

All snippets are production-ready and can be copy-pasted directly into your code!
