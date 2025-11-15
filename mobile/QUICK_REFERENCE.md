# Multi-Language Support - Quick Reference Card

## 🚀 Quick Start

```typescript
// Initialize language service
import { initLanguageService } from './services/language.service';
await initLanguageService();

// Get current language
import { getLanguage } from './services/language.service';
const { languageCode, modelType } = await getLanguage();

// Change language
import { setLanguage } from './services/language.service';
await setLanguage('fr'); // French
await setLanguage('es', 'base'); // Spanish with Base model

// Reload Whisper after language change
import { reloadModel } from './services/whisper.service';
await reloadModel();
```

## 📦 Import Paths

```typescript
// Types
import {
  LanguageCode,
  SupportedLanguage,
  WhisperModel,
  LanguagePreference,
  ModelDownloadProgress,
} from '../types/whisper.types';

// Language Service
import {
  initLanguageService,
  getLanguage,
  setLanguage,
  downloadModel,
  isModelDownloaded,
  verifyModel,
  deleteModel,
  getAvailableLanguages,
  getDownloadedModelsSize,
  deleteAllModels,
  isFirstLaunch,
  markFirstLaunchComplete,
} from '../services/language.service';

// Whisper Service
import {
  initWhisper,
  reloadModel,
  transcribeAudio,
} from '../services/whisper.service';

// Component
import LanguageSelector from '../components/LanguageSelector';
```

## 🌍 Language Codes

```typescript
type LanguageCode =
  | 'en' // English
  | 'es' // Spanish
  | 'fr' // French
  | 'de' // German
  | 'it' // Italian
  | 'pt' // Portuguese
  | 'nl' // Dutch
  | 'ru' // Russian
  | 'zh' // Chinese
  | 'ja' // Japanese
  | 'ko' // Korean
  | 'ar'; // Arabic
```

## 📊 Model Types

```typescript
type WhisperModelType =
  | 'tiny.en'   // 39MB, English only, fast
  | 'tiny'      // 75MB, Multilingual, fast
  | 'base.en'   // 142MB, English only, balanced
  | 'base'      // 147MB, Multilingual, balanced
  | 'small.en'  // 466MB, English only, accurate
  | 'small';    // 488MB, Multilingual, accurate
```

## 🔧 Common Operations

### Download a Model with Progress

```typescript
import { downloadModel } from '../services/language.service';

const result = await downloadModel('tiny', (progress) => {
  console.log(`${progress.percentage.toFixed(0)}%`);
  console.log(`${progress.speedMBps.toFixed(1)} MB/s`);
  console.log(`${Math.ceil(progress.estimatedTimeRemaining)}s remaining`);
});

if (result.success) {
  console.log('Downloaded to:', result.filePath);
} else {
  console.error('Failed:', result.error);
}
```

### Check if Model is Downloaded

```typescript
import { isModelDownloaded } from '../services/language.service';

const downloaded = await isModelDownloaded('tiny.en');
if (!downloaded) {
  // Show download prompt
}
```

### Get All Available Languages

```typescript
import { getAvailableLanguages } from '../services/language.service';

const languages = await getAvailableLanguages();
languages.forEach(({ language, isDownloaded, recommendedModel }) => {
  console.log(`${language.flag} ${language.name}: ${isDownloaded ? 'Downloaded' : 'Not downloaded'}`);
});
```

### Delete a Model

```typescript
import { deleteModel } from '../services/language.service';

await deleteModel('tiny');
console.log('Model deleted');
```

### Get Storage Usage

```typescript
import { getDownloadedModelsSize } from '../services/language.service';

const bytes = await getDownloadedModelsSize();
const mb = (bytes / (1024 * 1024)).toFixed(2);
console.log(`Using ${mb} MB of storage`);
```

## 🎨 Use LanguageSelector Component

```typescript
import LanguageSelector from '../components/LanguageSelector';

<LanguageSelector
  compact={false}
  onLanguageChanged={(languageCode) => {
    console.log('Language changed to:', languageCode);
    // Optionally reload Whisper
    reloadModel();
  }}
  onDownloadStart={(modelType) => {
    console.log('Starting download:', modelType);
  }}
  onDownloadComplete={(success, modelType) => {
    if (success) {
      console.log('Download complete:', modelType);
    } else {
      console.log('Download failed:', modelType);
    }
  }}
/>
```

