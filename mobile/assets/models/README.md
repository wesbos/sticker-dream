# Machine Learning Models

This directory contains pre-trained machine learning models used for on-device inference. Currently includes the Whisper speech-to-text model.

## Whisper: Speech-to-Text Model

### Overview
**Whisper** is an open-source speech recognition model developed by OpenAI. It's trained on 680,000 hours of multilingual audio from the web, providing robust speech-to-text capabilities with the ability to handle accents, background noise, and technical language.

**Key Features**:
- Multilingual support (99 languages)
- Robust to accents and background noise
- Technical language understanding
- Open-source and free for commercial use
- Efficient on-device inference

**Use Case in Sticker Dream**: Convert user speech input to text for sticker creation, caption generation, and voice-based commands.

### Model Files

#### ggml-tiny.en.bin (Recommended for Mobile)

**Purpose**: Lightweight English-only Whisper model optimized for mobile devices

**Download Sources**:
1. **Official Hugging Face** (Recommended)
   - URL: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin
   - Verified source, latest version

2. **Whisper.cpp Repository**
   - URL: https://github.com/ggerganov/whisper.cpp/releases
   - Contains multiple model versions
   - Includes release notes and checksums

3. **Ollama**
   - Models hosted at: https://ollama.ai/library/whisper
   - Command: `ollama pull whisper`

#### Model Specifications

| Property | Value |
|----------|-------|
| **File Name** | ggml-tiny.en.bin |
| **File Size** | ~32-34 MB |
| **Language** | English only |
| **Architecture** | GGML quantized format |
| **Inference Speed** | ~3-5 seconds per 30 seconds audio (on modern phone) |
| **Accuracy** | Good for clear speech; handles accents reasonably |
| **Memory Usage** | ~100-150 MB during inference |
| **License** | CC-BY-NC-4.0 (OpenAI) |

#### Available Whisper Models

| Model | Size (MB) | Speed | Accuracy | Use Case |
|-------|-----------|-------|----------|----------|
| **tiny.en** | 32-34 | Very Fast | Good | Mobile, real-time |
| **base.en** | 74-80 | Fast | Very Good | Mobile, higher accuracy |
| **small.en** | 244-262 | Medium | Excellent | Tablets, batch processing |
| **medium.en** | 769-826 | Slow | Near Perfect | Desktop, high accuracy |
| **large** | 2.9-3.2 GB | Very Slow | State-of-art | Server, ultimate accuracy |

**Recommendation**: Start with `tiny.en` for mobile. Upgrade to `base.en` if accuracy is insufficient.

#### Alternative Models

If multilingual support is needed:

**ggml-tiny.bin** (Multilingual)
- Download: https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin
- File Size: ~32 MB (same as English version)
- Supports 99 languages
- Slightly slower inference than English-only models

### How to Download

#### Manual Download

**Option 1: Using curl**
```bash
cd /home/user/sticker-dream-RN-/mobile/assets/models

# Download from Hugging Face (32 MB, ~2-5 minutes)
curl -L -o ggml-tiny.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin

# Verify download (optional, check file size)
ls -lh ggml-tiny.en.bin
# Should show ~32M
```

**Option 2: Using wget**
```bash
cd /home/user/sticker-dream-RN-/mobile/assets/models

wget -O ggml-tiny.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin
```

**Option 3: Direct Browser Download**
1. Visit: https://huggingface.co/ggerganov/whisper.cpp
2. Locate "Files and versions" section
3. Click download button next to `ggml-tiny.en.bin`
4. Save to `assets/models/` directory
5. Verify file size is ~32 MB

**Option 4: Using Python Script**
```python
#!/usr/bin/env python3
import requests
import os

url = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin"
output_path = "/home/user/sticker-dream-RN-/mobile/assets/models/ggml-tiny.en.bin"

print(f"Downloading Whisper model from {url}...")
print("This may take several minutes (~2-5 minutes for 32 MB)...")

response = requests.get(url, stream=True)
total_size = int(response.headers.get('content-length', 0))
downloaded = 0

with open(output_path, 'wb') as f:
    for chunk in response.iter_content(chunk_size=8192):
        if chunk:
            f.write(chunk)
            downloaded += len(chunk)
            percent = (downloaded / total_size) * 100
            print(f"Downloaded {percent:.1f}% ({downloaded / 1024 / 1024:.1f} MB / {total_size / 1024 / 1024:.1f} MB)")

file_size = os.path.getsize(output_path) / 1024 / 1024
print(f"Download complete! File size: {file_size:.1f} MB")
```

**Option 5: Using FFmpeg/aria2 (Fast Download)**
```bash
# Using aria2c (parallel download)
aria2c -x 16 \
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin" \
  -o ggml-tiny.en.bin
```

#### Network Requirements
- **Internet Speed**: 512 KB/s minimum (32 MB file)
- **Time**: 2-5 minutes on typical home internet
- **Bandwidth**: 32 MB total
- **Stability**: Connection interruptions will require restart

