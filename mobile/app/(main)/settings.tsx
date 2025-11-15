/**
 * Settings Screen
 * Language selection, model management, and app preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { THEME } from '../_layout';
import LanguageSelector from '../../components/LanguageSelector';
import {
  getLanguage,
  getDownloadedModelsSize,
  deleteAllModels,
  getAvailableLanguages,
  deleteModel,
} from '../../services/language.service';
import {
  LanguagePreference,
  LanguageAvailability,
  getLanguageByCode,
  getModelByType,
} from '../../types/whisper.types';

export default function SettingsScreen() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<LanguagePreference | null>(null);
  const [totalSize, setTotalSize] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState<LanguageAvailability[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [lang, size, langs] = await Promise.all([
        getLanguage(),
        getDownloadedModelsSize(),
        getAvailableLanguages(),
      ]);
      setCurrentLanguage(lang);
      setTotalSize(size);
      setLanguages(langs);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSettings();
    setRefreshing(false);
  };

  const handleDeleteAllModels = () => {
    Alert.alert(
      'Delete All Models',
      'Are you sure you want to delete all downloaded models? This will free up space but you\'ll need to download them again to use different languages.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllModels();
              await loadSettings();
              Alert.alert('Success', 'All models deleted successfully');
            } catch (error) {
              console.error('Error deleting models:', error);
              Alert.alert('Error', 'Failed to delete models');
            }
          },
        },
      ]
    );
  };

  const handleDeleteModel = (modelType: string, modelName: string) => {
    Alert.alert(
      'Delete Model',
      `Delete ${modelName}? You can download it again later if needed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteModel(modelType as any);
              await loadSettings();
              Alert.alert('Success', 'Model deleted successfully');
            } catch (error) {
              console.error('Error deleting model:', error);
              Alert.alert('Error', 'Failed to delete model');
            }
          },
        },
      ]
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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

  const currentLangInfo = currentLanguage
    ? getLanguageByCode(currentLanguage.languageCode)
    : null;
  const currentModelInfo = currentLanguage ? getModelByType(currentLanguage.modelType) : null;

  const downloadedLanguages = languages.filter((l) => l.isDownloaded);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: THEME.primary,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: THEME.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={{ fontSize: 28, color: THEME.text }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 24,
            fontWeight: '700',
            color: THEME.text,
            marginLeft: 12,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        {/* Current Language Section */}
        <View
          style={{
            backgroundColor: THEME.tertiary,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: THEME.text,
              marginBottom: 12,
              opacity: 0.7,
            }}
          >
            CURRENT LANGUAGE
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 40, marginRight: 12 }}>{currentLangInfo?.flag}</Text>
            <View>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: THEME.text,
                }}
              >
                {currentLangInfo?.name}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: THEME.text,
                  opacity: 0.6,
                  marginTop: 2,
                }}
              >
                {currentLangInfo?.nativeName}
              </Text>
            </View>
          </View>

          {currentModelInfo && (
            <View
              style={{
                backgroundColor: THEME.secondary,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: THEME.text,
                  opacity: 0.7,
                  marginBottom: 4,
                }}
              >
                Active Model:
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: THEME.text,
                }}
              >
                {currentModelInfo.displayName} ({currentModelInfo.sizeMB}MB)
              </Text>
            </View>
          )}
        </View>

        {/* Language Selector */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: THEME.text,
              marginBottom: 12,
              opacity: 0.7,
            }}
          >
            CHANGE LANGUAGE
          </Text>
          <LanguageSelector
            onLanguageChanged={async () => {
              await loadSettings();
            }}
            onDownloadComplete={async () => {
              await loadSettings();
            }}
          />
        </View>

        {/* Storage Management */}
        <View
          style={{
            backgroundColor: THEME.accent,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: THEME.text,
              marginBottom: 12,
              opacity: 0.7,
            }}
          >
            STORAGE
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: THEME.text,
                }}
              >
                Downloaded Models
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: THEME.text,
                  opacity: 0.6,
                  marginTop: 2,
                }}
              >
                {downloadedLanguages.length} model{downloadedLanguages.length !== 1 ? 's' : ''} • {formatBytes(totalSize)}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: THEME.secondary,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: THEME.text,
                }}
              >
                {formatBytes(totalSize)}
              </Text>
            </View>
          </View>

          {totalSize > 0 && (
            <TouchableOpacity
              onPress={handleDeleteAllModels}
              activeOpacity={0.7}
              style={{
                backgroundColor: THEME.error,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 10,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: THEME.textLight,
                  fontWeight: '700',
                  fontSize: 14,
                }}
              >
                Delete All Models
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Downloaded Models List */}
        {downloadedLanguages.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: THEME.text,
                marginBottom: 12,
                opacity: 0.7,
              }}
            >
              DOWNLOADED MODELS ({downloadedLanguages.length})
            </Text>

            {downloadedLanguages.map((langAvail) => {
              const isActive = langAvail.language.code === currentLanguage?.languageCode;

              return (
                <View
                  key={langAvail.language.code}
                  style={{
                    backgroundColor: THEME.secondary,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: isActive ? 2 : 0,
                    borderColor: THEME.success,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 28, marginRight: 12 }}>
                        {langAvail.language.flag}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: THEME.text,
                          }}
                        >
                          {langAvail.language.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: THEME.text,
                            opacity: 0.6,
                            marginTop: 2,
                          }}
                        >
                          {langAvail.recommendedModel.displayName} • {langAvail.recommendedModel.sizeMB}MB
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      {isActive ? (
                        <View
                          style={{
                            backgroundColor: THEME.success,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: THEME.textLight,
                            }}
                          >
                            ACTIVE
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() =>
                            handleDeleteModel(
                              langAvail.recommendedModel.type,
                              langAvail.language.name
                            )
                          }
                          activeOpacity={0.7}
                          style={{
                            backgroundColor: THEME.error,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 4,
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '700',
                              color: THEME.textLight,
                            }}
                          >
                            DELETE
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* About Section */}
        <View
          style={{
            backgroundColor: THEME.tertiary,
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: THEME.text,
              marginBottom: 12,
              opacity: 0.7,
            }}
          >
            ABOUT
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: THEME.text,
              lineHeight: 20,
              opacity: 0.8,
            }}
          >
            Sticker Dream uses Whisper AI models for speech recognition in multiple languages.
            Models are downloaded on-demand and stored locally for offline use.
          </Text>
        </View>

        {/* Info Box */}
        <View
          style={{
            backgroundColor: THEME.secondary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 40,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              color: THEME.text,
              lineHeight: 20,
            }}
          >
            <Text style={{ fontWeight: '700' }}>Tip:</Text> Smaller models (Tiny, Base) are faster
            but less accurate. Larger models (Small) are more accurate but slower and use more
            storage. We recommend the Tiny model for most users.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
