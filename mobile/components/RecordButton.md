# RecordButton Component

A production-ready React Native component for recording audio with animated states and pixelated retro styling. The component matches the web app's design aesthetic with pastel colors and smooth animations.

## Features

- **Multiple States**: Idle, recording, transcribing, generating, printing, and processing states
- **Animated Effects**:
  - Pulsing animation while recording
  - Loading pulse during processing
  - Press-down scale effect
  - Smooth state transitions
- **Accessibility**: Full accessibility support with labels, hints, and state indicators
- **Responsive Design**: Adapts to different screen sizes
- **Pastel Color Scheme**: Matches web app design (#ffb3d9 pink, #b4e7ce green, #c2e7ff blue, #fff5b8 yellow)
- **Press & Hold Support**: Natural press-and-hold interaction pattern
- **Cancel Hints**: Optional visual hints for canceling recordings
- **TypeScript**: Full TypeScript support with proper types

## Props

```typescript
interface RecordButtonProps {
  state?: RecordButtonState;          // Current state (default: 'idle')
  disabled?: boolean;                 // Disable the button (default: false)
  onPressIn?: () => void;             // Callback when pressed
  onPressOut?: () => void;            // Callback when released
  onCancel?: () => void;              // Callback when cancelled
  showCancelHint?: boolean;           // Show cancel hint text (default: false)
  testID?: string;                    // Test ID for automation
  accessibilityLabel?: string;        // Accessibility label
  accessibilityHint?: string;         // Accessibility hint
}
```

### States

```typescript
type RecordButtonState =
  | 'idle'           // Default state: "Sticker Dream" (green)
  | 'recording'      // Recording: "Listening..." (pink with pulse)
  | 'transcribing'   // Transcribing: "Imagining..." (blue with fade)
  | 'generating'     // Generating: "Dreaming Up..." (blue with fade)
  | 'printing'       // Printing: "Printing..." (blue with fade)
  | 'processing';    // Processing: "Processing..." (blue with fade)
```

## Colors

The component uses pastel colors defined in the `PASTEL_COLORS` object:

- **Pink**: `#ffb3d9` - Used for recording state
- **Green**: `#b4e7ce` - Used for idle state
- **Blue**: `#c2e7ff` - Used for loading states
- **Yellow**: `#fff5b8` - Used for hints
- **Dark Text**: `#2d2d2d` - Text color
- **White**: `#ffffff` - Background fallback

## Basic Usage

```typescript
import RecordButton from './components/RecordButton';

export default function App() {
  const [state, setState] = useState('idle');

  return (
    <RecordButton
      state={state}
      onPressIn={() => setState('recording')}
      onPressOut={() => setState('transcribing')}
      onCancel={() => setState('idle')}
      showCancelHint={state === 'recording'}
    />
  );
}
```

## Advanced Usage

### With State Management

```typescript
const [state, setState] = useState<RecordButtonState>('idle');

const handleRecordingFlow = async () => {
  // User presses button
  setState('recording');
  const audioData = await recordAudio();

  // User releases button
  setState('transcribing');
  const transcript = await transcribeAudio(audioData);

  // Check for cancel words
  const cancelWords = ['CANCEL', 'NO IMAGE', 'BLANK'];
  if (cancelWords.some(word => transcript.includes(word))) {
    setState('idle');
    return;
  }

  // Generate image
  setState('generating');
  const image = await generateImage(transcript);

  // Print image
  setState('printing');
  await printImage(image);

  setState('idle');
};

return (
  <RecordButton
    state={state}
    onPressIn={handleRecordingFlow}
    showCancelHint={state === 'recording'}
  />
);
```

### With Multiple Controls

```typescript
<View>
  <RecordButton
    state={recordingState}
    disabled={isProcessing}
    onPressIn={startRecording}
    onPressOut={stopRecording}
    onCancel={cancelRecording}
    showCancelHint={recordingState === 'recording'}
  />

  {recordingState === 'recording' && (
    <Text>Recording: {recordingDuration}s</Text>
  )}
</View>
```

## Animations

### Recording Animation
When in the `recording` state, the button pulses continuously:
- Scale from 1.0 to 1.08
- Duration: 500ms for expand, 500ms for contract
- Repeats infinitely

### Loading Animation
When in `transcribing`, `generating`, `printing`, or `processing` states:
- Scale from 1.0 to 1.02
- Opacity from 1.0 to 0.9
- Duration: 1000ms each direction
- Repeats infinitely

### Press Animation
When physically pressed:
- Scale to 0.95 (press-down effect)
- Duration: 100ms
- Only when button is enabled and not in loading state

## Accessibility

The component includes full accessibility support:

- **Accessibility Role**: Button
- **Labels**: State-specific labels for screen readers
- **Hints**: Contextual hints for button usage
- **State Indicators**: Disabled and pressed states communicated to accessibility tools
- **Font Scaling**: Disabled to maintain design consistency

Example accessibility labels:
- Idle: "Record button" - "Press and hold to record a sticker description"
- Recording: "Recording" - "Recording your audio. Release to stop."
- Transcribing: "Transcribing" - "Processing your audio"
- Generating: "Generating" - "Generating your sticker"
- Printing: "Printing" - "Printing your sticker"

## Styling

The component uses React Native's `StyleSheet` for consistent styling:

```typescript
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  button: {
    borderRadius: 20,
    borderWidth: 8,
    borderColor: PASTEL_COLORS.darkText,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PASTEL_COLORS.darkText,
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
    backgroundColor: PASTEL_COLORS.green,
    overflow: 'visible',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 16,
    color: PASTEL_COLORS.darkText,
    textTransform: 'uppercase',
  },
  // ... additional styles
});
```

## Responsive Design

The button automatically sizes based on screen width:

```typescript
const screenWidth = Dimensions.get('window').width;
const buttonSize = Math.min(220, screenWidth * 0.7);
```

- Maximum width: 220px
- Scales to 70% of screen width on smaller devices
- Always centered and properly spaced

## Integration with Expo

The component is built using standard React Native APIs and works seamlessly with Expo:

```typescript
// App.tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RecordButton from './components/RecordButton';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <RecordButton state={recordingState} />
      </View>
    </SafeAreaProvider>
  );
}
```

## Performance Considerations

- Uses `useNativeDriver: true` for all animations for optimal performance
- Animations are cleaned up properly on unmount
- `useCallback` hooks prevent unnecessary re-renders
- Memoization of state configuration
- Efficient animation cleanup when state changes

## Common Patterns

### Recording Flow
```typescript
const handlePressIn = () => {
  setState('recording');
  startRecordingAudio();
};

const handlePressOut = async () => {
  const audioData = stopRecordingAudio();
  setState('transcribing');
  const transcript = await transcribeAudio(audioData);
  setState('generating');
  const image = await generateImage(transcript);
  setState('printing');
  await printImage(image);
  setState('idle');
};
```

### Error Handling
```typescript
const handlePressOut = async () => {
  try {
    setState('transcribing');
    const transcript = await transcribeAudio();

    if (!transcript) {
      setState('idle');
      return;
    }

    setState('generating');
    const image = await generateImage(transcript);

    setState('printing');
    await printImage(image);

    setState('idle');
  } catch (error) {
    console.error('Recording error:', error);
    setState('idle');
    // Show error to user
  }
};
```

### With Timeout
```typescript
const handlePressOut = async () => {
  const maxDuration = 15000; // 15 seconds max

  setState('transcribing');

  const timeoutId = setTimeout(() => {
    setState('idle');
  }, maxDuration);

  try {
    const transcript = await transcribeAudio();
    clearTimeout(timeoutId);
    // Continue with generation...
  } catch (error) {
    clearTimeout(timeoutId);
    setState('idle');
  }
};
```

## Testing

The component supports testing with `testID`:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import RecordButton from './RecordButton';

describe('RecordButton', () => {
  it('calls onPressIn when pressed', () => {
    const onPressIn = jest.fn();
    const { getByTestId } = render(
      <RecordButton onPressIn={onPressIn} />
    );

    fireEvent.press(getByTestId('recordButton'));
    expect(onPressIn).toHaveBeenCalled();
  });

  it('changes state when pressed', () => {
    const { rerender, getByText } = render(
      <RecordButton state="idle" />
    );

    expect(getByText('Sticker Dream')).toBeTruthy();

    rerender(<RecordButton state="recording" />);
    expect(getByText('Listening...')).toBeTruthy();
  });
});
```

## Browser Compatibility

This is a React Native component and works on:
- iOS (13+)
- Android (5.0+)
- Expo Web (via Expo DOM APIs)

## License

Part of the Sticker Dream project

## Contributing

When modifying this component:
1. Ensure all TypeScript types are properly defined
2. Test animations on low-end devices
3. Verify accessibility with screen readers
4. Test on both iOS and Android
5. Update this documentation with any changes
