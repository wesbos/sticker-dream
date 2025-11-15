import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  ViewStyle,
  AccessibilityRole,
} from 'react-native';
import { Button } from './Button';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
  style?: ViewStyle;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
}

const PASTEL_COLORS = {
  pink: '#FFE5F1',
  blue: '#B8E6FF',
  lightBlue: '#D4E5FF',
  lavender: '#FFD4F1',
  cream: '#FFFACD',
};

const SEVERITY_STYLES = {
  error: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FFB3B3',
    backgroundColor_variant: PASTEL_COLORS.lavender,
  },
  warning: {
    backgroundColor: '#FFFAE5',
    borderColor: '#FFD699',
    backgroundColor_variant: PASTEL_COLORS.cream,
  },
  info: {
    backgroundColor: '#E5F5FF',
    borderColor: '#B3E5FF',
    backgroundColor_variant: PASTEL_COLORS.lightBlue,
  },
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Error',
  onRetry,
  onDismiss,
  severity = 'error',
  style,
  showRetryButton = true,
  showDismissButton = true,
}) => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, opacityAnim]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const severityStyle = SEVERITY_STYLES[severity];
  const iconColors = {
    error: '#FF6B6B',
    warning: '#FFA500',
    info: '#4A90E2',
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: severityStyle.backgroundColor,
            borderColor: severityStyle.borderColor,
          },
          style,
        ]}
        accessible
        accessibilityRole="alert"
        accessibilityLabel={`${title}: ${message}`}
      >
        {/* Header with icon and title */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: iconColors[severity] },
            ]}
          >
            <Text
              style={styles.icon}
              accessible={false}
              allowFontScaling={false}
            >
              {severity === 'error' && '!'}
              {severity === 'warning' && '⚠'}
              {severity === 'info' && 'ℹ'}
            </Text>
          </View>
          <Text
            style={[
              styles.title,
              {
                color: iconColors[severity],
              },
            ]}
          >
            {title}
          </Text>
        </View>

        {/* Message content */}
        <Text style={styles.message} selectable>
          {message}
        </Text>

        {/* Action buttons */}
        {(showRetryButton || showDismissButton) && (
          <View style={styles.actionContainer}>
            {showRetryButton && onRetry && (
              <View style={styles.buttonWrapper}>
                <Button
                  title="Try Again"
                  onPress={onRetry}
                  variant="primary"
                  accessibilityLabel="Retry the failed operation"
                />
              </View>
            )}
            {showDismissButton && onDismiss && (
              <View style={styles.buttonWrapper}>
                <Button
                  title="Dismiss"
                  onPress={onDismiss}
                  variant="secondary"
                  accessibilityLabel="Dismiss the error message"
                />
              </View>
            )}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginBottom: 16,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  buttonWrapper: {
    flex: 1,
    minWidth: 100,
  },
});
