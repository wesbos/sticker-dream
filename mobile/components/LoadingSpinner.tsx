import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, ViewStyle, Text } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  label?: string;
  style?: ViewStyle;
}

const PASTEL_COLORS = {
  pink: '#FFE5F1',
  blue: '#B8E6FF',
  lightBlue: '#D4E5FF',
  lavender: '#FFD4F1',
  cream: '#FFFACD',
};

const SIZE_MAP = {
  small: 32,
  medium: 48,
  large: 64,
};

const STROKE_WIDTH_MAP = {
  small: 3,
  medium: 4,
  large: 5,
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = PASTEL_COLORS.pink,
  label,
  style,
}) => {
  const spinValue = React.useRef(new Animated.Value(0)).current;
  const rotationValue = React.useRef(new Animated.Value(0)).current;
  const opacityValue = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(rotationValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(rotationValue, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [spinValue, rotationValue, opacityValue]);

  const spinAnimation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const rotationAnimation = rotationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const spinnerSize = SIZE_MAP[size];
  const strokeWidth = STROKE_WIDTH_MAP[size];

  return (
    <View
      style={[styles.container, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label || 'Loading'}
      accessibilityHint="Content is loading"
    >
      {/* Outer rotating ring */}
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            transform: [{ rotate: spinAnimation }],
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            opacity: 0.8,
          },
        ]}
      />

      {/* Inner rotating ring (opposite direction) */}
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize * 0.6,
            height: spinnerSize * 0.6,
            borderRadius: (spinnerSize * 0.6) / 2,
            transform: [{ rotate: rotationAnimation }],
            borderWidth: strokeWidth - 1,
            borderColor: PASTEL_COLORS.blue,
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            opacity: 0.6,
          },
        ]}
      />

      {/* Center dot with pulse effect */}
      <Animated.View
        style={[
          styles.centerDot,
          {
            width: spinnerSize * 0.2,
            height: spinnerSize * 0.2,
            borderRadius: (spinnerSize * 0.2) / 2,
            backgroundColor: PASTEL_COLORS.lavender,
            opacity: opacityValue,
          },
        ]}
      />

      {label && (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  spinner: {
    position: 'absolute',
  },
  centerDot: {
    position: 'absolute',
  },
  label: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
  },
});
