# Multi-Language Support Documentation

## Overview

Sticker Dream now supports 12+ languages for voice recognition, powered by Whisper AI models. Users can select their preferred language, download the corresponding model, and use voice commands in their native language.

## Features

- **12+ Supported Languages**: English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Chinese, Japanese, Korean, Arabic
- **On-Demand Model Download**: Models are downloaded only when needed
- **Offline Voice Recognition**: Once downloaded, models work completely offline
- **Multiple Model Sizes**: Choose between Tiny (fast), Base (balanced), or Small (accurate)
- **Smart Storage Management**: Track and delete downloaded models to save space
- **First-Time Onboarding**: Beautiful welcome screen guides new users through language setup

## Architecture

### Files Created

1. **types/whisper.types.ts** - Type definitions for language support
   - Language codes and metadata
   - Model information and configurations
   - Download progress tracking types
   - Storage preference types

2. **services/language.service.ts** - Core language management service
   - AsyncStorage integration for preferences
   - Model download with progress tracking
   - File verification and integrity checks
   - Storage management utilities

3. **components/LanguageSelector.tsx** - Reusable language picker
   - Modal-based language selection
   - Real-time download progress
   - Download status indicators
   - Model size display

4. **app/(main)/settings.tsx** - Settings screen
   - Language preference management
   - Downloaded models list
   - Storage usage display
   - Model deletion controls

5. **app/welcome.tsx** - First-time onboarding
   - Welcome message and app features
   - Language selection wizard
   - Model download before first use
   - Skip to English option

### Files Updated

1. **services/whisper.service.ts**
   - Dynamic model loading based on language preference
   - Model verification before initialization
   - Reload functionality for language changes
   - Error handling for missing models

2. **app/_layout.tsx**
   - Language service initialization
   - First launch detection
   - Welcome screen routing
   - Model availability checking

3. **app/(main)/_layout.tsx**
   - Added Settings screen to navigation

4. **app/(main)/index.tsx**
   - Added Settings button to header

5. **components/index.ts**
   - Exported LanguageSelector component

## Supported Languages

| Language   | Code | Flag | Model Required    | Size  |
|------------|------|------|-------------------|-------|
| English    | en   | 🇺🇸   | Tiny English      | 39MB  |
| Spanish    | es   | 🇪🇸   | Tiny Multilingual | 75MB  |
| French     | fr   | 🇫🇷   | Tiny Multilingual | 75MB  |
| German     | de   | 🇩🇪   | Tiny Multilingual | 75MB  |
| Italian    | it   | 🇮🇹   | Tiny Multilingual | 75MB  |
| Portuguese | pt   | 🇵🇹   | Tiny Multilingual | 75MB  |
| Dutch      | nl   | 🇳🇱   | Tiny Multilingual | 75MB  |
| Russian    | ru   | 🇷🇺   | Tiny Multilingual | 75MB  |
| Chinese    | zh   | 🇨🇳   | Tiny Multilingual | 75MB  |
| Japanese   | ja   | 🇯🇵   | Tiny Multilingual | 75MB  |
| Korean     | ko   | 🇰🇷   | Tiny Multilingual | 75MB  |
| Arabic     | ar   | 🇸🇦   | Tiny Multilingual | 75MB  |

## Available Models

### Tiny Models (Recommended for Mobile)
- **ggml-tiny.en.bin** (39MB) - English only, fastest
- **ggml-tiny.bin** (75MB) - All languages, fast

### Base Models (Better Accuracy)
- **ggml-base.en.bin** (142MB) - English only, balanced
- **ggml-base.bin** (147MB) - All languages, balanced

### Small Models (Best Accuracy)
- **ggml-small.en.bin** (466MB) - English only, most accurate
- **ggml-small.bin** (488MB) - All languages, most accurate

## User Flow

### First Launch

1. User signs in with Google
2. Welcome screen appears with app introduction
3. User taps "Get Started"
4. Language selection screen shows all available languages
5. User selects preferred language
6. Model downloads automatically with progress bar
7. User taps "Start Creating" to enter main app

### Changing Language Later

1. User opens Settings (⚙️ icon in main screen)
2. Taps on language selector
3. Selects new language from modal
4. Model downloads if not already present
5. Language changes immediately after download
6. Whisper service reloads with new model

### Managing Storage

1. Settings screen shows total storage used
2. Downloaded models list shows each model with size
3. User can delete individual models (except active one)
4. "Delete All Models" option for complete cleanup
5. Models can be re-downloaded anytime

## API Reference

### Language Service

```typescript
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
```

#### Initialize Service
```typescript
await initLanguageService();
```

#### Get Current Language
```typescript
const preference = await getLanguage();
// Returns: { languageCode: 'en', modelType: 'tiny.en', updatedAt: '...' }
```

#### Set Language
```typescript
await setLanguage('fr'); // Use recommended model
await setLanguage('fr', 'base'); // Use specific model
```

#### Download Model
```typescript
const result = await downloadModel('tiny', (progress) => {
  console.log(`${progress.percentage}%`);
  console.log(`Speed: ${progress.speedMBps} MB/s`);
  console.log(`ETA: ${progress.estimatedTimeRemaining}s`);
});

if (result.success) {
  console.log('Downloaded to:', result.filePath);
} else {
  console.error('Download failed:', result.error);
}
```