## 🔄 Complete Language Change Flow

```typescript
import { setLanguage } from '../services/language.service';
import { reloadModel } from '../services/whisper.service';

async function changeLanguage(newLanguage: LanguageCode) {
  try {
    // 1. Set new language preference
    await setLanguage(newLanguage);

    // 2. Reload Whisper with new model
    await reloadModel();

    // 3. Notify user
    console.log('Language changed successfully');
  } catch (error) {
    console.error('Failed to change language:', error);
    // Handle error (show download prompt if model missing)
  }
}
```

## 🚨 Error Handling

```typescript
import { initWhisper } from '../services/whisper.service';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

try {
  await initWhisper();
} catch (error) {
  if (error.message.includes('Model not found')) {
    Alert.alert(
      'Model Required',
      'Please download the language model in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => router.push('/(main)/settings')
        }
      ]
    );
  }
}
```

## 💾 Storage Paths

```typescript
// Models directory
${FileSystem.documentDirectory}whisper_models/

// Model files
whisper_models/ggml-tiny.en.bin
whisper_models/ggml-tiny.bin
whisper_models/ggml-base.en.bin
whisper_models/ggml-base.bin
whisper_models/ggml-small.en.bin
whisper_models/ggml-small.bin

// AsyncStorage keys
@sticker_dream:language_preference
@sticker_dream:first_launch
```

## 🎯 Navigation Routes

```typescript
// Settings screen
router.push('/(main)/settings');

// Welcome screen (first launch only)
router.push('/welcome');

// After completing welcome
router.replace('/(main)');
```

## 🧪 Testing Helpers

```typescript
// Reset to first launch
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.multiRemove([
  '@sticker_dream:language_preference',
  '@sticker_dream:first_launch',
]);

// Delete all models
import { deleteAllModels } from '../services/language.service';
await deleteAllModels();

// Check first launch status
import { isFirstLaunch } from '../services/language.service';
const isFirst = await isFirstLaunch();
```

## 📱 Screen Integration

### Add Settings Button to Any Screen

```typescript
import { useRouter } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

const router = useRouter();

<TouchableOpacity onPress={() => router.push('/(main)/settings')}>
  <Text>⚙️</Text>
</TouchableOpacity>
```

### Show Language Selector in Modal

```typescript
import { useState } from 'react';
import { Modal, View } from 'react-native';
import LanguageSelector from '../components/LanguageSelector';

const [showSelector, setShowSelector] = useState(false);

<Modal visible={showSelector} onRequestClose={() => setShowSelector(false)}>
  <View style={{ padding: 20 }}>
    <LanguageSelector onLanguageChanged={() => setShowSelector(false)} />
  </View>
</Modal>
```

## 🎨 UI Theme Colors

```typescript
import { THEME } from '../app/_layout';

THEME.primary    // #FFE5F1 - Main background
THEME.secondary  // #B8E6FF - Buttons
THEME.tertiary   // #D4E5FF - Accents
THEME.accent     // #FFD4F1 - Highlights
THEME.text       // #2C3E50 - Text
THEME.success    // #27AE60 - Success
THEME.error      // #E74C3C - Errors
```

## 📋 Type Definitions Quick Ref

```typescript
// Language Preference (stored in AsyncStorage)
interface LanguagePreference {
  languageCode: LanguageCode;
  modelType: WhisperModelType;
  updatedAt: string; // ISO date string
}

// Download Progress
interface ModelDownloadProgress {
  totalBytes: number;
  downloadedBytes: number;
  percentage: number; // 0-100
  speedMBps: number;
  estimatedTimeRemaining: number; // seconds
  status: string;
}

// Language with Availability
interface LanguageAvailability {
  language: SupportedLanguage;
  recommendedModel: WhisperModel;
  isDownloaded: boolean;
  localPath?: string;
  alternativeModels: WhisperModel[];
}
```

## 🔗 Useful Links

- Full Documentation: `/mobile/MULTI_LANGUAGE_SUPPORT.md`
- Quick Start: `/mobile/MULTI_LANGUAGE_QUICK_START.md`
- Changelog: `/mobile/CHANGELOG_MULTI_LANGUAGE.md`
- File Structure: `/mobile/FILE_STRUCTURE.txt`

---

**Last Updated:** 2025-11-15
**Version:** 2.0.0
**Status:** Production Ready ✅
