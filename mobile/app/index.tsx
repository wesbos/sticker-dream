import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signInWithGoogle, AuthenticationError } from '../services/auth.service';
import { useAuth } from './_layout';
import { THEME } from './_layout';

/**
 * Authentication Screen with Google Sign-In
 * Displays app info and sign-in button with beautiful UI
 */
export default function AuthScreen() {
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Attempt to sign in
      const user = await signInWithGoogle();

      // Refresh auth context
      await refreshAuth();

      // Navigate to main app after successful sign-in
      router.replace('/(main)');
    } catch (err) {
      if (err instanceof AuthenticationError) {
        // Handle specific auth errors
        if (err.code === 'SIGN_IN_CANCELLED') {
          // User cancelled sign-in, don't show error
          setError(null);
        } else if (err.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
          setError(
            'Google Play Services is not available. Please update your device.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError(
          err instanceof Error ? err.message : 'An unknown error occurred'
        );
      }
      console.error('Sign-in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: THEME.primary }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          {/* App Icon/Logo */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: THEME.secondary,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 24,
              shadowColor: THEME.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text
              style={{
                fontSize: 50,
                fontWeight: '800',
              }}
            >
              ✨
            </Text>
          </View>

          {/* App Title */}
          <Text
            style={{
              fontSize: 36,
              fontWeight: '800',
              color: THEME.text,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Sticker Dream
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: 16,
              color: THEME.text,
              opacity: 0.7,
              marginBottom: 24,
              textAlign: 'center',
            }}
          >
            Create magical stickers with voice
          </Text>
        </View>

        {/* Features Section */}
        <View style={{ marginVertical: 40 }}>
          {/* Feature 1 */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: THEME.secondary,
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🎤</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: THEME.text,
                  flex: 1,
                }}
              >
                Hold to record
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: THEME.text,
                opacity: 0.6,
                paddingHorizontal: 16,
              }}
            >
              Simply hold the button and describe what you want to create
            </Text>
          </View>

          {/* Feature 2 */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: THEME.accent,
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>✏️</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: THEME.text,
                  flex: 1,
                }}
              >
                AI generates art
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: THEME.text,
                opacity: 0.6,
                paddingHorizontal: 16,
              }}
            >
              AI transforms your voice description into beautiful coloring pages
            </Text>
          </View>

          {/* Feature 3 */}
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: THEME.tertiary,
                padding: 16,
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 12 }}>🖨️</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: THEME.text,
                  flex: 1,
                }}
              >
                Instant printing
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: THEME.text,
                opacity: 0.6,
                paddingHorizontal: 16,
              }}
            >
              Print your creations directly to Bluetooth printers
            </Text>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View
            style={{
              backgroundColor: '#FFE5E5',
              borderLeftWidth: 4,
              borderLeftColor: THEME.error,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: THEME.error,
                fontSize: 13,
                fontWeight: '500',
              }}
            >
              {error}
            </Text>
          </View>
        )}

        {/* Sign-In Button */}
        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}
            style={{
              backgroundColor: isLoading ? THEME.text : THEME.text,
              opacity: isLoading ? 0.6 : 1,
              paddingVertical: 16,
              paddingHorizontal: 24,
              borderRadius: 12,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: THEME.shadow,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={THEME.textLight} size="small" />
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 18,
                    marginRight: 8,
                  }}
                >
                  🔐
                </Text>
                <Text
                  style={{
                    color: THEME.textLight,
                    fontSize: 16,
                    fontWeight: '700',
                  }}
                >
                  Sign in with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Privacy Notice */}
          <Text
            style={{
              fontSize: 11,
              color: THEME.text,
              opacity: 0.5,
              textAlign: 'center',
              paddingHorizontal: 8,
            }}
          >
            We securely sign you in with Google. Your account helps us save your
            creations.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