### File Verification

#### Check File Size
```bash
# Expected: approximately 32-34 MB
ls -lh assets/models/ggml-tiny.en.bin
```

#### Calculate Checksum (Optional)
```bash
# Get SHA256 hash (verify integrity)
sha256sum assets/models/ggml-tiny.en.bin
# Should match: (check Hugging Face page or release notes)

# Alternative on macOS
shasum -a 256 assets/models/ggml-tiny.en.bin
```

#### Verify File Integrity
```bash
# Check if file is accessible
file assets/models/ggml-tiny.en.bin
# Should output: "data" or "GGML model"

# Check file permissions
ls -la assets/models/ggml-tiny.en.bin
# Should be readable (r-- permission)
```

### Integration with React Native

#### Option 1: Using whisper.cpp + react-native-bridge

```typescript
// Native bridge (Objective-C for iOS / Kotlin for Android)
// Load model at app startup
import { NativeModules } from 'react-native';

const { WhisperModule } = NativeModules;

// Initialize Whisper
async function initializeWhisper() {
  try {
    const modelPath = require('../assets/models/ggml-tiny.en.bin');
    await WhisperModule.initializeModel(modelPath);
    console.log('Whisper model initialized');
  } catch (error) {
    console.error('Failed to initialize Whisper:', error);
  }
}

// Transcribe audio
async function transcribeAudio(audioPath: string) {
  try {
    const result = await WhisperModule.transcribe(audioPath);
    return result; // { text: "transcribed text", confidence: 0.95 }
  } catch (error) {
    console.error('Transcription failed:', error);
  }
}
```

#### Option 2: Using WASM (Web Assembly) - For Expo Web

```typescript
import { Whisper } from '@xenova/transformers';

async function initializeWhisperWasm() {
  const whisper = await Whisper.from_pretrained(
    'Xenova/whisper-tiny.en',
    { quantized: true }
  );
  return whisper;
}

async function transcribeAudio(audioData: ArrayBuffer, whisper: any) {
  try {
    const output = await whisper(audioData);
    return output.text;
  } catch (error) {
    console.error('WASM transcription failed:', error);
  }
}
```

#### Option 3: Using Expo Media Library + Cloud API

If on-device inference is not feasible:
```typescript
import * as MediaLibrary from 'expo-media-library';

async function sendAudioToCloud(audioUri: string) {
  const formData = new FormData();
  formData.append('audio', {
    uri: audioUri,
    name: 'audio.m4a',
    type: 'audio/mp4'
  });

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: formData
  });

  const result = await response.json();
  return result.text;
}
```

### Performance Optimization

#### Memory Management
```typescript
// Load model only once at app start
let whisperInstance: any = null;

async function getWhisperInstance() {
  if (!whisperInstance) {
    whisperInstance = await initializeWhisper();
  }
  return whisperInstance;
}

// Clean up on app shutdown
function unloadWhisper() {
  if (whisperInstance) {
    // Platform-specific cleanup
    whisperInstance.release();
    whisperInstance = null;
  }
}
```

#### Batch Processing
```typescript
// Queue transcriptions to avoid concurrent processing
const transcriptionQueue: string[] = [];
let isProcessing = false;

async function queueTranscription(audioPath: string) {
  transcriptionQueue.push(audioPath);
  if (!isProcessing) {
    await processTranscriptionQueue();
  }
}

async function processTranscriptionQueue() {
  isProcessing = true;
  while (transcriptionQueue.length > 0) {
    const audioPath = transcriptionQueue.shift();
    if (audioPath) {
      await transcribeAudio(audioPath);
    }
  }
  isProcessing = false;
}
```

#### Audio Format Optimization
Prepare audio for faster processing:
```typescript
// Convert to 16 kHz mono WAV (optimal for Whisper)
async function prepareAudioForWhisper(audioUri: string) {
  // Use ffmpeg-kit or native audio processing
  // Target: 16 kHz, mono, 16-bit PCM WAV
  const processedPath = await convertAudio(audioUri, {
    sampleRate: 16000,
    channels: 1,
    format: 'wav'
  });
  return processedPath;
}
```

### Licensing and Usage

#### License Details
- **License Type**: CC-BY-NC-4.0 (Creative Commons Attribution-NonCommercial 4.0)
- **Attribution Required**: Yes
- **Commercial Use**: Not allowed under CC-BY-NC
- **Redistribution**: Allowed with attribution

#### Obtaining Commercial License
If your app generates revenue (ads, in-app purchases):

**Option 1: OpenAI API**
- Use OpenAI's commercial API instead
- URL: https://platform.openai.com/docs/guides/speech-to-text
- Pricing: $0.02 per minute of audio
- Benefit: No license restrictions, cloud-based

**Option 2: Request Alternative License**
- Contact OpenAI for commercial licensing
- Email: https://openai.com/contact/
- Negotiate custom terms for your use case

