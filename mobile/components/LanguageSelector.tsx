/**
 * LanguageSelector Component
 * Reusable dropdown/modal picker for language selection with download management
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  LanguageAvailability,
  ModelDownloadProgress,
  LanguageCode,
  WhisperModelType,
} from '../types/whisper.types';
import {
  getAvailableLanguages,
  setLanguage,
  downloadModel,
  getLanguage,
} from '../services/language.service';
import { THEME } from '../app/_layout';

interface LanguageSelectorProps {
  /** Whether to show the selector in compact mode */
  compact?: boolean;
  /** Callback when language is successfully changed */
  onLanguageChanged?: (languageCode: LanguageCode) => void;
  /** Callback when download starts */
  onDownloadStart?: (modelType: WhisperModelType) => void;
  /** Callback when download completes */
  onDownloadComplete?: (success: boolean, modelType: WhisperModelType) => void;
}

export default function LanguageSelector({
  compact = false,
  onLanguageChanged,
  onDownloadStart,
  onDownloadComplete,
}: LanguageSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [languages, setLanguages] = useState<LanguageAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLanguageCode, setCurrentLanguageCode] = useState<LanguageCode>('en');
  const [downloadingModel, setDownloadingModel] = useState<WhisperModelType | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ModelDownloadProgress | null>(null);

  // Load languages on mount
  useEffect(() => {
    loadLanguages();
  }, []);

  // Load available languages and current selection
  const loadLanguages = async () => {
    try {
      setLoading(true);
      const [availableLanguages, currentLang] = await Promise.all([
        getAvailableLanguages(),
        getLanguage(),
      ]);
      setLanguages(availableLanguages);
      setCurrentLanguageCode(currentLang.languageCode);
    } catch (error) {
      console.error('Error loading languages:', error);
      Alert.alert('Error', 'Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  // Handle language selection
  const handleSelectLanguage = async (
    languageCode: LanguageCode,
    modelType: WhisperModelType,
    isDownloaded: boolean
  ) => {
    // If model not downloaded, start download
    if (!isDownloaded) {
      await handleDownloadModel(languageCode, modelType);
      return;
    }

    // Set language immediately if already downloaded
    try {
      await setLanguage(languageCode, modelType);
      setCurrentLanguageCode(languageCode);
      onLanguageChanged?.(languageCode);
      setModalVisible(false);
      Alert.alert('Success', 'Language changed successfully');
    } catch (error) {
      console.error('Error setting language:', error);
      Alert.alert('Error', 'Failed to change language');
    }
  };

  // Handle model download
  const handleDownloadModel = async (languageCode: LanguageCode, modelType: WhisperModelType) => {
    setDownloadingModel(modelType);
    onDownloadStart?.(modelType);

    try {
      const result = await downloadModel(modelType, (progress) => {
        setDownloadProgress(progress);
      });

      if (result.success) {
        // Reload languages to update download status
        await loadLanguages();

        // Set as active language
        await setLanguage(languageCode, modelType);
        setCurrentLanguageCode(languageCode);
        onLanguageChanged?.(languageCode);
        onDownloadComplete?.(true, modelType);

        Alert.alert('Success', 'Model downloaded and activated successfully');
        setModalVisible(false);
      } else {
        onDownloadComplete?.(false, modelType);
        Alert.alert('Download Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      onDownloadComplete?.(false, modelType);
      console.error('Error downloading model:', error);
      Alert.alert('Error', 'Failed to download model');
    } finally {
      setDownloadingModel(null);
      setDownloadProgress(null);
    }
  };

  // Format file size
  const formatSize = (sizeMB: number): string => {
    if (sizeMB < 1024) {
      return `${sizeMB}MB`;
    }
    return `${(sizeMB / 1024).toFixed(1)}GB`;
  };

  // Get current language display info
  const currentLanguage = languages.find((l) => l.language.code === currentLanguageCode);

  if (loading) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={THEME.text} />
      </View>
    );
  }

  return (
    <View>
      {/* Selector Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
        style={{
          backgroundColor: THEME.secondary,
          borderRadius: compact ? 8 : 12,
          padding: compact ? 12 : 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: compact ? 20 : 24, marginRight: 8 }}>
            {currentLanguage?.language.flag || '🌐'}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: compact ? 14 : 16,
                fontWeight: '700',
                color: THEME.text,
              }}
            >
              {currentLanguage?.language.name || 'Select Language'}
            </Text>
            {!compact && currentLanguage && (
              <Text
                style={{
                  fontSize: 12,
                  color: THEME.text,
                  opacity: 0.6,
                  marginTop: 2,
                }}
              >
                {currentLanguage.language.nativeName}
              </Text>
            )}
          </View>
        </View>
        <Text style={{ fontSize: 18, color: THEME.text, opacity: 0.5 }}>▼</Text>
      </TouchableOpacity>

      {/* Language Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: THEME.primary,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: '80%',
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: THEME.border,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: THEME.text,
                }}
              >
                Select Language
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} activeOpacity={0.7}>
                <Text style={{ fontSize: 24, color: THEME.text }}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Language List */}
            <ScrollView
              style={{ maxHeight: '100%' }}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {languages.map((langAvail) => {
                const isSelected = langAvail.language.code === currentLanguageCode;
                const isCurrentlyDownloading =
                  downloadingModel === langAvail.recommendedModel.type;

                return (
                  <TouchableOpacity
                    key={langAvail.language.code}
                    onPress={() =>
                      handleSelectLanguage(
                        langAvail.language.code,
                        langAvail.recommendedModel.type,
                        langAvail.isDownloaded
                      )
                    }
                    disabled={isCurrentlyDownloading}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: isSelected ? THEME.tertiary : THEME.secondary,
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: THEME.text,
                      opacity: isCurrentlyDownloading ? 0.6 : 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Flag */}
                      <Text style={{ fontSize: 32, marginRight: 12 }}>
                        {langAvail.language.flag}
                      </Text>

                      {/* Language Info */}
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
                            fontSize: 14,
                            color: THEME.text,
                            opacity: 0.7,
                            marginTop: 2,
                          }}
                        >
                          {langAvail.language.nativeName}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: THEME.text,
                            opacity: 0.5,
                            marginTop: 4,
                          }}
                        >
                          Model: {formatSize(langAvail.recommendedModel.sizeMB)}
                        </Text>
                      </View>

                      {/* Status Indicator */}
                      <View style={{ alignItems: 'flex-end' }}>
                        {isSelected && (
                          <View
                            style={{
                              backgroundColor: THEME.success,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 4,
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
                        )}
                        {!langAvail.isDownloaded && !isCurrentlyDownloading && (
                          <View
                            style={{
                              backgroundColor: THEME.accent,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10,
                                fontWeight: '700',
                                color: THEME.text,
                              }}
                            >
                              DOWNLOAD
                            </Text>
                          </View>
                        )}
                        {langAvail.isDownloaded && !isSelected && (
                          <Text style={{ fontSize: 20 }}>✓</Text>
                        )}
                        {isCurrentlyDownloading && (
                          <ActivityIndicator size="small" color={THEME.text} />
                        )}
                      </View>
                    </View>

                    {/* Download Progress */}
                    {isCurrentlyDownloading && downloadProgress && (
                      <View style={{ marginTop: 12 }}>
                        <View
                          style={{
                            height: 4,
                            backgroundColor: THEME.border,
                            borderRadius: 2,
                            overflow: 'hidden',
                            marginBottom: 6,
                          }}
                        >
                          <View
                            style={{
                              height: '100%',
                              backgroundColor: THEME.text,
                              width: `${downloadProgress.percentage}%`,
                            }}
                          />
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            color: THEME.text,
                            opacity: 0.6,
                          }}
                        >
                          {downloadProgress.percentage.toFixed(0)}% • {downloadProgress.speedMBps.toFixed(1)} MB/s
                          {downloadProgress.estimatedTimeRemaining > 0 &&
                            ` • ${Math.ceil(downloadProgress.estimatedTimeRemaining)}s remaining`}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
