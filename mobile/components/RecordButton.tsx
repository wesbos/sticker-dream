import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  Animated,
  PressResponderConfig,
  PressResponder,
  Pressable,
  StyleSheet,
  Dimensions,
  AccessibilityRole,
  AccessibilityHint,
} from 'react-native';

export type RecordButtonState =
  | 'idle'
  | 'recording'
  | 'transcribing'
  | 'generating'
  | 'printing'
  | 'processing';

export interface RecordButtonProps {
  state?: RecordButtonState;
  disabled?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onCancel?: () => void;
  showCancelHint?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const PASTEL_COLORS = {
  pink: '#ffb3d9',
  green: '#b4e7ce',
  blue: '#c2e7ff',
  yellow: '#fff5b8',
  darkText: '#2d2d2d',
  white: '#ffffff',
};

const STATE_CONFIG = {
  idle: {
    text: 'Sticker Dream',
    backgroundColor: PASTEL_COLORS.green,
    accessibilityLabel: 'Record button',
    accessibilityHint: 'Press and hold to record a sticker description',
  },
  recording: {
    text: 'Listening...',
    backgroundColor: PASTEL_COLORS.pink,
    accessibilityLabel: 'Recording',
    accessibilityHint: 'Recording your audio. Release to stop.',
  },
  transcribing: {
    text: 'Imagining...',
    backgroundColor: PASTEL_COLORS.blue,
    accessibilityLabel: 'Transcribing',
    accessibilityHint: 'Processing your audio',
  },
  generating: {
    text: 'Dreaming Up...',
    backgroundColor: PASTEL_COLORS.blue,
    accessibilityLabel: 'Generating',
    accessibilityHint: 'Generating your sticker',
  },
  printing: {
    text: 'Printing...',
    backgroundColor: PASTEL_COLORS.blue,
    accessibilityLabel: 'Printing',
    accessibilityHint: 'Printing your sticker',
  },
  processing: {
    text: 'Processing...',
    backgroundColor: PASTEL_COLORS.blue,
    accessibilityLabel: 'Processing',
    accessibilityHint: 'Processing your request',
  },
};

const RecordButton: React.FC<RecordButtonProps> = ({
  state = 'idle',
  disabled = false,
  onPressIn,
  onPressOut,
  onCancel,
  showCancelHint = false,
  testID = 'recordButton',
  accessibilityLabel: customAccessibilityLabel,
  accessibilityHint: customAccessibilityHint,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const [isPressed, setIsPressed] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const buttonSize = Math.min(220, screenWidth * 0.7);

  const stateConfig = STATE_CONFIG[state];

  const isLoading = ['transcribing', 'generating', 'printing', 'processing'].includes(state);
  const isRecording = state === 'recording';

  useEffect(() => {
    if (isRecording && !disabled) {
      const pulseSequence = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );

      pulseSequence.start();

      return () => {
        pulseSequence.stop();
        pulseAnim.setValue(1);
      };
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isRecording, disabled, pulseAnim]);

  useEffect(() => {
    if (isLoading && !disabled) {
      const loadingSequence = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.02,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.9,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ])
      );

      loadingSequence.start();

      return () => {
        loadingSequence.stop();
        scaleAnim.setValue(1);
        opacityAnim.setValue(1);
      };
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, disabled, scaleAnim, opacityAnim]);

  useEffect(() => {
    if (isPressed && !disabled && !isLoading) {
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [isPressed, disabled, isLoading, scaleAnim]);

  const handlePressIn = useCallback(() => {
    setIsPressed(true);
    onPressIn?.();
  }, [onPressIn]);

  const handlePressOut = useCallback(() => {
    setIsPressed(false);
    onPressOut?.();
  }, [onPressOut]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const scale = isRecording
    ? Animated.multiply(scaleAnim, pulseAnim)
    : Animated.multiply(scaleAnim, opacityAnim);

  const animatedStyle = {
    transform: [{ scale }],
    opacity: opacityAnim,
  };

  const buttonStyle = [
    styles.button,
    {
      width: buttonSize,
      height: buttonSize,
      backgroundColor: disabled ? PASTEL_COLORS.blue : stateConfig.backgroundColor,
      opacity: disabled ? 0.6 : 1,
    },
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[animatedStyle]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isLoading}
          style={buttonStyle}
          testID={testID}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={customAccessibilityLabel || stateConfig.accessibilityLabel}
          accessibilityHint={customAccessibilityHint || stateConfig.accessibilityHint}
          accessibilityState={{
            disabled: disabled || isLoading,
            pressed: isPressed,
          }}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: disabled ? PASTEL_COLORS.darkText : PASTEL_COLORS.darkText,
                opacity: disabled ? 0.6 : 1,
              },
            ]}
            allowFontScaling={false}
            numberOfLines={2}
          >
            {stateConfig.text}
          </Text>
        </Pressable>
      </Animated.View>

      {showCancelHint && isRecording && (
        <Animated.View
          style={[
            styles.cancelHintContainer,
            {
              opacity: Animated.divide(
                Animated.add(pulseAnim, 1),
                2
              ),
            },
          ]}
        >
          <Text
            style={styles.cancelHintText}
            allowFontScaling={false}
          >
            Say "Cancel" to stop
          </Text>
        </Animated.View>
      )}

      {isRecording && onCancel && (
        <Pressable
          onPress={handleCancel}
          style={styles.cancelArea}
          testID="recordButtonCancel"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Cancel recording"
          accessibilityHint="Double tap to cancel the current recording"
        >
          <Text style={styles.cancelAreaText}>
            Swipe down to cancel
          </Text>
        </Pressable>
      )}
    </View>
  );
};

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
    shadowOffset: {
      width: 8,
      height: 8,
    },
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
  cancelHintContainer: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: PASTEL_COLORS.yellow,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PASTEL_COLORS.darkText,
  },
  cancelHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: PASTEL_COLORS.darkText,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  cancelArea: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: PASTEL_COLORS.pink,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PASTEL_COLORS.darkText,
  },
  cancelAreaText: {
    fontSize: 12,
    fontWeight: '500',
    color: PASTEL_COLORS.darkText,
    textAlign: 'center',
  },
});

export default RecordButton;
