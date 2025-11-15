import React, { useEffect, useState, createContext, useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  initGoogleSignIn,
  getCurrentUser,
  isSignedIn,
  getAuthState,
  GoogleUser,
  AuthState,
} from '../services/auth.service';
import { initWhisper } from '../services/whisper.service';
import { initLanguageService, isFirstLaunch } from '../services/language.service';

// Keep splash screen visible while we load
SplashScreen.preventAutoHideAsync();

// Theme colors
export const THEME = {
  primary: '#FFE5F1',
  secondary: '#B8E6FF',
  tertiary: '#D4E5FF',
  accent: '#FFD4F1',
  text: '#2C3E50',
  textLight: '#FFFFFF',
  background: '#F8F9FA',
  error: '#E74C3C',
  success: '#27AE60',
  border: '#DDD',
  shadow: '#000',
};

// Auth context type
interface AuthContextType {
  user: GoogleUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
  authState: AuthState | null;
  refreshAuth: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Root Layout with Auth State Management
 * Handles authentication initialization, splash screen, and theme provider
 */
export default function RootLayout() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSplashReady, setIsSplashReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Initialize auth and services
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize language service first
        await initLanguageService();

        // Check if first launch
        const firstLaunch = await isFirstLaunch();
        setShowWelcome(firstLaunch);

        // Initialize Google Sign-In
        await initGoogleSignIn();

        // Initialize Whisper service (will use selected language model)
        try {
          await initWhisper();
        } catch (whisperError) {
          // If Whisper fails to initialize (e.g., model not downloaded),
          // we'll show welcome screen to download model
          console.warn('Whisper initialization failed:', whisperError);
          if (!firstLaunch) {
            // Only set showWelcome if not already set
            setShowWelcome(true);
          }
        }

        // Restore previous session if available
        const state = await getAuthState();
        setAuthState(state);
      } catch (error) {
        console.warn('Error initializing app:', error);
        // Continue with uninitialized state
        setAuthState({
          user: null,
          tokens: null,
          isSignedIn: false,
        });
      } finally {
        setIsLoading(false);
        setIsSplashReady(true);
      }
    };

    initializeApp();
  }, []);

  // Hide splash screen once ready
  useEffect(() => {
    if (isSplashReady) {
      SplashScreen.hideAsync();
    }
  }, [isSplashReady]);

  // Refresh auth state
  const refreshAuth = async () => {
    try {
      const state = await getAuthState();
      setAuthState(state);
    } catch (error) {
      console.error('Error refreshing auth:', error);
    }
  };

  // Show loading screen while initializing
  if (isLoading || !isSplashReady) {
    return (
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: THEME.primary,
          }}
        >
          <ActivityIndicator size="large" color={THEME.text} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthContext.Provider
        value={{
          user: authState?.user || null,
          isSignedIn: authState?.isSignedIn || false,
          isLoading: false,
          authState: authState,
          refreshAuth,
        }}
      >
        <Stack
          screenOptions={{
            headerShown: false,
            animationEnabled: true,
            gestureEnabled: true,
          }}
        >
          {/* Welcome screen - shown on first launch or when model is missing */}
          {showWelcome && authState?.isSignedIn ? (
            <Stack.Screen
              name="welcome"
              options={{
                title: 'Welcome',
                animationTypeForReplace: 'push',
              }}
            />
          ) : !authState?.isSignedIn ? (
            // Auth stack - shown when user is not signed in
            <Stack.Screen
              name="index"
              options={{
                title: 'Sign In',
                animationTypeForReplace: isLoading ? 'pop' : 'slide_from_right',
              }}
            />
          ) : (
            // Main app stack - shown when user is signed in
            <Stack.Screen
              name="(main)"
              options={{
                title: 'Main App',
                animationTypeForReplace: 'pop',
              }}
            />
          )}
        </Stack>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
