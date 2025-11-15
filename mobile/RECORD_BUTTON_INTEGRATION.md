# RecordButton Integration Guide

This guide shows how to integrate the RecordButton component into your Sticker Dream mobile app.

## Quick Start

### 1. Import the Component

```typescript
import { RecordButton, type RecordButtonState } from './components';
// OR
import RecordButton, { type RecordButtonState } from './components/RecordButton';
```

### 2. Add to Your App

```typescript
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import RecordButton from './components/RecordButton';

export default function App() {
  const [state, setState] = useState<RecordButtonState>('idle');

  return (
    <View style={styles.container}>
      <RecordButton
        state={state}
        onPressIn={() => setState('recording')}
        onPressOut={() => setState('transcribing')}
        onCancel={() => setState('idle')}
        showCancelHint={state === 'recording'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
```

## Full Implementation Example

Here's how to integrate with your recording, transcription, and printing flow:

```typescript
import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { RecordButton, type RecordButtonState } from './components';
import { whisperService } from './services/whisper.service';
import { geminiService } from './services/gemini.service';
import { printerService } from './services/printer.service';

const CANCEL_WORDS = ['BLANK', 'NO IMAGE', 'NO STICKER', 'CANCEL', 'ABORT', 'START OVER'];
const MAX_RECORDING_DURATION = 15000; // 15 seconds

export default function StickerDreamScreen() {
  const [recordingState, setRecordingState] = useState<RecordButtonState>('idle');
  const [recordingStartTime, setRecordingStartTime] = useState(0);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  const handleRecordingStart = async () => {
    try {
      setRecordingState('recording');
      setRecordingStartTime(Date.now());

      // Start recording with whisper.rn or expo-av
      await whisperService.startRecording();

      // Auto-stop after 15 seconds
      recordingTimeoutRef.current = setTimeout(() => {
        handleRecordingStop();
      }, MAX_RECORDING_DURATION);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please check microphone permissions.');
      setRecordingState('idle');
    }
  };

  const handleRecordingStop = async () => {
    try {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      setRecordingState('transcribing');

      // Stop recording and get audio data
      const audioData = await whisperService.stopRecording();
      const recordingDuration = Date.now() - recordingStartTime;

      console.log(`Recording duration: ${recordingDuration}ms`);

      // Transcribe audio
      const transcript = await whisperService.transcribe(audioData);

      if (!transcript) {
        setRecordingState('idle');
        Alert.alert('Info', 'No speech detected. Please try again.');
        return;
      }

      console.log(`Transcript: ${transcript}`);

      // Check for cancel words
      const shouldCancel = CANCEL_WORDS.some((word) =>
        transcript.toUpperCase().includes(word)
      );

      if (shouldCancel) {
        setRecordingState('idle');
        Alert.alert('Info', 'Recording cancelled.');
        return;
      }

      // Generate image
      setRecordingState('generating');
      const imageData = await geminiService.generateSticker(transcript);

      if (!imageData) {
        setRecordingState('idle');
        Alert.alert('Error', 'Failed to generate image.');
        return;
      }

      // Print image
      setRecordingState('printing');
      await printerService.printImage(imageData);

      // Success!
      setRecordingState('idle');
      Alert.alert('Success', 'Sticker printed successfully!');
    } catch (error) {
      console.error('Error during recording flow:', error);
      setRecordingState('idle');
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  };

  const handleCancel = async () => {
    try {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      await whisperService.stopRecording();
      setRecordingState('idle');
    } catch (error) {
      console.error('Error cancelling recording:', error);
      setRecordingState('idle');
    }
  };

  return (
    <View style={styles.container}>
      <RecordButton
        state={recordingState}
        disabled={false}
        onPressIn={handleRecordingStart}
        onPressOut={handleRecordingStop}
        onCancel={handleCancel}
        showCancelHint={recordingState === 'recording'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
```

## Integration with Navigation

If using Expo Router, you can add the RecordButton to your main app screen:

```typescript
// app/(tabs)/index.tsx
import { Stack } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import RecordButton from '../../components/RecordButton';

export default function HomeScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sticker Dream' }} />
      <View style={styles.container}>
        <RecordButton state="idle" />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

## State Management with Context

For managing recording state across multiple screens, use React Context:

```typescript
// hooks/useRecording.ts
import { createContext, useContext, useState, type ReactNode } from 'react';
import { type RecordButtonState } from '../components';

