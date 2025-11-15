import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../_layout';
import { THEME } from '../_layout';

/**
 * Protected Layout for Authenticated Routes
 * Requires user to be signed in to access these screens
 */
export default function MainLayout() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useAuth();

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.replace('/');
    }
  }, [isSignedIn, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
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
    );
  }

  // Don't render protected screens if not signed in
  if (!isSignedIn) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        gestureEnabled: true,
      }}
    >
      {/* Main screen */}
      <Stack.Screen
        name="index"
        options={{
          title: 'Create Sticker',
        }}
      />

      {/* Printer setup screen */}
      <Stack.Screen
        name="printer"
        options={{
          title: 'Connect Printer',
          animationTypeForReplace: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
