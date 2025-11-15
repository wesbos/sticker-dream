# Sound Effects

This directory contains audio files for user feedback, notifications, and interactive elements in the Sticker Dream application.

## Required Sound Files

### 1. press.mp3
**Purpose**: User interface button press/tap feedback sound

**Specifications**:
- **Format**: MP3 (compressed)
- **Sample Rate**: 44.1 kHz
- **Bit Rate**: 128 kbps (mono) or 192 kbps (stereo)
- **Duration**: 50-200ms (very short, quick feedback)
- **Volume**: -6dB to -3dB (prevent clipping)
- **Characteristics**: Short, crisp, non-intrusive click or beep sound

**Alternative Formats**:
- `press.wav` - Uncompressed WAV (16-bit, 44.1 kHz) - approximately 30-50 KB
- `press.m4a` - iOS-optimized AAC format

**Expected File Size**: 10-30 KB (MP3)

### 2. loading.mp3
**Purpose**: Audio feedback during loading operations or processing

**Specifications**:
- **Format**: MP3 (compressed)
- **Sample Rate**: 44.1 kHz
- **Bit Rate**: 192-256 kbps (stereo recommended for better quality)
- **Duration**: 500ms - 2 seconds (can be looped during extended loading)
- **Volume**: -6dB (moderate level)
- **Characteristics**: Smooth, non-jarring sound (e.g., subtle whoosh, progress tone)

**Alternative Formats**:
- `loading.wav` - Uncompressed WAV (16-bit, 44.1 kHz)
- `loading.m4a` - iOS-optimized AAC format

**Expected File Size**: 30-100 KB (MP3)

### 3. finished.wav
**Purpose**: Success/completion notification sound

**Specifications**:
- **Format**: WAV (uncompressed, higher quality)
- **Sample Rate**: 48 kHz (preferred for clarity on modern devices)
- **Bit Depth**: 16-bit (CD quality)
- **Duration**: 300ms - 800ms (satisfying completion sound)
- **Volume**: -3dB (sufficient to be noticed without being jarring)
- **Characteristics**: Positive, uplifting tone (e.g., ding, chime, success melody)

**Alternative Formats**:
- `finished.mp3` - Compressed MP3 (192-256 kbps)
- `finished.m4a` - iOS-optimized AAC format

**Expected File Size**: 50-150 KB (WAV at 48 kHz)

## Audio Specifications Summary

| File | Format | Sample Rate | Duration | Size |
|------|--------|-------------|----------|------|
| press.mp3 | MP3 | 44.1 kHz | 50-200ms | 10-30 KB |
| loading.mp3 | MP3 | 44.1 kHz | 0.5-2s | 30-100 KB |
| finished.wav | WAV | 48 kHz | 300-800ms | 50-150 KB |

## How to Obtain Sound Files

### Option 1: Free Sound Libraries
Quality free/royalty-free sound effects suitable for commercial use:

