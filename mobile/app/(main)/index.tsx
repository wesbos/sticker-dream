import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import {
  startRecording,
  stopRecording,
  transcribeAudio,
  isRecording,
  cancelRecording,
  TranscriptionResult,
} from '../../services/whisper.service';
import { generateImageAsDataUri, ImageGenerationError } from '../../services/gemini.service';
import { printerService, ConnectedPrinterInfo } from '../../services/printer.service';
import { getAccessToken, signOut } from '../../services/auth.service';
import { useAuth } from '../_layout';
import { THEME } from '../_layout';

type ProcessingStep = 'idle' | 'recording' | 'transcribing' | 'generating' | 'printing' | 'complete';

interface ProcessingState {
  step: ProcessingStep;
  progress: number;
  message: string;
  transcribedText: string;
  generatedImage: string | null;
  error: string | null;
}

const { width: screenWidth } = Dimensions.get('window');

/**
 * Main Screen - Orchestrates all services
 * Recording → Transcription → Image Generation → Printing → Display
 */
export default function MainScreen() {
  const router = useRouter();
  const { user, refreshAuth } = useAuth();
  const [processingState, setProcessingState] = useState<ProcessingState>({
    step: 'idle',
    progress: 0,
    message: 'Hold to record',
    transcribedText: '',
    generatedImage: null,
    error: null,
  });

  const [connectedPrinter, setConnectedPrinter] = useState<ConnectedPrinterInfo | null>(null);
  const [soundLoaded, setSoundLoaded] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingTimeRef = useRef<number>(0);
  const recordingStartRef = useRef<number>(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Initialize and load sounds
  useEffect(() => {
    const initializeSounds = async () => {
      try {
        // Set audio mode for playing sounds
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
        setSoundLoaded(true);
      } catch (error) {
        console.warn('Error initializing audio:', error);
        setSoundLoaded(true); // Continue even if sounds fail
      }
    };

    initializeSounds();

    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Check printer connection on mount and periodically
  useEffect(() => {
    const checkPrinterConnection = async () => {
      try {
        const printer = await printerService.getConnectedPrinter();
        setConnectedPrinter(printer);
      } catch (error) {
        console.warn('Error checking printer connection:', error);
      }
    };

    checkPrinterConnection();
    const interval = setInterval(checkPrinterConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // Play sound effect
  const playSound = async (soundType: 'press' | 'loading' | 'finished') => {
    if (!soundLoaded) return;

    try {
      const soundMap = {
        press: require('../../assets/sounds/press.mp3'),
        loading: require('../../assets/sounds/loading.mp3'),
        finished: require('../../assets/sounds/finished.wav'),
      };

      const soundFile = soundMap[soundType];

      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      // Load and play new sound
      const { sound } = await Audio.Sound.createAsync(soundFile);
      soundRef.current = sound;
      await sound.playAsync();
    } catch (error) {
      // Silently continue if sound playback fails
      console.warn('Error playing sound:', error);
    }
  };

  // Update recording time display
  useEffect(() => {
    if (processingState.step !== 'recording') return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartRef.current) / 1000);
      recordingTimeRef.current = elapsed;
      setProcessingState((prev) => ({
        ...prev,
        message: `Recording... ${elapsed}s (Max 15s)`,
      }));

      // Auto-stop at 15 seconds
      if (elapsed >= 15) {
        handleStopRecording();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [processingState.step]);

  // Handle record button press (start recording)
  const handleStartRecording = async () => {
    try {
      setProcessingState({
        step: 'idle',
        progress: 0,
        message: '',
        transcribedText: '',
        generatedImage: null,
        error: null,
      });

      await playSound('press');

      // Start button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      // Start recording
      recordingStartRef.current = Date.now();
      await startRecording();

      setProcessingState({
        step: 'recording',
        progress: 0,
        message: 'Recording... 0s',
        transcribedText: '',
        generatedImage: null,
        error: null,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start recording';
      setProcessingState((prev) => ({
        ...prev,
        step: 'idle',
        error: errorMsg,
        message: 'Hold to record',
      }));
    }
  };

  // Handle record button release (stop recording and process)
  const handleStopRecording = async () => {
    if (processingState.step !== 'recording') return;

    try {
      await playSound('press');

      // Stop recording
      const audioUri = await stopRecording();

      // Start transcription
      setProcessingState({
        step: 'transcribing',
        progress: 20,
        message: 'Transcribing audio...',
        transcribedText: '',
        generatedImage: null,
        error: null,
      });

      // Transcribe audio
      const transcriptionResult = await transcribeAudio(audioUri, (progress) => {
        setProcessingState((prev) => ({
          ...prev,
          progress: 20 + (progress.percentage * 0.2), // 20-40% for transcription
          message: progress.message,
        }));
      });

      // Check for errors
      if (transcriptionResult.error) {
        throw transcriptionResult.error;
      }

      // Check for abort commands
      if (transcriptionResult.isAbort) {
        setProcessingState({
          step: 'idle',
          progress: 0,
          message: `Cancelled: ${transcriptionResult.abortCommand}`,
          transcribedText: '',
          generatedImage: null,
          error: null,
        });
        await playSound('finished');
        return;
      }

      const transcribedText = transcriptionResult.text;

      if (!transcribedText.trim()) {
        throw new Error('No speech detected. Please try again.');
      }

      setProcessingState((prev) => ({
        ...prev,
        step: 'generating',
        progress: 40,
        message: 'Generating image with AI...',
        transcribedText,
      }));

      await playSound('loading');

      // Get access token for Gemini
      const accessToken = await getAccessToken();

      // Generate image
      const generatedImage = await generateImageAsDataUri(transcribedText, accessToken);

      setProcessingState((prev) => ({
        ...prev,
        progress: 85,
        message: 'Image generated! Preparing to print...',
        generatedImage,
      }));

      // Try to print if printer is connected
      if (connectedPrinter) {
        setProcessingState((prev) => ({
          ...prev,
          step: 'printing',
          progress: 90,
          message: 'Printing...',
        }));

        // Extract base64 from data URI
        const base64 = generatedImage.split(',')[1];

        await printerService.printImage(base64, {
          alignment: 'center',
          copies: 1,
        });

        setProcessingState((prev) => ({
          ...prev,
          progress: 100,
          message: 'Printed successfully!',
        }));
      } else {
        setProcessingState((prev) => ({
          ...prev,
          progress: 100,
          message: 'Image ready! (No printer connected)',
        }));
      }

      // Mark as complete
      setProcessingState((prev) => ({
        ...prev,
        step: 'complete',
      }));

      await playSound('finished');
    } catch (error) {
      const errorMsg =
        error instanceof ImageGenerationError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'An unexpected error occurred';

      setProcessingState((prev) => ({
        ...prev,
        step: 'idle',
        error: errorMsg,
        message: 'Hold to record',
      }));

      console.error('Processing error:', error);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            await refreshAuth();
            router.replace('/');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  // Handle printer settings navigation
  const handlePrinterSettings = () => {
    router.push('/printer');
  };

  // Reset to idle state
  const handleReset = () => {
    setProcessingState({
      step: 'idle',
      progress: 0,
      message: 'Hold to record',
      transcribedText: '',
      generatedImage: null,
      error: null,
    });
  };

  const isProcessing =
    processingState.step !== 'idle' && processingState.step !== 'complete';

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: THEME.primary,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingVertical: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with User Info and Settings */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: THEME.text,
              }}
            >
              Welcome{user?.givenName ? `, ${user.givenName}` : ''}!
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: THEME.text,
                opacity: 0.6,
                marginTop: 4,
              }}
            >
              Create stickers with voice
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: THEME.secondary,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Printer Status Card */}
        <TouchableOpacity
          onPress={handlePrinterSettings}
          activeOpacity={0.7}
          style={{
            backgroundColor: connectedPrinter ? THEME.tertiary : THEME.accent,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: connectedPrinter ? THEME.text : THEME.error,
            borderStyle: 'solid',
          }}
        >
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: THEME.text,
                marginBottom: 4,
              }}
            >
              {connectedPrinter ? '✅ Printer Connected' : '⚠️ No Printer'}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: THEME.text,
                opacity: 0.7,
              }}
            >
              {connectedPrinter
                ? `${connectedPrinter.name} (${connectedPrinter.model})`
                : 'Tap to connect a Bluetooth printer'}
            </Text>
          </View>
          <Text style={{ fontSize: 20 }}>🖨️</Text>
        </TouchableOpacity>

        {/* Main Recording Area */}
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            marginVertical: 20,
          }}
        >
          {/* Large Recording Button */}
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
            }}
          >
            <TouchableOpacity
              onPressIn={handleStartRecording}
              onPressOut={handleStopRecording}
              disabled={isProcessing}
              activeOpacity={1}
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor:
                  processingState.step === 'recording'
                    ? THEME.error
                    : isProcessing
                      ? THEME.text
                      : THEME.secondary,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: THEME.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 16,
                elevation: 12,
              }}
            >
              {isProcessing ? (
                <ActivityIndicator size="large" color={THEME.textLight} />
              ) : (
                <Text style={{ fontSize: 60 }}>🎤</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Status Text */}
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: THEME.text,
              marginTop: 24,
              textAlign: 'center',
              minHeight: 24,
            }}
          >
            {processingState.message}
          </Text>

          {/* Progress Bar */}
          {isProcessing && (
            <View
              style={{
                width: '100%',
                height: 4,
                backgroundColor: THEME.border,
                borderRadius: 2,
                marginTop: 20,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  backgroundColor: THEME.text,
                  width: `${processingState.progress}%`,
                }}
              />
            </View>
          )}
        </View>

        {/* Error Display */}
        {processingState.error && (
          <View
            style={{
              backgroundColor: '#FFE5E5',
              borderLeftWidth: 4,
              borderLeftColor: THEME.error,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: THEME.error,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              Error: {processingState.error}
            </Text>
          </View>
        )}

        {/* Transcribed Text Display */}
        {processingState.transcribedText && (
          <View
            style={{
              backgroundColor: THEME.accent,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: THEME.text,
                marginBottom: 8,
              }}
            >
              What you said:
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: THEME.text,
                lineHeight: 20,
              }}
            >
              {processingState.transcribedText}
            </Text>
          </View>
        )}

        {/* Generated Image Display */}
        {processingState.generatedImage && (
          <View
            style={{
              backgroundColor: THEME.secondary,
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: THEME.text,
                marginBottom: 12,
              }}
            >
              Generated Sticker:
            </Text>
            <Image
              source={{ uri: processingState.generatedImage }}
              style={{
                width: screenWidth - 72,
                height: (screenWidth - 72) * 1.4,
                borderRadius: 8,
              }}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Complete State Actions */}
        {processingState.step === 'complete' && (
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={handleReset}
              activeOpacity={0.8}
              style={{
                flex: 1,
                backgroundColor: THEME.secondary,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 10,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: THEME.text,
                  fontWeight: '700',
                  fontSize: 14,
                }}
              >
                Create Another
              </Text>
            </TouchableOpacity>

            {connectedPrinter && (
              <TouchableOpacity
                onPress={() => {
                  if (processingState.generatedImage) {
                    const base64 = processingState.generatedImage.split(',')[1];
                    printerService.printImage(base64, {
                      alignment: 'center',
                      copies: 1,
                    });
                  }
                }}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: THEME.tertiary,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: THEME.text,
                    fontWeight: '700',
                    fontSize: 14,
                  }}
                >
                  Print Again
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Info Box */}
        <View
          style={{
            backgroundColor: THEME.tertiary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: THEME.text,
              lineHeight: 20,
            }}
          >
            <Text style={{ fontWeight: '700' }}>Tip:</Text> Hold the button and
            clearly describe what sticker you want. Release to create it. You can
            say "CANCEL" or "NO IMAGE" to abort.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
