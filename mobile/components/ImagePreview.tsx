import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Pressable,
  Text,
  ViewStyle,
  PanResponder,
  PanResponderInstance,
  Share,
  ActivityIndicator,
} from 'react-native';

interface ImagePreviewProps {
  imageUri: string;
  onShare?: () => void;
  onPrintAgain?: () => void;
  style?: ViewStyle;
  onClose?: () => void;
}

const PASTEL_COLORS = {
  pink: '#FFE5F1',
  blue: '#B8E6FF',
  lightBlue: '#D4E5FF',
  lavender: '#FFD4F1',
  cream: '#FFFACD',
};

interface ImageDimensions {
  width: number;
  height: number;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUri,
  onShare,
  onPrintAgain,
  style,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions>({
    width: 300,
    height: 300,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [panActive, setPanActive] = useState(false);

  const zoomAnim = useRef(new Animated.Value(1)).current;
  const panAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  const panResponder = useRef<PanResponderInstance>(
    PanResponder.create({
      onStartShouldSetPanResponder: () => zoom > 1,
      onMoveShouldSetPanResponder: () => zoom > 1,
      onPanResponderGrant: () => {
        setPanActive(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (zoom > 1) {
          const maxPan = (imageDimensions.width * (zoom - 1)) / 2;
          const x = Math.max(-maxPan, Math.min(maxPan, gestureState.dx));
          const y = Math.max(
            -maxPan,
            Math.min(maxPan, gestureState.dy)
          );
          panAnim.x.setValue(x);
          panAnim.y.setValue(y);
        }
      },
      onPanResponderRelease: () => {
        setPanActive(false);
        Animated.parallel([
          Animated.spring(panAnim.x, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(panAnim.y, {
            toValue: 0,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageDimensions({ width, height });
    setIsLoading(false);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? Math.min(zoom + 0.5, 3) : Math.max(zoom - 0.5, 1);
    setZoom(newZoom);

    Animated.spring(zoomAnim, {
      toValue: newZoom,
      useNativeDriver: true,
    }).start();

    if (newZoom === 1) {
      Animated.parallel([
        Animated.spring(panAnim.x, { toValue: 0, useNativeDriver: true }),
        Animated.spring(panAnim.y, { toValue: 0, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleShare = async () => {
    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onShare) {
      onShare();
    }
  };

  const handlePrint = async () => {
    Animated.sequence([
      Animated.timing(pressAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pressAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPrintAgain) {
      onPrintAgain();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Image preview area */}
      <View
        style={styles.previewContainer}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Generated sticker preview"
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PASTEL_COLORS.pink} />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}

        <Animated.View
          style={[
            styles.imageWrapper,
            {
              transform: [
                { scale: zoomAnim },
                { translateX: panAnim.x },
                { translateY: panAnim.y },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: imageUri }}
            style={{
              width: imageDimensions.width,
              height: imageDimensions.height,
            }}
            onLoad={handleImageLoad}
            accessible
            accessibilityLabel="Generated sticker image"
          />
        </Animated.View>

        {/* Zoom controls */}
        {!isLoading && zoom > 1 && (
          <Text
            style={styles.zoomHint}
            accessible
            accessibilityLabel={`Current zoom level: ${zoom.toFixed(1)}x`}
          >
            Drag to pan • Pinch to zoom
          </Text>
        )}
      </View>

      {/* Control buttons */}
      <View style={styles.controlsContainer}>
        {/* Zoom buttons */}
        <View style={styles.zoomButtonsGroup}>
          <Pressable
            style={[styles.zoomButton, { opacity: zoom <= 1 ? 0.5 : 1 }]}
            onPress={() => handleZoom('out')}
            disabled={zoom <= 1}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
            accessibilityHint={`Current zoom: ${zoom.toFixed(1)}x`}
          >
            <Text style={styles.zoomButtonText}>−</Text>
          </Pressable>

          <Text
            style={styles.zoomLevel}
            accessible
            accessibilityLabel={`Zoom level: ${Math.round(zoom * 100)}%`}
          >
            {Math.round(zoom * 100)}%
          </Text>

          <Pressable
            style={[styles.zoomButton, { opacity: zoom >= 3 ? 0.5 : 1 }]}
            onPress={() => handleZoom('in')}
            disabled={zoom >= 3}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
            accessibilityHint={`Current zoom: ${zoom.toFixed(1)}x`}
          >
            <Text style={styles.zoomButtonText}>+</Text>
          </Pressable>
        </View>

        {/* Action buttons */}
        <View style={styles.actionButtonsGroup}>
          {onShare && (
            <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
              <Pressable
                style={[styles.actionButton, styles.shareButton]}
                onPress={handleShare}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Share sticker"
              >
                <Text style={styles.actionButtonText}>↗ Share</Text>
              </Pressable>
            </Animated.View>
          )}

          {onPrintAgain && (
            <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
              <Pressable
                style={[styles.actionButton, styles.printButton]}
                onPress={handlePrint}
                accessible
                accessibilityRole="button"
                accessibilityLabel="Print again"
              >
                <Text style={styles.actionButtonText}>🖨 Print</Text>
              </Pressable>
            </Animated.View>
          )}

          {onClose && (
            <Pressable
              style={[styles.actionButton, styles.closeButton]}
              onPress={onClose}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Close preview"
            >
              <Text style={styles.actionButtonText}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: PASTEL_COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 12,
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  zoomButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  zoomButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: PASTEL_COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFB3D9',
  },
  zoomButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  zoomLevel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    minWidth: 50,
    textAlign: 'center',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    borderWidth: 1.5,
  },
  shareButton: {
    backgroundColor: PASTEL_COLORS.blue,
    borderColor: '#6DD4FF',
  },
  printButton: {
    backgroundColor: PASTEL_COLORS.lightBlue,
    borderColor: '#5AC8FF',
  },
  closeButton: {
    backgroundColor: PASTEL_COLORS.lavender,
    borderColor: '#FF99DD',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
});