- **Freesound.org** (https://freesound.org/)
  - Filter: Creative Commons licenses (CC0 or CC-BY)
  - Search: "button press", "loading", "success chime"
  - Format: Download in WAV, then convert to MP3 if needed

- **Zapsplat** (https://www.zapsplat.com/)
  - License: Royalty-free for commercial use
  - High-quality sounds, easy downloads
  - Recommended for UI sounds

- **BBC Sound Effects Library** (https://sound-effects.bbcrewind.co.uk/)
  - License: CC BY-NC 4.0 (verify commercial use)
  - High-quality, professionally-recorded effects

- **Pixabay Sounds** (https://pixabay.com/sounds/)
  - License: CC0 (free to use, no attribution required)
  - Large collection of UI sounds

### Option 2: Generate Programmatically
Create simple sounds using audio generation tools:

- **Bfxr** (https://www.bfxr.net/) - 8-bit sound generator (great for retro UI sounds)
- **Tuna** (https://github.com/Theodeus/tuna) - Web Audio API effects library
- **Tone.js** (https://tonejs.org/) - Synthesizer library for generating sounds

### Option 3: Professional Platforms
Affordable, licensed sounds (with cost):

- **Envato Elements** (https://elements.envato.com/)
  - Unlimited downloads with subscription ($14.50/month)
  - Wide variety of professional sounds

- **Epidemic Sound** (https://www.epidemicsound.com/)
  - Subscription-based ($14.99/month+)
  - Curated library for commercial use

## Audio Format Conversion

### Converting to MP3
Using FFmpeg (command-line):
```bash
# WAV to MP3 (128 kbps, mono)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k -ac 1 output.mp3

# WAV to MP3 (192 kbps, stereo)
ffmpeg -i input.wav -codec:a libmp3lame -b:a 192k output.mp3
```

### Converting to WAV
```bash
# MP3 to WAV
ffmpeg -i input.mp3 output.wav

# Convert to 48 kHz, 16-bit
ffmpeg -i input.wav -acodec pcm_s16le -ar 48000 finished.wav
```

### Converting to M4A (iOS-optimized)
```bash
# MP3 or WAV to M4A (AAC codec)
ffmpeg -i input.mp3 -codec:a aac -b:a 192k output.m4a
```

### Batch Conversion (Multiple Files)
```bash
# Convert all WAV files in directory to MP3
for f in *.wav; do
  ffmpeg -i "$f" -codec:a libmp3lame -b:a 192k "${f%.wav}.mp3"
done
```

## Audio Editing Tools

### Free/Open Source
- **Audacity** (https://www.audacityteam.org/) - Multiplatform audio editor
  - Can record, edit, and export in multiple formats
  - Good for trimming, normalizing, and adjusting volume

### Online (No Installation)
- **Online Audio Converter** (https://online-audio-converter.com/)
- **Kapwing** (https://www.kapwing.com/tools/audio-converter)
- **CloudConvert** (https://cloudconvert.com/)

## Implementation in React Native

### Using Expo Audio
```typescript
import { Audio } from 'expo-av';

// Load sounds at app startup
const soundObjects = {
  press: new Audio.Sound(),
  loading: new Audio.Sound(),
  finished: new Audio.Sound(),
};

async function loadSounds() {
  try {
    await soundObjects.press.loadAsync(require('../assets/sounds/press.mp3'));
    await soundObjects.loading.loadAsync(require('../assets/sounds/loading.mp3'));
    await soundObjects.finished.loadAsync(require('../assets/sounds/finished.wav'));
  } catch (error) {
    console.error('Error loading sounds:', error);
  }
}

// Play sound
async function playSound(soundKey: keyof typeof soundObjects) {
  try {
    const sound = soundObjects[soundKey];
    // Stop current playback if any
    const status = await sound.getStatusAsync();
    if (status.isLoaded) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
    }
  } catch (error) {
    console.error(`Error playing ${soundKey}:`, error);
  }
}
```

### With Sound Settings
```typescript
// Set volume
await soundObjects.press.setVolumeAsync(0.5);

// Set playback rate
await soundObjects.finished.setRateAsync(1.0, true);

// Enable/disable based on user settings
const { soundEnabled } = useAppSettings();
if (soundEnabled) {
  await playSound('press');
}
```

## Licensing and Attribution

### When Using Downloaded Sounds

1. **Check the License**:
   - CC0: Free use, no attribution needed
   - CC-BY: Credit the creator
   - CC-BY-NC: Non-commercial use only (verify if your app is commercial)
   - Custom Licenses: Read carefully

2. **Common License Locations**:
   - On the download page
   - In the file metadata
   - In a separate `LICENSE` or `CREDITS` file

3. **Attribution Format** (if required):
   - Add to your app's About/Credits section
   - Include in privacy policy or documentation
   - Format: "Sound: [Name] by [Creator] ([License])"

### Example Attribution
```
Sound Effects:
- "Button Click" by [Creator Name] (CC BY 3.0)
- "Loading Tone" from Zapsplat (Royalty-free)
- "Success Chime" from Freesound (CC0)
```

## Quality Assurance

### Testing Checklist
- [ ] Sound plays on iOS devices
- [ ] Sound plays on Android devices
- [ ] Audio level is appropriate (not too loud or quiet)
- [ ] No audio artifacts or distortion
- [ ] File sizes are reasonable
- [ ] Format is compatible with Expo Audio

### Audio Testing Code
```typescript
async function testAudio() {
  console.log('Testing press sound...');
  await playSound('press');

  setTimeout(async () => {
    console.log('Testing loading sound...');
    await playSound('loading');
  }, 1000);

  setTimeout(async () => {
    console.log('Testing finished sound...');
    await playSound('finished');
  }, 3000);
}
```

## Optimization Tips

1. **File Size Optimization**:
   - Use MP3 at 128 kbps for short UI sounds (press.mp3)
   - Use 192-256 kbps for longer sounds (loading.mp3, finished.wav)
   - Strip silence from beginning and end of files

2. **Performance**:
   - Pre-load critical sounds at app startup
   - Use lazy loading for rarely-used sounds
   - Limit concurrent audio playback

3. **User Experience**:
   - Allow users to disable sound effects in settings
   - Respect system mute/vibration settings
   - Test on actual devices (simulator audio can differ)

## Troubleshooting

### Sound Not Playing
1. Check file format compatibility
2. Verify file path is correct
3. Ensure Expo Audio is properly configured
4. Test on device (not just simulator)
5. Check app audio permissions

### Audio Quality Issues
1. Verify sample rate and bit depth are appropriate
2. Check for audio normalization issues
3. Test on different devices
4. Consider re-encoding with higher bitrate

### File Size Too Large
1. Use MP3 compression instead of WAV
2. Reduce sample rate (44.1 kHz vs. 48 kHz)
3. Lower bitrate (128 kbps vs. 256 kbps)
4. Shorten duration if possible

## Additional Resources

- [Expo Audio Documentation](https://docs.expo.dev/versions/latest/sdk/audio/)
- [React Native Sound Library](https://github.com/react-native-audio-toolkit/react-native-audio-toolkit)
- [Audio Format Comparison](https://en.wikipedia.org/wiki/Comparison_of_audio_coding_formats)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
