# Assets Directory

This directory contains all static assets required for the Sticker Dream React Native application, including app icons, splash screens, sound effects, and ML models.

## Directory Structure

```
assets/
├── README.md (this file)
├── images/          # App icons and splash screens for iOS and Android
├── sounds/          # Audio files for UI feedback and notifications
├── models/          # Machine learning models (Whisper for speech-to-text)
├── fonts/           # Custom font files (if needed)
└── .gitkeep files   # Ensure git tracks empty directories
```

## Asset Categories

### 1. Images (`/images`)
- **App Icons**: Square images in various sizes for iOS and Android app launchers
- **Splash Screens**: Full-screen images displayed during app startup
- **UI Graphics**: Custom icons or illustrations used in the interface

**Supported Formats**: PNG (recommended, supports transparency), JPG
**Color Space**: sRGB for web/Android, sRGB or P3 for iOS

See `images/README.md` for detailed specifications.

### 2. Sounds (`/sounds`)
Audio files for user feedback, notifications, and interactive elements.

**Supported Formats**:
- MP3 (good compression, wide compatibility)
- WAV (lossless, higher quality)
- M4A (optimized for iOS)

**Sample Rate**: 44.1 kHz or 48 kHz
**Bit Depth**: 16-bit or 24-bit

See `sounds/README.md` for required sound files and specifications.

### 3. Models (`/models`)
Machine learning models used for on-device inference (e.g., speech recognition).

Currently includes:
- **Whisper (OpenAI)**: For speech-to-text transcription
  - Format: GGML (GGML quantized format for efficient inference)
  - Model: ggml-tiny.en.bin (lightweight, English-only)

See `models/README.md` for download instructions and setup details.

### 4. Fonts (`/fonts`)
Custom font files for the application (optional).

**Supported Formats**: TTF, OTF

## Important Notes

### File Size Optimization
- Keep image files as small as possible without losing quality
- Use appropriate image formats (PNG for graphics with transparency, JPG for photos)
- Consider using image optimization tools (ImageOptim, tinypng.com)
- For models, larger file sizes are acceptable as they're only downloaded once

### Git Handling
- **Large files** (models, high-resolution images) should be managed with Git LFS (Large File Storage) to avoid bloating the repository
- **Configuration**: If using Git LFS, add entries to `.gitattributes` (e.g., `*.bin filter=lfs`)
- **Placeholder files**: .gitkeep files are included to ensure empty directories are tracked

### Performance Considerations
- App icons and splash screens are loaded once at startup
- Sound files are loaded on-demand; consider lazy loading for frequently-used sounds
- ML models should be loaded asynchronously on app startup to avoid blocking the UI
- Use appropriate compression and caching strategies

## Linking Assets in Code

### JavaScript/TypeScript (React Native)
```javascript
// Images
import appIcon from '../assets/images/app-icon.png';
<Image source={require('../assets/images/splash-screen.png')} />

// Sounds
import { Audio } from 'expo-av';
const sound = new Audio.Sound();
await sound.loadAsync(require('../assets/sounds/press.mp3'));
await sound.playAsync();

// Models
const modelPath = require('../assets/models/ggml-tiny.en.bin');
```

### Native Code (iOS/Android)
- Images: Place in platform-specific directories (`ios/Assets`, `android/app/src/main/res`)
- Sounds: Use platform audio APIs or Expo Audio module
- Models: Include in app bundle or download from CDN

## Licensing and Attribution

When including third-party assets, ensure proper attribution and compliance with licenses:

- **Whisper Model**: CC-BY-NC-4.0 (OpenAI) - Download from official sources
- **Sound Effects**: Verify commercial use rights before including
- **Icons**: Ensure proper licensing (use icon libraries with appropriate licenses)
- **Fonts**: Check license compatibility with your app's distribution model

## Updating Assets

1. **New Sound Effect**:
   - Convert to MP3 (128 kbps) and WAV (44.1 kHz, 16-bit) formats
   - Test on target devices
   - Update `sounds/README.md`

2. **New App Icon**:
   - Create in required sizes
   - Test on actual devices
   - Update `images/README.md`

3. **New ML Model**:
   - Document download source and version
   - Include licensing information
   - Update `models/README.md`

## Troubleshooting

### Assets Not Found
- Verify file paths are correct (case-sensitive on iOS/Android)
- Check that files are included in the app bundle
- For Expo projects, ensure `app.json` references assets correctly

### File Size Issues
- Use image optimization tools
- Consider CDN hosting for large files
- Implement on-demand asset loading for non-critical files

### Sound/Model Loading Errors
- Verify file formats are supported
- Check file permissions
- Test on both iOS and Android devices

## References

- [Expo Asset Documentation](https://docs.expo.dev/guides/assets/)
- [React Native Image Documentation](https://reactnative.dev/docs/image)
- [OpenAI Whisper Repository](https://github.com/openai/whisper)
- [GGML Format Documentation](https://github.com/ggerganov/ggml)
