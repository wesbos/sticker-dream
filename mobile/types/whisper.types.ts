/**
 * Types for multi-language Whisper model support
 * Manages language selection, model downloading, and preference storage
 */

/**
 * Supported language codes following ISO 639-1 standard
 */
export type LanguageCode =
  | 'en' // English
  | 'fr' // French
  | 'es' // Spanish
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'nl' // Dutch
  | 'ru' // Russian
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ar'; // Arabic

/**
 * Supported language with display information
 */
export interface SupportedLanguage {
  /** ISO 639-1 language code */
  code: LanguageCode;
  /** Display name in English */
  name: string;
  /** Display name in native language */
  nativeName: string;
  /** Flag emoji for visual representation */
  flag: string;
  /** Whether this language requires multilingual model */
  requiresMultilingual: boolean;
}

/**
 * Whisper model types available for download
 */
export type WhisperModelType =
  | 'tiny.en'
  | 'tiny'
  | 'base.en'
  | 'base'
  | 'small.en'
  | 'small';

/**
 * Whisper model metadata
 */
export interface WhisperModel {
  /** Model identifier (e.g., 'tiny.en', 'base') */
  type: WhisperModelType;
  /** Model filename */
  filename: string;
  /** Display name for UI */
  displayName: string;
  /** File size in megabytes */
  sizeMB: number;
  /** Whether model supports multiple languages */
  isMultilingual: boolean;
  /** Supported language codes (empty array means all languages) */
  supportedLanguages: LanguageCode[];
  /** Download URL from Hugging Face */
  downloadUrl: string;
  /** Quality level: 'fast' | 'balanced' | 'accurate' */
  quality: 'fast' | 'balanced' | 'accurate';
  /** Recommended for production use */
  recommended: boolean;
}

/**
 * Language preference stored in AsyncStorage
 */
export interface LanguagePreference {
  /** Selected language code */
  languageCode: LanguageCode;
  /** Selected model type */
  modelType: WhisperModelType;
  /** When the preference was set */
  updatedAt: string;
}

/**
 * Model download progress information
 */
export interface ModelDownloadProgress {
  /** Total bytes to download */
  totalBytes: number;
  /** Bytes downloaded so far */
  downloadedBytes: number;
  /** Download percentage (0-100) */
  percentage: number;
  /** Current download speed in MB/s */
  speedMBps: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining: number;
  /** Current status message */
  status: string;
}

/**
 * Model download result
 */
export interface ModelDownloadResult {
  /** Whether download was successful */
  success: boolean;
  /** Local file path where model is stored */
  filePath?: string;
  /** Error message if download failed */
  error?: string;
  /** Download duration in milliseconds */
  duration: number;
}

/**
 * Model verification result
 */
export interface ModelVerificationResult {
  /** Whether model file exists */
  exists: boolean;
  /** Whether model file size is correct */
  sizeMatches: boolean;
  /** Local file path */
  filePath?: string;
  /** Actual file size in bytes */
  actualSize?: number;
  /** Expected file size in bytes */
  expectedSize?: number;
}

/**
 * Language availability info for UI display
 */
export interface LanguageAvailability {
  /** Language information */
  language: SupportedLanguage;
  /** Recommended model for this language */
  recommendedModel: WhisperModel;
  /** Whether recommended model is downloaded */
  isDownloaded: boolean;
  /** Local file path if downloaded */
  localPath?: string;
  /** Available alternative models */
  alternativeModels: WhisperModel[];
}

/**
 * Callback type for download progress updates
 */
export type DownloadProgressCallback = (progress: ModelDownloadProgress) => void;

/**
 * Predefined list of supported languages
 */
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    requiresMultilingual: false,
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    requiresMultilingual: true,
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    requiresMultilingual: true,
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    requiresMultilingual: true,
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    requiresMultilingual: true,
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    requiresMultilingual: true,
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    requiresMultilingual: true,
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    requiresMultilingual: true,
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    requiresMultilingual: true,
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    requiresMultilingual: true,
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    requiresMultilingual: true,
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    requiresMultilingual: true,
  },
];

/**
 * Available Whisper models with metadata
 */
export const WHISPER_MODELS: WhisperModel[] = [
  {
    type: 'tiny.en',
    filename: 'ggml-tiny.en.bin',
    displayName: 'Tiny (English Only)',
    sizeMB: 39,
    isMultilingual: false,
    supportedLanguages: ['en'],
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin',
    quality: 'fast',
    recommended: true,
  },
  {
    type: 'tiny',
    filename: 'ggml-tiny.bin',
    displayName: 'Tiny (Multilingual)',
    sizeMB: 75,
    isMultilingual: true,
    supportedLanguages: [],
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin',
    quality: 'fast',
    recommended: true,
  },
  {
    type: 'base.en',
    filename: 'ggml-base.en.bin',
    displayName: 'Base (English Only)',
    sizeMB: 142,
    isMultilingual: false,
    supportedLanguages: ['en'],
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin',
    quality: 'balanced',
    recommended: false,
  },
  {
    type: 'base',
    filename: 'ggml-base.bin',
    displayName: 'Base (Multilingual)',
    sizeMB: 147,
    isMultilingual: true,
    supportedLanguages: [],
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin',
    quality: 'balanced',
    recommended: false,
  },
  {
    type: 'small.en',
    filename: 'ggml-small.en.bin',
    displayName: 'Small (English Only)',
    sizeMB: 466,
    isMultilingual: false,
    supportedLanguages: ['en'],
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin',
    quality: 'accurate',
    recommended: false,
  },
  {
    type: 'small',
    filename: 'ggml-small.bin',
    displayName: 'Small (Multilingual)',
    sizeMB: 488,
    isMultilingual: true,
    supportedLanguages: [],
    downloadUrl: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin',
    quality: 'accurate',
    recommended: false,
  },
];

/**
 * Get language by code
 */
export function getLanguageByCode(code: LanguageCode): SupportedLanguage | undefined {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code);
}

/**
 * Get model by type
 */
export function getModelByType(type: WhisperModelType): WhisperModel | undefined {
  return WHISPER_MODELS.find((model) => model.type === type);
}

/**
 * Get model by filename
 */
export function getModelByFilename(filename: string): WhisperModel | undefined {
  return WHISPER_MODELS.find((model) => model.filename === filename);
}

/**
 * Get recommended model for a language
 */
export function getRecommendedModelForLanguage(languageCode: LanguageCode): WhisperModel {
  const language = getLanguageByCode(languageCode);

  if (!language) {
    // Default to English tiny model
    return WHISPER_MODELS.find((m) => m.type === 'tiny.en')!;
  }

  if (language.requiresMultilingual) {
    // Return tiny multilingual for non-English languages
    return WHISPER_MODELS.find((m) => m.type === 'tiny')!;
  } else {
    // Return tiny English for English
    return WHISPER_MODELS.find((m) => m.type === 'tiny.en')!;
  }
}

/**
 * Get all models compatible with a language
 */
export function getCompatibleModels(languageCode: LanguageCode): WhisperModel[] {
  const language = getLanguageByCode(languageCode);

  if (!language) {
    return [];
  }

  return WHISPER_MODELS.filter((model) => {
    if (model.isMultilingual) {
      return true; // Multilingual models support all languages
    }
    return model.supportedLanguages.includes(languageCode);
  });
}
