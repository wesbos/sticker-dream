/**
 * Language Service for Whisper Multi-Language Support
 * Manages language preferences, model downloads, and storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import {
  LanguageCode,
  LanguagePreference,
  WhisperModel,
  WhisperModelType,
  ModelDownloadProgress,
  ModelDownloadResult,
  ModelVerificationResult,
  LanguageAvailability,
  DownloadProgressCallback,
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  getModelByType,
  getRecommendedModelForLanguage,
  getCompatibleModels,
  SupportedLanguage,
  WHISPER_MODELS,
} from '../types/whisper.types';

// AsyncStorage keys
const STORAGE_KEY_LANGUAGE_PREFERENCE = '@sticker_dream:language_preference';
const STORAGE_KEY_FIRST_LAUNCH = '@sticker_dream:first_launch';

// Default language and model
const DEFAULT_LANGUAGE: LanguageCode = 'en';
const DEFAULT_MODEL: WhisperModelType = 'tiny.en';

// Models directory
const MODELS_DIR = `${FileSystem.documentDirectory}whisper_models/`;

/**
 * Language Service Class
 */
class LanguageService {
  private currentPreference: LanguagePreference | null = null;

  /**
   * Initialize the language service
   * Creates models directory if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      // Ensure models directory exists
      const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
      }

      // Load saved preference
      this.currentPreference = await this.loadPreference();
    } catch (error) {
      console.warn('Error initializing language service:', error);
      // Continue with defaults
      this.currentPreference = {
        languageCode: DEFAULT_LANGUAGE,
        modelType: DEFAULT_MODEL,
        updatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Load language preference from AsyncStorage
   */
  private async loadPreference(): Promise<LanguagePreference> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE_PREFERENCE);
      if (stored) {
        const parsed = JSON.parse(stored) as LanguagePreference;
        return parsed;
      }
    } catch (error) {
      console.warn('Error loading language preference:', error);
    }

    return {
      languageCode: DEFAULT_LANGUAGE,
      modelType: DEFAULT_MODEL,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Save language preference to AsyncStorage
   */
  private async savePreference(preference: LanguagePreference): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE_PREFERENCE, JSON.stringify(preference));
      this.currentPreference = preference;
    } catch (error) {
      throw new Error(
        `Failed to save language preference: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get current language preference
   */
  async getLanguage(): Promise<LanguagePreference> {
    if (!this.currentPreference) {
      await this.initialize();
    }
    return this.currentPreference!;
  }

  /**
   * Set language preference
   * @param languageCode - Language to set
   * @param modelType - Optional specific model to use (defaults to recommended)
   */
  async setLanguage(
    languageCode: LanguageCode,
    modelType?: WhisperModelType
  ): Promise<LanguagePreference> {
    const language = getLanguageByCode(languageCode);
    if (!language) {
      throw new Error(`Unsupported language code: ${languageCode}`);
    }

    // Determine which model to use
    let selectedModel: WhisperModel;
    if (modelType) {
      const model = getModelByType(modelType);
      if (!model) {
        throw new Error(`Invalid model type: ${modelType}`);
      }
      selectedModel = model;
    } else {
      selectedModel = getRecommendedModelForLanguage(languageCode);
    }

    // Validate model compatibility
    const compatibleModels = getCompatibleModels(languageCode);
    if (!compatibleModels.find((m) => m.type === selectedModel.type)) {
      throw new Error(`Model ${selectedModel.type} is not compatible with language ${languageCode}`);
    }

    const preference: LanguagePreference = {
      languageCode,
      modelType: selectedModel.type,
      updatedAt: new Date().toISOString(),
    };

    await this.savePreference(preference);
    return preference;
  }

  /**
   * Get local file path for a model
   */
  getModelPath(modelType: WhisperModelType): string {
    const model = getModelByType(modelType);
    if (!model) {
      throw new Error(`Invalid model type: ${modelType}`);
    }
    return `${MODELS_DIR}${model.filename}`;
  }

  /**
   * Check if a model is downloaded
   */
  async isModelDownloaded(modelType: WhisperModelType): Promise<boolean> {
    try {
      const filePath = this.getModelPath(modelType);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      return fileInfo.exists;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify model file integrity
   */
  async verifyModel(modelType: WhisperModelType): Promise<ModelVerificationResult> {
    const model = getModelByType(modelType);
    if (!model) {
      throw new Error(`Invalid model type: ${modelType}`);
    }

    const filePath = this.getModelPath(modelType);
    const expectedSize = model.sizeMB * 1024 * 1024; // Convert MB to bytes

    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (!fileInfo.exists) {
        return {
          exists: false,
          sizeMatches: false,
          filePath,
          expectedSize,
        };
      }

      const actualSize = fileInfo.size || 0;
      // Allow 1% variance in file size
      const sizeMatches = Math.abs(actualSize - expectedSize) < expectedSize * 0.01;

      return {
        exists: true,
        sizeMatches,
        filePath,
        actualSize,
        expectedSize,
      };
    } catch (error) {
      return {
        exists: false,
        sizeMatches: false,
        filePath,
        expectedSize,
      };
    }
  }

  /**
   * Download a Whisper model with progress tracking
   */
  async downloadModel(
    modelType: WhisperModelType,
    onProgress?: DownloadProgressCallback
  ): Promise<ModelDownloadResult> {
    const model = getModelByType(modelType);
    if (!model) {
      throw new Error(`Invalid model type: ${modelType}`);
    }

    const filePath = this.getModelPath(modelType);
    const startTime = Date.now();

    try {
      // Check if already downloaded
      const isDownloaded = await this.isModelDownloaded(modelType);
      if (isDownloaded) {
        // Verify integrity
        const verification = await this.verifyModel(modelType);
        if (verification.sizeMatches) {
          return {
            success: true,
            filePath,
            duration: 0,
          };
        }
        // If size doesn't match, delete and re-download
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      }

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(MODELS_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
      }

      // Track download progress
      let lastUpdateTime = Date.now();
      let lastDownloadedBytes = 0;

      const downloadResumable = FileSystem.createDownloadResumable(
        model.downloadUrl,
        filePath,
        {},
        (downloadProgress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;

          // Calculate speed
          const now = Date.now();
          const timeDiff = (now - lastUpdateTime) / 1000; // seconds
          const bytesDiff = totalBytesWritten - lastDownloadedBytes;
          const speedBps = timeDiff > 0 ? bytesDiff / timeDiff : 0;
          const speedMBps = speedBps / (1024 * 1024);

          // Calculate ETA
          const remainingBytes = totalBytesExpectedToWrite - totalBytesWritten;
          const estimatedTimeRemaining = speedBps > 0 ? remainingBytes / speedBps : 0;

          // Calculate percentage
          const percentage =
            totalBytesExpectedToWrite > 0
              ? (totalBytesWritten / totalBytesExpectedToWrite) * 100
              : 0;

          // Update tracking variables
          lastUpdateTime = now;
          lastDownloadedBytes = totalBytesWritten;

          // Call progress callback
          onProgress?.({
            totalBytes: totalBytesExpectedToWrite,
            downloadedBytes: totalBytesWritten,
            percentage,
            speedMBps,
            estimatedTimeRemaining,
            status: `Downloading ${model.displayName}...`,
          });
        }
      );

      // Perform download
      const result = await downloadResumable.downloadAsync();

      if (!result) {
        throw new Error('Download failed: No result returned');
      }

      // Verify downloaded file
      const verification = await this.verifyModel(modelType);
      if (!verification.exists || !verification.sizeMatches) {
        // Clean up corrupted download
        await FileSystem.deleteAsync(filePath, { idempotent: true });
        throw new Error(
          `Downloaded file verification failed. Expected ${verification.expectedSize} bytes, got ${verification.actualSize || 0} bytes`
        );
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        filePath,
        duration,
      };
    } catch (error) {
      // Clean up partial download
      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } catch (cleanupError) {
        console.warn('Error cleaning up failed download:', cleanupError);
      }

      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      return {
        success: false,
        error: `Download failed: ${errorMessage}`,
        duration,
      };
    }
  }

  /**
   * Delete a downloaded model to free up space
   */
  async deleteModel(modelType: WhisperModelType): Promise<void> {
    try {
      const filePath = this.getModelPath(modelType);
      await FileSystem.deleteAsync(filePath, { idempotent: true });
    } catch (error) {
      throw new Error(
        `Failed to delete model: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get all available languages with download status
   */
  async getAvailableLanguages(): Promise<LanguageAvailability[]> {
    const availabilities: LanguageAvailability[] = [];

    for (const language of SUPPORTED_LANGUAGES) {
      const recommendedModel = getRecommendedModelForLanguage(language.code);
      const isDownloaded = await this.isModelDownloaded(recommendedModel.type);
      const localPath = isDownloaded ? this.getModelPath(recommendedModel.type) : undefined;
      const alternativeModels = getCompatibleModels(language.code).filter(
        (m) => m.type !== recommendedModel.type
      );

      availabilities.push({
        language,
        recommendedModel,
        isDownloaded,
        localPath,
        alternativeModels,
      });
    }

    return availabilities;
  }

  /**
   * Get total size of all downloaded models
   */
  async getDownloadedModelsSize(): Promise<number> {
    let totalSize = 0;

    try {
      for (const model of WHISPER_MODELS) {
        const isDownloaded = await this.isModelDownloaded(model.type);
        if (isDownloaded) {
          const filePath = this.getModelPath(model.type);
          const fileInfo = await FileSystem.getInfoAsync(filePath);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
          }
        }
      }
    } catch (error) {
      console.warn('Error calculating downloaded models size:', error);
    }

    return totalSize;
  }

  /**
   * Delete all downloaded models
   */
  async deleteAllModels(): Promise<void> {
    try {
      await FileSystem.deleteAsync(MODELS_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
    } catch (error) {
      throw new Error(
        `Failed to delete all models: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if this is the first app launch
   */
  async isFirstLaunch(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY_FIRST_LAUNCH);
      return value === null;
    } catch (error) {
      console.warn('Error checking first launch:', error);
      return false;
    }
  }

  /**
   * Mark first launch as complete
   */
  async markFirstLaunchComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_FIRST_LAUNCH, 'false');
    } catch (error) {
      console.warn('Error marking first launch complete:', error);
    }
  }

  /**
   * Get list of all supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...SUPPORTED_LANGUAGES];
  }

  /**
   * Get list of all available models
   */
  getAvailableModels(): WhisperModel[] {
    return [...WHISPER_MODELS];
  }

  /**
   * Get current model path for active language
   */
  async getCurrentModelPath(): Promise<string> {
    const preference = await this.getLanguage();
    return this.getModelPath(preference.modelType);
  }

  /**
   * Get current model filename for active language
   */
  async getCurrentModelFilename(): Promise<string> {
    const preference = await this.getLanguage();
    const model = getModelByType(preference.modelType);
    if (!model) {
      throw new Error(`Invalid model type: ${preference.modelType}`);
    }
    return model.filename;
  }
}

// Export singleton instance
const languageService = new LanguageService();

/**
 * Initialize language service
 */
export async function initLanguageService(): Promise<void> {
  return languageService.initialize();
}

/**
 * Get current language preference
 */
export async function getLanguage(): Promise<LanguagePreference> {
  return languageService.getLanguage();
}

/**
 * Set language preference
 */
export async function setLanguage(
  languageCode: LanguageCode,
  modelType?: WhisperModelType
): Promise<LanguagePreference> {
  return languageService.setLanguage(languageCode, modelType);
}

/**
 * Download a Whisper model
 */
export async function downloadModel(
  modelType: WhisperModelType,
  onProgress?: DownloadProgressCallback
): Promise<ModelDownloadResult> {
  return languageService.downloadModel(modelType, onProgress);
}

/**
 * Check if a model is downloaded
 */
export async function isModelDownloaded(modelType: WhisperModelType): Promise<boolean> {
  return languageService.isModelDownloaded(modelType);
}

/**
 * Verify model integrity
 */
export async function verifyModel(modelType: WhisperModelType): Promise<ModelVerificationResult> {
  return languageService.verifyModel(modelType);
}

/**
 * Delete a model
 */
export async function deleteModel(modelType: WhisperModelType): Promise<void> {
  return languageService.deleteModel(modelType);
}

/**
 * Get all available languages with download status
 */
export async function getAvailableLanguages(): Promise<LanguageAvailability[]> {
  return languageService.getAvailableLanguages();
}

/**
 * Get total size of downloaded models
 */
export async function getDownloadedModelsSize(): Promise<number> {
  return languageService.getDownloadedModelsSize();
}

/**
 * Delete all models
 */
export async function deleteAllModels(): Promise<void> {
  return languageService.deleteAllModels();
}

/**
 * Check if first launch
 */
export async function isFirstLaunch(): Promise<boolean> {
  return languageService.isFirstLaunch();
}

/**
 * Mark first launch complete
 */
export async function markFirstLaunchComplete(): Promise<void> {
  return languageService.markFirstLaunchComplete();
}

/**
 * Get supported languages
 */
export function getSupportedLanguages(): SupportedLanguage[] {
  return languageService.getSupportedLanguages();
}

/**
 * Get model path
 */
export function getModelPath(modelType: WhisperModelType): string {
  return languageService.getModelPath(modelType);
}

/**
 * Get current model path
 */
export async function getCurrentModelPath(): Promise<string> {
  return languageService.getCurrentModelPath();
}

/**
 * Get current model filename
 */
export async function getCurrentModelFilename(): Promise<string> {
  return languageService.getCurrentModelFilename();
}

export default languageService;
