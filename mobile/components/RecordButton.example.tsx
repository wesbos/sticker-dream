import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RecordButton, { RecordButtonState } from './RecordButton';

/**
 * Example usage of the RecordButton component demonstrating all states
 * and interactions.
 */
export default function RecordButtonExample() {
  const [state, setState] = useState<RecordButtonState>('idle');

  const handlePressIn = () => {
    console.log('Button pressed in');
    setState('recording');
  };

  const handlePressOut = () => {
    console.log('Button pressed out');
    setState('transcribing');

    // Simulate the flow through different states
    setTimeout(() => setState('generating'), 2000);
    setTimeout(() => setState('printing'), 4000);
    setTimeout(() => setState('idle'), 6000);
  };

  const handleCancel = () => {
    console.log('Recording cancelled');
    setState('idle');
  };

  return (
    <View style={styles.container}>
      <RecordButton
        state={state}
        disabled={false}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onCancel={handleCancel}
        showCancelHint={state === 'recording'}
        testID="recordButtonExample"
        accessibilityLabel="Record button"
        accessibilityHint="Press and hold to record a sticker description"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

/**
 * Advanced usage example with custom state management
 */
export function AdvancedRecordButtonExample() {
  const [state, setState] = useState<RecordButtonState>('idle');
  const [recordingData, setRecordingData] = useState<{
    startTime: number;
    duration: number;
  } | null>(null);

  const handlePressIn = () => {
    setRecordingData({
      startTime: Date.now(),
      duration: 0,
    });
    setState('recording');
  };

  const handlePressOut = async () => {
    if (recordingData) {
      const duration = Date.now() - recordingData.startTime;
      console.log(`Recording duration: ${duration}ms`);
      setRecordingData(null);
    }

    setState('transcribing');

    try {
      // Simulate API call for transcription
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setState('generating');

      // Simulate API call for generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setState('printing');

      // Simulate printing
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setState('idle');
    } catch (error) {
      console.error('Error during processing:', error);
      setState('idle');
    }
  };

  const handleCancel = () => {
    console.log('Recording cancelled');
    setRecordingData(null);
    setState('idle');
  };

  return (
    <View style={styles.container}>
      <RecordButton
        state={state}
        disabled={false}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onCancel={handleCancel}
        showCancelHint={state === 'recording'}
        testID="advancedRecordButton"
      />
    </View>
  );
}

/**
 * Integration example showing how to use RecordButton with actual
 * Whisper transcription and Gemini generation
 */
export function FullIntegrationExample() {
  const [state, setState] = useState<RecordButtonState>('idle');

  const handlePressIn = async () => {
    setState('recording');
    // Start recording with whisper.rn or expo-av
  };

  const handlePressOut = async () => {
    setState('transcribing');

    try {
      // 1. Get audio chunks and transcribe with Whisper
      const transcript = await transcribeAudio();

      // Check for cancel words
      const cancelWords = [
        'BLANK',
        'NO IMAGE',
        'NO STICKER',
        'CANCEL',
        'ABORT',
        'START OVER',
      ];
      const shouldCancel = cancelWords.some((word) =>
        transcript.toUpperCase().includes(word)
      );

      if (shouldCancel) {
        setState('idle');
        return;
      }

      // 2. Generate image with Gemini
      setState('generating');
      const imageData = await generateImage(transcript);

      // 3. Print image
      setState('printing');
      await printImage(imageData);

      // 4. Reset
      setState('idle');
    } catch (error) {
      console.error('Error during recording flow:', error);
      setState('idle');
    }
  };

  const handleCancel = () => {
    setState('idle');
  };

  return (
    <View style={styles.container}>
      <RecordButton
        state={state}
        disabled={state !== 'idle' && state !== 'recording'}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onCancel={handleCancel}
        showCancelHint={state === 'recording'}
      />
    </View>
  );
}

// Mock API functions (replace with actual implementations)
async function transcribeAudio(): Promise<string> {
  return 'A cute cat wearing sunglasses';
}

async function generateImage(prompt: string): Promise<string> {
  return 'data:image/png;base64,...';
}

async function printImage(imageData: string): Promise<void> {
  // Print using bluetooth-escpos-printer
}
