/**
 * Welcome Screen
 * First-time onboarding with language selection
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { THEME } from './_layout';
import LanguageSelector from '../components/LanguageSelector';
import {
  markFirstLaunchComplete,
  getLanguage,
  isModelDownloaded,
  initLanguageService,
} from '../services/language.service';
import { LanguageCode } from '../types/whisper.types';

export default function WelcomeScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'welcome' | 'language' | 'downloading' | 'ready'>('welcome');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [modelDownloaded, setModelDownloaded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      await initLanguageService();
      const currentLang = await getLanguage();
      setSelectedLanguage(currentLang.languageCode);

      // Check if default model is already downloaded
      const isDownloaded = await isModelDownloaded(currentLang.modelType);
      setModelDownloaded(isDownloaded);
    } catch (error) {
      console.error('Error initializing welcome screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = () => {
    setStep('language');
  };

  const handleLanguageSelected = async (languageCode: LanguageCode) => {
    setSelectedLanguage(languageCode);
    // Check if model is downloaded
    const currentLang = await getLanguage();
    const isDownloaded = await isModelDownloaded(currentLang.modelType);
    setModelDownloaded(isDownloaded);
  };

  const handleDownloadComplete = async (success: boolean) => {
    if (success) {
      setModelDownloaded(true);
      setStep('ready');
    } else {
      Alert.alert('Download Failed', 'Please try again or select a different language');
      setStep('language');
    }
  };

  const handleContinue = async () => {
    if (!modelDownloaded) {
      Alert.alert(
        'Model Required',
        'Please download a language model to continue, or use English by default.'
      );
      return;
    }

    try {
      await markFirstLaunchComplete();
      // Navigate to main app
      router.replace('/(main)');
    } catch (error) {
      console.error('Error completing welcome:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const handleSkipToEnglish = async () => {
    Alert.alert(
      'Use English',
      'Continue with English (default)? You can change the language later in settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              // Check if English model is downloaded
              const currentLang = await getLanguage();
              const isDownloaded = await isModelDownloaded(currentLang.modelType);

              if (isDownloaded) {
                await markFirstLaunchComplete();
                router.replace('/(main)');
              } else {
                Alert.alert(
                  'Download Required',
                  'English model needs to be downloaded first. This will only take a moment.'
                );
              }
            } catch (error) {
              console.error('Error skipping to English:', error);
              Alert.alert('Error', 'Failed to continue. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: THEME.primary,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={THEME.text} />
      </SafeAreaView>
    );
  }

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
          padding: 24,
          justifyContent: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Step */}
        {step === 'welcome' && (
          <View style={{ alignItems: 'center' }}>
            {/* App Icon/Logo */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: THEME.secondary,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 32,
                shadowColor: THEME.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 60 }}>🎤</Text>
            </View>

            {/* Welcome Title */}
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: THEME.text,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              Welcome to{'\n'}Sticker Dream
            </Text>

            {/* Welcome Description */}
            <Text
              style={{
                fontSize: 16,
                color: THEME.text,
                textAlign: 'center',
                lineHeight: 24,
                opacity: 0.8,
                marginBottom: 48,
                paddingHorizontal: 20,
              }}
            >
              Create beautiful stickers with just your voice. Speak what you want, and AI will
              generate it for you.
            </Text>

            {/* Features List */}
            <View
              style={{
                width: '100%',
                marginBottom: 48,
              }}
            >
              {[
                { icon: '🎙️', title: 'Voice Recording', desc: 'Just speak what you want' },
                { icon: '🌍', title: 'Multi-Language', desc: 'Support for 12+ languages' },
                { icon: '🎨', title: 'AI Generation', desc: 'Powered by Gemini AI' },
                { icon: '🖨️', title: 'Instant Printing', desc: 'Print to Bluetooth printers' },
              ].map((feature, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: THEME.secondary,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 32, marginRight: 16 }}>{feature.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: THEME.text,
                        marginBottom: 4,
                      }}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: THEME.text,
                        opacity: 0.7,
                      }}
                    >
                      {feature.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Get Started Button */}
            <TouchableOpacity
              onPress={handleGetStarted}
              activeOpacity={0.8}
              style={{
                backgroundColor: THEME.tertiary,
                paddingVertical: 16,
                paddingHorizontal: 48,
                borderRadius: 12,
                width: '100%',
                alignItems: 'center',
                shadowColor: THEME.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  color: THEME.text,
                  fontWeight: '700',
                  fontSize: 18,
                }}
              >
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Language Selection Step */}
        {step === 'language' && (
          <View>
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🌍</Text>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: THEME.text,
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                Choose Your Language
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  color: THEME.text,
                  textAlign: 'center',
                  lineHeight: 22,
                  opacity: 0.8,
                  paddingHorizontal: 20,
                }}
              >
                Select your preferred language for voice recognition. You can change this later in
                settings.
              </Text>
            </View>

            {/* Language Selector */}
            <View style={{ marginBottom: 24 }}>
              <LanguageSelector
                onLanguageChanged={handleLanguageSelected}
                onDownloadComplete={handleDownloadComplete}
              />
            </View>

            {/* Action Buttons */}
            <View style={{ gap: 12 }}>
              {modelDownloaded && (
                <TouchableOpacity
                  onPress={handleContinue}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: THEME.tertiary,
                    paddingVertical: 16,
                    paddingHorizontal: 48,
                    borderRadius: 12,
                    alignItems: 'center',
                    shadowColor: THEME.shadow,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    style={{
                      color: THEME.text,
                      fontWeight: '700',
                      fontSize: 18,
                    }}
                  >
                    Continue
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSkipToEnglish}
                activeOpacity={0.8}
                style={{
                  backgroundColor: THEME.secondary,
                  paddingVertical: 14,
                  paddingHorizontal: 48,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: THEME.text,
                    fontWeight: '600',
                    fontSize: 15,
                  }}
                >
                  Skip (Use English by Default)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Info Box */}
            <View
              style={{
                backgroundColor: THEME.accent,
                borderRadius: 12,
                padding: 16,
                marginTop: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: THEME.text,
                  lineHeight: 20,
                }}
              >
                <Text style={{ fontWeight: '700' }}>Note:</Text> Language models will be downloaded
                for offline use. The download size varies from 39MB to 488MB depending on the model.
              </Text>
            </View>
          </View>
        )}

        {/* Ready Step */}
        {step === 'ready' && (
          <View style={{ alignItems: 'center' }}>
            {/* Success Icon */}
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: THEME.success,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 32,
                shadowColor: THEME.shadow,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.2,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 60 }}>✓</Text>
            </View>

            {/* Ready Title */}
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: THEME.text,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              You're All Set!
            </Text>

            {/* Ready Description */}
            <Text
              style={{
                fontSize: 16,
                color: THEME.text,
                textAlign: 'center',
                lineHeight: 24,
                opacity: 0.8,
                marginBottom: 48,
                paddingHorizontal: 20,
              }}
            >
              Your language model has been downloaded and is ready to use. Let's create your first
              sticker!
            </Text>

            {/* Continue Button */}
            <TouchableOpacity
              onPress={handleContinue}
              activeOpacity={0.8}
              style={{
                backgroundColor: THEME.tertiary,
                paddingVertical: 16,
                paddingHorizontal: 48,
                borderRadius: 12,
                width: '100%',
                alignItems: 'center',
                shadowColor: THEME.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  color: THEME.text,
                  fontWeight: '700',
                  fontSize: 18,
                }}
              >
                Start Creating
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
