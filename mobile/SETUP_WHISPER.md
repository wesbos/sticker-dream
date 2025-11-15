# Whisper Model Setup Guide

Complete guide to download and configure OpenAI's Whisper speech-to-text model for Sticker Dream.

## Table of Contents

1. [What is Whisper](#what-is-whisper)
2. [System Requirements](#system-requirements)
3. [Download Instructions](#download-instructions)
4. [Verification](#verification)
5. [Model Details](#model-details)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)

## What is Whisper

Whisper is OpenAI's robust speech recognition model that:
- Converts audio to text (speech-to-text)
- Runs locally on your device (better privacy)
- Supports multiple languages
- Handles background noise well
- Works offline (no internet required during transcription)

For Sticker Dream, we use the **ggml-tiny.en.bin** model which:
- Is optimized for English language
- Runs on mobile devices (small model size ~140MB)
- Provides good accuracy for general speech
- Has fast inference time

## System Requirements

### Disk Space
- **140 MB** for Whisper model file
- **2-3 GB** free space during download
- **Total available**: At least 3-4 GB free space

### Processing Power
- Any modern mobile device
- Transcription takes 1-5 seconds depending on audio length
- Minimal battery impact

### Platform Support
- iOS 13.0+
- Android 10+

## Download Instructions

### Option 1: Automatic Download (Recommended)

The app attempts to download the model automatically on first run, but manual setup is more reliable.

### Option 2: Manual Download on Mac/Linux

#### Step 1: Create Model Directory

```bash
# Create the cache directory
mkdir -p ~/.cache/whisper.cpp/
```

#### Step 2: Download Model

```bash
# Download the tiny English model (~140 MB)
curl -L \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin \
  -o ~/.cache/whisper.cpp/ggml-tiny.en.bin

# Show download progress (takes 2-5 minutes depending on internet)
# Once complete, you'll see: "100 1141 / 1141 [================================================================================] 100.00% in 2m3s"
```

#### Step 3: Verify Download

```bash
# Check file exists and size (~140 MB)
ls -lh ~/.cache/whisper.cpp/ggml-tiny.en.bin

# Expected output similar to:
# -rw-r--r-- 140M Nov 15 10:30 /Users/yourname/.cache/whisper.cpp/ggml-tiny.en.bin
```

### Option 3: Manual Download on Windows

#### Step 1: Create Model Directory

```powershell
# Open PowerShell and create directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.cache\whisper.cpp\"
```

#### Step 2: Download Model

```powershell
# Download using curl (available in Windows 10+)
curl -L `
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin `
  -o "$env:USERPROFILE\.cache\whisper.cpp\ggml-tiny.en.bin"

# If curl is not available, use Invoke-WebRequest:
Invoke-WebRequest -Uri "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin" `
  -OutFile "$env:USERPROFILE\.cache\whisper.cpp\ggml-tiny.en.bin"
```

#### Step 3: Verify Download

```powershell
# Check file size
Get-Item "$env:USERPROFILE\.cache\whisper.cpp\ggml-tiny.en.bin" | Select-Object Length

# Should show approximately 140000000 bytes
```

### Option 4: Using Browser

If command line download doesn't work:

1. Go to [HuggingFace Model Hub](https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin)
2. The download should start automatically
3. Save the file to:
   - **Mac/Linux**: `~/.cache/whisper.cpp/ggml-tiny.en.bin`
   - **Windows**: `C:\Users\YourUsername\.cache\whisper.cpp\ggml-tiny.en.bin`

## Verification

### Verify Model Installation

```bash
# Mac/Linux
test -f ~/.cache/whisper.cpp/ggml-tiny.en.bin && echo "✓ Model found" || echo "✗ Model not found"

# Check exact size (should be around 140 MB)
ls -lh ~/.cache/whisper.cpp/ggml-tiny.en.bin

# Windows (PowerShell)
if (Test-Path "$env:USERPROFILE\.cache\whisper.cpp\ggml-tiny.en.bin") {
  Write-Host "✓ Model found"
} else {
  Write-Host "✗ Model not found"
}
```

### Test in App

1. Run the app:
   ```bash
   pnpm prebuild
   pnpm ios  # or pnpm android
   ```

2. Once the app launches, try to record voice:
   - Tap the microphone button
   - Speak clearly (e.g., "Create a blue butterfly sticker")
   - Tap to stop recording
   - The transcription should appear

3. If successful, you should see:
   - Your spoken text converted to text
   - No error messages
   - System ready to generate image

## Model Details

### Available Models

Whisper comes in different sizes with different performance/accuracy tradeoffs:

| Model | Size | English Accuracy | Speed | Recommended For |
|-------|------|------------------|-------|-----------------|
| tiny | 75 MB | ~95% | Very Fast | Mobile devices, real-time |
| base | 140 MB | ~97% | Fast | Most use cases |
| small | 461 MB | ~98% | Medium | Better accuracy needed |
| medium | 1.5 GB | ~99% | Slow | High accuracy, desktop |
| large | 3 GB | ~99%+ | Very Slow | Best accuracy, desktop |

**Sticker Dream uses: `ggml-tiny.en.bin` (75 MB variant)**

Why tiny model?
- Small file size (easy to include in app)
- Fast processing (1-5 second transcription)
- Good accuracy for casual speech
- Lower battery usage
- Works on all devices

### Model Language

The model is trained for English (`en`). It will work for:
- English speakers with various accents
- Mixed English with other languages
- Technical terms and proper nouns (reasonably well)

### Model Update

To use a different model:

1. Download from [HuggingFace](https://huggingface.co/ggerganov/whisper.cpp)
2. Save to the same directory (`~/.cache/whisper.cpp/`)
3. Update model name in `services/whisper.service.ts`:
   ```typescript
   modelPath: 'ggml-base.en.bin'  // Change from ggml-tiny.en.bin
   ```
4. Rebuild: `pnpm prebuild && pnpm ios/android`

## Troubleshooting

### Issue: "Model not found" Error

**Symptoms:**
- App crashes when trying to record
- Error: "Cannot find model"
- Transcription doesn't work

**Solutions:**

1. **Verify file exists:**
   ```bash
   ls -la ~/.cache/whisper.cpp/
   ```

2. **Ensure correct filename:**
   - Should be exactly: `ggml-tiny.en.bin`
   - Check spelling and case sensitivity

3. **Create directory if missing:**
   ```bash
   mkdir -p ~/.cache/whisper.cpp/
   ```

4. **Rebuild app:**
   ```bash
   pnpm prebuild:clean
   pnpm prebuild
   pnpm ios  # or android
   ```

5. **For iOS, check if file is included in bundle:**
   - Open Xcode: `xed ios/`
   - In Project Navigator, check if model file is listed
   - If not, add it: Right-click target > Build Phases > Copy Bundle Resources

### Issue: Download Fails / Slow Download

**Cause**: Network issues, slow internet, or HuggingFace CDN issues

**Solutions:**

1. **Retry download:**
   ```bash
   # Add --retry flag
   curl -L --retry 3 \
     https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin \
     -o ~/.cache/whisper.cpp/ggml-tiny.en.bin
   ```

2. **Use alternative mirror:**
   ```bash
   # Try GitHub mirror if HuggingFace is slow
   curl -L --retry 3 \
     https://github.com/ggerganov/whisper.cpp/releases/download/v1.5.4/ggml-tiny.en.bin \
     -o ~/.cache/whisper.cpp/ggml-tiny.en.bin
   ```

3. **Check internet connection:**
   ```bash
   ping -c 3 google.com
   ```

4. **Use browser download** if curl fails:
   - Visit model URL in browser
   - Save to correct directory manually

### Issue: File Downloaded but Wrong Size

**Cause**: Incomplete download, corruption, or wrong file

**Solutions:**

```bash
# Check file size (should be exactly 140-150 MB)
du -sh ~/.cache/whisper.cpp/ggml-tiny.en.bin

# Delete and re-download if wrong size
rm ~/.cache/whisper.cpp/ggml-tiny.en.bin
curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin \
  -o ~/.cache/whisper.cpp/ggml-tiny.en.bin

# Verify size again
ls -lh ~/.cache/whisper.cpp/ggml-tiny.en.bin
```

### Issue: Transcription Very Slow or App Freezes

**Cause**: Large model, underpowered device, or processing issue

**Solutions:**

1. **Ensure tiny model is used:**
   - Check: `~/.cache/whisper.cpp/ggml-tiny.en.bin` exists

2. **Reduce recording length:**
   - Keep recordings under 10 seconds
   - App currently supports up to 15 seconds

3. **Close other apps:**
   - Transcription uses device CPU
   - Close heavy apps like video players

4. **Update to latest version:**
   ```bash
   pnpm install
   pnpm prebuild
   ```

### Issue: Poor Transcription Accuracy

**Cause**: Background noise, speaking too fast/quiet, or model limitations

**Solutions:**

1. **Improve audio quality:**
   - Use in quiet environment
   - Speak clearly and at normal pace
   - Keep device microphone clean

2. **Upgrade to larger model:**
   - Download `ggml-base.en.bin` (~140 MB) for better accuracy
   - Update model name in code
   - Trade-off: slightly slower transcription

3. **Rephrase your prompt:**
   - Be descriptive: "Create a pink cute cat wearing a hat"
   - Not: "cat"
   - AI will generate better stickers with detailed descriptions

## Advanced Configuration

### Custom Model Paths

To use a custom model location:

1. Edit `services/whisper.service.ts`:
   ```typescript
   const modelPath = '/custom/path/to/ggml-tiny.en.bin';
   ```

2. Rebuild: `pnpm prebuild && pnpm ios/android`

### Use Different Language Model

For other languages, download the corresponding model:

```bash
# French
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.fr.bin

# Spanish
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.es.bin

# German
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.de.bin

# Multiple languages
wget https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin
```

Then update the model filename in your code.

### Monitor Model Loading

To debug model loading issues, add logging to `whisper.service.ts`:

```typescript
console.log('Whisper: Loading model from', modelPath);

try {
  await transcribe({
    modelPath,
    audioFile,
  });
  console.log('Whisper: Model loaded successfully');
} catch (error) {
  console.error('Whisper: Model loading failed:', error);
}
```

### Clear Cached Models

If you want to free up space or reset:

```bash
# Remove all whisper models
rm -rf ~/.cache/whisper.cpp/

# Or just the tiny model
rm ~/.cache/whisper.cpp/ggml-tiny.en.bin
```

## Performance Optimization

### For Production App

1. **Use optimal model:**
   - Tiny model: Fastest, smallest (75 MB)
   - Base model: Good balance (140 MB)
   - Don't use large models on mobile

2. **Optimize audio:**
   - Use mono audio (not stereo)
   - Sample rate: 16 kHz (standard)
   - Format: WAV or PCM

3. **Limit recording length:**
   - Current app: max 15 seconds
   - Ideal: 3-10 seconds for sticker descriptions

4. **Handle on separate thread:**
   - Don't block UI during transcription
   - Show loading spinner while processing

## Next Steps

1. Verify model installation: `ls -la ~/.cache/whisper.cpp/`
2. Run app and test voice recording
3. If issues occur, see [Troubleshooting](#troubleshooting)
4. Continue with [Bluetooth Printer Setup](./TROUBLESHOOTING.md#printer-setup)
5. Deploy to devices and test thoroughly

## Additional Resources

- [Whisper.cpp GitHub](https://github.com/ggerganov/whisper.cpp)
- [Whisper Documentation](https://github.com/openai/whisper)
- [HuggingFace Model Hub](https://huggingface.co/ggerganov/whisper.cpp)
- [Whisper RN Package](https://github.com/mybigday/whisper.rn)

---

**Last Updated**: November 2024
**Model Version**: ggml-tiny.en.bin
**Model Size**: 75-140 MB
**Supported Languages**: English (and multilingual variants)