interface RecordingContextType {
  state: RecordButtonState;
  setState: (state: RecordButtonState) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(undefined);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RecordButtonState>('idle');

  return (
    <RecordingContext.Provider value={{ state, setState }}>
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const context = useContext(RecordingContext);
  if (!context) {
    throw new Error('useRecording must be used within RecordingProvider');
  }
  return context;
}
```

Then use it in your app:

```typescript
// App.tsx
import { RecordingProvider } from './hooks/useRecording';
import StickerDreamScreen from './screens/StickerDreamScreen';

export default function App() {
  return (
    <RecordingProvider>
      <StickerDreamScreen />
    </RecordingProvider>
  );
}
```

## Styling Customization

The RecordButton uses predefined pastel colors. To customize, modify the colors directly:

```typescript
// For now, the colors are hardcoded in the component
// You can extract them to a theme file for reusability

const PASTEL_COLORS = {
  pink: '#ffb3d9',
  green: '#b4e7ce',
  blue: '#c2e7ff',
  yellow: '#fff5b8',
  darkText: '#2d2d2d',
  white: '#ffffff',
};
```

To make colors configurable, you could extend the RecordButtonProps:

```typescript
interface RecordButtonProps {
  colors?: typeof PASTEL_COLORS;
  // ... other props
}
```

## Handling Errors

Always wrap recording flow in try-catch:

```typescript
const handleRecordingStop = async () => {
  try {
    // ... recording flow
  } catch (error) {
    console.error('Recording error:', error);
    setRecordingState('idle');

    if (error instanceof Error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Error', 'An unexpected error occurred');
    }
  }
};
```

## Testing

To test the RecordButton in your app:

```typescript
// __tests__/RecordButton.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import RecordButton from '../components/RecordButton';

describe('RecordButton Integration', () => {
  it('transitions through recording states', async () => {
    const { getByTestId, rerender } = render(
      <RecordButton state="idle" />
    );

    // Start recording
    rerender(<RecordButton state="recording" />);
    fireEvent.press(getByTestId('recordButton'));

    // Stop recording
    rerender(<RecordButton state="transcribing" />);

    // Generate
    rerender(<RecordButton state="generating" />);

    // Print
    rerender(<RecordButton state="printing" />);

    // Complete
    rerender(<RecordButton state="idle" />);
  });
});
```

## Troubleshooting

### Button not responding
- Ensure the button is not in a disabled state
- Check that onPressIn/onPressOut callbacks are properly defined
- Verify the button is not covered by another component

### Animations not smooth
- Make sure you're testing on actual device, not simulator
- Check for other heavy animations running simultaneously
- Verify `useNativeDriver: true` is set (it is by default)

### Microphone permissions
- Request permissions before starting recording
- Use `expo-av` or `whisper.rn` permission APIs
- Handle permission denial gracefully

### State not updating
- Ensure state is managed at the parent component level
- Use useCallback to memoize handlers
- Check that state updates are not batched incorrectly

## Performance Tips

1. **Avoid re-rendering**: Use `useCallback` for event handlers
2. **Memoize state**: Use `useState` and `useReducer` appropriately
3. **Clean up animations**: The component handles this automatically
4. **Test on low-end devices**: Ensure smooth animations on older phones
5. **Monitor memory**: Recording audio consumes memory, clean up properly

## API Reference

See `/mobile/components/RecordButton.md` for complete API documentation.

## File Structure

```
mobile/
├── components/
│   ├── RecordButton.tsx          # Main component
│   ├── RecordButton.md           # Documentation
│   ├── RecordButton.example.tsx  # Usage examples
│   └── index.ts                  # Exports
├── services/
│   ├── whisper.service.ts        # Speech-to-text
│   ├── gemini.service.ts         # Image generation
│   ├── printer.service.ts        # Printing
│   └── auth.service.ts           # Authentication
└── RECORD_BUTTON_INTEGRATION.md  # This file
```

## Next Steps

1. Import RecordButton into your main app screen
2. Set up state management for recording states
3. Implement audio recording with whisper.rn
4. Integrate with Gemini API for image generation
5. Add printer integration for printing stickers
6. Test the full flow on iOS and Android devices

For more detailed examples, see `RecordButton.example.tsx`.
