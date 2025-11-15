import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Animated,
  ViewStyle,
  ScrollView,
} from 'react-native';

interface TranscriptDisplayProps {
  transcript: string;
  isAnimating?: boolean;
  duration?: number;
  language?: string;
  confidence?: number;
  style?: ViewStyle;
  showTimestamp?: boolean;
}

const PASTEL_COLORS = {
  pink: '#FFE5F1',
  blue: '#B8E6FF',
  lightBlue: '#D4E5FF',
  lavender: '#FFD4F1',
  cream: '#FFFACD',
};

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
  isAnimating = true,
  duration = transcript.length * 30,
  language = 'en',
  confidence,
  style,
  showTimestamp = false,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(!isAnimating);
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const cursorOpacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isAnimating) {
      setDisplayedText(transcript);
      setIsComplete(true);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    let currentIndex = 0;
    const charDuration = duration / transcript.length;

    const interval = setInterval(() => {
      currentIndex += 1;
      setDisplayedText(transcript.substring(0, currentIndex));

      if (currentIndex >= transcript.length) {
        clearInterval(interval);
        setIsComplete(true);
      }
    }, charDuration);

    return () => clearInterval(interval);
  }, [transcript, isAnimating, duration]);

  useEffect(() => {
    if (isAnimating && !isComplete) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      cursorOpacity.setValue(0);
    }
  }, [isAnimating, isComplete, cursorOpacity]);

  const timestamp = new Date().toLocaleTimeString(language === 'en' ? 'en-US' : language);
  const confidencePercentage = confidence
    ? `${Math.round(confidence * 100)}%`
    : 'N/A';

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: opacityAnim },
        style,
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel="Transcript"
      accessibilityHint={isAnimating ? 'Transcription in progress' : 'Transcription complete'}
    >
      {/* Header with metadata */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text
            style={styles.title}
            accessible
            accessibilityLabel="Transcript title"
          >
            Transcription
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isComplete
                  ? PASTEL_COLORS.blue
                  : PASTEL_COLORS.pink,
              },
            ]}
            accessible
            accessibilityLabel={isComplete ? 'Complete' : 'In progress'}
          >
            <Text style={styles.statusBadgeText}>
              {isComplete ? '✓' : '⟳'}
            </Text>
          </View>
        </View>

        {/* Metadata info */}
        <View style={styles.metadataContainer}>
          {showTimestamp && (
            <View style={styles.metadataItem}>
              <Text
                style={styles.metadataLabel}
                accessible
                accessibilityLabel="Timestamp"
              >
                🕐 {timestamp}
              </Text>
            </View>
          )}

          {confidence !== undefined && (
            <View style={styles.metadataItem}>
              <Text
                style={styles.metadataLabel}
                accessible
                accessibilityLabel={`Confidence: ${confidencePercentage}`}
              >
                📊 {confidencePercentage}
              </Text>
            </View>
          )}

          <View style={styles.metadataItem}>
            <Text
              style={styles.metadataLabel}
              accessible
              accessibilityLabel={`Language: ${language}`}
            >
              🌐 {language.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {/* Transcript text area */}
      <ScrollView
        style={styles.transcriptContainer}
        scrollEnabled={displayedText.length > 150}
        accessible
        accessibilityRole="text"
      >
        <Text
          style={styles.transcriptText}
          selectable
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          accessible
          accessibilityLabel="Transcribed text"
        >
          {displayedText}
          {isAnimating && !isComplete && (
            <Animated.View
              style={[styles.cursor, { opacity: cursorOpacity }]}
              accessible={false}
            >
              <Text style={styles.cursorText}>|</Text>
            </Animated.View>
          )}
        </Text>
      </ScrollView>

      {/* Footer stats */}
      {displayedText.length > 0 && (
        <View
          style={styles.footer}
          accessible
          accessibilityRole="text"
          accessibilityLabel="Transcript statistics"
        >
          <Text style={styles.statText}>
            {displayedText.length} {displayedText.length === 1 ? 'character' : 'characters'}
          </Text>
          <Text style={styles.statText}>•</Text>
          <Text style={styles.statText}>
            {displayedText.split(/\s+/).filter(w => w.length > 0).length} {displayedText.split(/\s+/).filter(w => w.length > 0).length === 1 ? 'word' : 'words'}
          </Text>
        </View>
      )}

      {/* Loading indicator for animation */}
      {isAnimating && !isComplete && (
        <View style={styles.animationIndicator}>
          <View
            style={[styles.pulse, { backgroundColor: PASTEL_COLORS.pink }]}
            accessible={false}
          />
          <Text style={styles.animatingText}>Transcribing...</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    paddingBottom: 0,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  header: {
    backgroundColor: PASTEL_COLORS.cream,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metadataContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metadataItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  transcriptContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: 300,
  },
  transcriptText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1A1A1A',
    fontWeight: '400',
    letterSpacing: 0.3,
  },
  cursor: {
    marginLeft: 2,
  },
  cursorText: {
    fontSize: 16,
    fontWeight: '600',
    color: PASTEL_COLORS.pink,
  },
  footer: {
    backgroundColor: '#F9F9F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
  },
  animationIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: PASTEL_COLORS.pink + '20',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: PASTEL_COLORS.pink + '30',
  },
  pulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.7,
  },
  animatingText: {
    fontSize: 12,
    fontWeight: '500',
    color: PASTEL_COLORS.pink,
  },
});