**Option 3: Alternative Open-Source Models**
- **Vosk** (https://alphacephei.com/vosk/) - LGPL 3.0
- **DeepSpeech** (Discontinued by Mozilla, but archived)
- **Kaldi** (Apache 2.0 License) - More complex but fully open

#### Attribution in App
Include in app's "About" or "Credits" section:

```text
Speech Recognition:
- Whisper model by OpenAI
  License: CC-BY-NC-4.0
  https://github.com/openai/whisper
```

### Troubleshooting

#### Model Not Found
```
Error: Failed to load model
Solution:
1. Verify file exists at correct path
2. Check file permissions (must be readable)
3. Ensure file is complete (32+ MB)
4. Try re-downloading if corrupted
```

#### Slow Inference
```
Problem: Transcription takes >10 seconds
Causes & Solutions:
1. Audio too long → Process in chunks
2. Device CPU throttling → Reduce background tasks
3. Model too large → Use tiny.en instead of base.en
4. File I/O bottleneck → Pre-load and cache model
```

#### Memory Issues
```
Error: Out of memory / Memory pressure warning
Solutions:
1. Reduce concurrent transcriptions
2. Clear caches between operations
3. Use smaller model (tiny.en)
4. Process audio in smaller chunks
5. Monitor device memory with DevTools
```

#### Low Accuracy
```
Problem: Transcription quality is poor
Causes & Solutions:
1. High background noise → Apply audio preprocessing
2. Accented speech → Provide context/prompts
3. Technical jargon → Fine-tune or use larger model
4. Audio format issues → Ensure 16 kHz mono
5. Quiet audio → Increase volume/normalize
```

#### Platform-Specific Issues

**iOS**:
- Need microphone permission in Info.plist
- Audio session configuration required
- May need app entitlements for background processing

**Android**:
- RECORD_AUDIO permission required in AndroidManifest.xml
- Audio focus handling needed for service interruptions
- JNI bindings required for native library

### Audio Preprocessing

#### Recommended Preprocessing Pipeline
```typescript
import { Audio } from 'expo-av';

async function recordAndTranscribe() {
  // 1. Record audio
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  await recording.startAsync();

  // After recording...
  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();

  // 2. Preprocess audio (convert to 16 kHz mono)
  const processedUri = await preprocessAudio(uri);

  // 3. Transcribe
  const transcript = await transcribeAudio(processedUri);

  return transcript;
}
```

#### Audio Normalization
```bash
# Using FFmpeg to normalize audio for better accuracy
ffmpeg -i input.wav \
  -af "loudnorm=I=-23:TP=-1.5:LRA=11" \
  -acodec pcm_s16le \
  -ar 16000 \
  -ac 1 \
  output.wav
```

### Testing and Validation

#### Unit Test Example
```typescript
import { initializeWhisper, transcribeAudio } from './whisper';

describe('Whisper Transcription', () => {
  let whisper: any;

  beforeAll(async () => {
    whisper = await initializeWhisper();
  });

  test('should transcribe English audio', async () => {
    const result = await transcribeAudio('test-audio.wav', whisper);
    expect(result).toContain('expected text');
  });

  test('should handle background noise', async () => {
    const result = await transcribeAudio('noisy-audio.wav', whisper);
    expect(result.length).toBeGreaterThan(0);
  });
});
```

#### Performance Benchmarking
```typescript
async function benchmarkTranscription() {
  const audioFiles = ['audio1.wav', 'audio2.wav', 'audio3.wav'];
  const times: number[] = [];

  for (const audioFile of audioFiles) {
    const start = performance.now();
    await transcribeAudio(audioFile);
    const elapsed = performance.now() - start;
    times.push(elapsed);
  }

  const avgTime = times.reduce((a, b) => a + b) / times.length;
  console.log(`Average transcription time: ${avgTime.toFixed(2)}ms`);
  console.log(`Times: ${times.map(t => t.toFixed(2)).join('ms, ')}ms`);
}
```

## Additional Resources

### Official Documentation
- **Whisper Paper**: https://arxiv.org/abs/2212.04356
- **OpenAI Whisper Repository**: https://github.com/openai/whisper
- **Whisper.cpp (GGML Port)**: https://github.com/ggerganov/whisper.cpp

### Integration Guides
- **React Native Audio**: https://github.com/react-native-audio/react-native-audio
- **Expo Audio Documentation**: https://docs.expo.dev/versions/latest/sdk/audio/
- **Transformers.js (Web/WASM)**: https://github.com/xenova/transformers.js

### Model Hub
- **Hugging Face Whisper Models**: https://huggingface.co/collections/openai/whisper-models-6501bba2cf45221bf532268f
- **GGML Model Zoo**: https://github.com/ggerganov/ggml/wiki/Quantized-Models

### Community Resources
- **Whisper Issues**: https://github.com/openai/whisper/issues
- **Whisper.cpp Issues**: https://github.com/ggerganov/whisper.cpp/issues
- **Stack Overflow**: Tag `whisper` + `speech-to-text`
