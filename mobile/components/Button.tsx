import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import { Animated } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

const PASTEL_COLORS = {
  pink: '#FFE5F1',
  blue: '#B8E6FF',
  lightBlue: '#D4E5FF',
  lavender: '#FFD4F1',
  cream: '#FFFACD',
};

const VARIANT_STYLES = {
  primary: {
    backgroundColor: PASTEL_COLORS.pink,
    borderColor: '#FF99CC',
  },
  secondary: {
    backgroundColor: PASTEL_COLORS.blue,
    borderColor: '#6DD4FF',
  },
  danger: {
    backgroundColor: PASTEL_COLORS.lavender,
    borderColor: '#FF99DD',
  },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID,
  accessibilityLabel,
  style,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const [isPressed, setIsPressed] = React.useState(false);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const isDisabled = disabled || loading;
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        testID={testID}
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          styles.button,
          {
            backgroundColor: variantStyle.backgroundColor,
            borderColor: variantStyle.borderColor,
            opacity: isDisabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: variant === 'secondary' ? '#1A1A1A' : '#333333',
            },
          ]}
        >
          {loading ? '...' : title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