#### Check Model Downloaded
```typescript
const downloaded = await isModelDownloaded('tiny.en');
```

#### Verify Model Integrity
```typescript
const verification = await verifyModel('tiny.en');
if (verification.exists && verification.sizeMatches) {
  console.log('Model is valid');
}
```

#### Delete Model
```typescript
await deleteModel('tiny.en');
```

#### Get Available Languages
```typescript
const languages = await getAvailableLanguages();
// Returns array of LanguageAvailability objects
```

#### Get Storage Size
```typescript
const sizeBytes = await getDownloadedModelsSize();
```

### Whisper Service

```typescript
import { initWhisper, reloadModel } from '../services/whisper.service';
```

#### Initialize with Current Language
```typescript
await initWhisper(); // Uses language preference
```

#### Reload After Language Change
```typescript
await setLanguage('es');
await reloadModel(); // Reloads Whisper with Spanish model
```

## Component Usage

### LanguageSelector

```typescript
import LanguageSelector from '../components/LanguageSelector';

<LanguageSelector
  compact={false}
  onLanguageChanged={(languageCode) => {
    console.log('Language changed to:', languageCode);
  }}
  onDownloadStart={(modelType) => {
    console.log('Downloading:', modelType);
  }}
  onDownloadComplete={(success, modelType) => {
    console.log('Download complete:', success);
  }}
/>
```

## Storage

### AsyncStorage Keys

- `@sticker_dream:language_preference` - Current language preference
- `@sticker_dream:first_launch` - First launch flag

### File Storage

Models are stored in:
```
${FileSystem.documentDirectory}whisper_models/
```

Example paths:
- `whisper_models/ggml-tiny.en.bin`
- `whisper_models/ggml-tiny.bin`
- `whisper_models/ggml-base.bin`

## Error Handling

### Model Not Downloaded
```typescript
try {
  await initWhisper();
} catch (error) {
  if (error.message.includes('Model not found')) {
    // Show download prompt
    Alert.alert(
      'Model Required',
      'Please download the language model in Settings.',
      [{ text: 'Open Settings', onPress: () => router.push('/settings') }]
    );
  }
}
```

### Download Failed
```typescript
const result = await downloadModel('tiny', onProgress);
if (!result.success) {
  Alert.alert('Download Failed', result.error);
  // Retry or select different model
}
```

### Network Issues
- Download includes automatic retry mechanism
- Progress tracking allows resuming
- File verification ensures integrity
- Partial downloads are cleaned up automatically

## Performance Considerations

### Model Selection

- **Tiny models**: Fast transcription (< 1s for 5s audio), good for real-time
- **Base models**: Moderate speed, better accuracy
- **Small models**: Slower (3-5s for 5s audio), best accuracy

### Memory Usage

- Only one model loaded at a time
- Model switching requires reload (~1-2s)
- Models are memory-mapped, not fully loaded into RAM

### Storage Optimization

- Delete unused models to save space
- Recommend Tiny models for most users
- Only download additional models when accuracy is critical

## Testing

### Test First Launch
```typescript
// Clear AsyncStorage
await AsyncStorage.multiRemove([
  '@sticker_dream:language_preference',
  '@sticker_dream:first_launch',
]);

// Delete all models
await deleteAllModels();

// Restart app - welcome screen should appear
```

### Test Language Change
```typescript
// Set language to French
await setLanguage('fr');

// Reload Whisper
await reloadModel();

// Test transcription in French
const audioUri = '...';
const result = await transcribeAudio(audioUri);
```

### Test Download Progress
```typescript
await downloadModel('tiny', (progress) => {
  console.log({
    percentage: progress.percentage,
    speed: progress.speedMBps,
    eta: progress.estimatedTimeRemaining,
  });
});
```

## Troubleshooting

### Model Download Hangs
- Check internet connection
- Verify Hugging Face is accessible
- Try deleting partial download and retrying
- Check available storage space

### Transcription Not Working
- Verify model is downloaded: `await isModelDownloaded(modelType)`
- Check model integrity: `await verifyModel(modelType)`
- Re-download if corrupted: `await deleteModel()` then `await downloadModel()`

### Wrong Language Detected
- Ensure correct language model is active
- Check language preference: `await getLanguage()`
- Reload model: `await reloadModel()`

### Storage Issues
- Check total size: `await getDownloadedModelsSize()`
- Delete unused models: `await deleteModel()`
- Keep only actively used language models

## Future Enhancements

Potential improvements for future versions:

1. **Model Auto-Update**: Check for updated models periodically
2. **Quality Settings**: Let users choose speed vs. accuracy
3. **Language Auto-Detection**: Automatically detect spoken language
4. **Cloud Sync**: Sync preferences across devices
5. **Compression**: Compress models to reduce storage
6. **Partial Downloads**: Resume interrupted downloads
7. **Model Caching**: Pre-download popular models
8. **Usage Analytics**: Track which languages are used most

## Credits

- **Whisper Models**: [OpenAI Whisper](https://github.com/openai/whisper)
- **Model Hosting**: [Hugging Face](https://huggingface.co/ggerganov/whisper.cpp)
- **React Native Integration**: [whisper.rn](https://github.com/mybigday/whisper.rn)
