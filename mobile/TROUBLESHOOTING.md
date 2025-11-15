# Troubleshooting Guide

Comprehensive guide for resolving common issues in Sticker Dream development and deployment.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Google Authentication Issues](#google-authentication-issues)
3. [Whisper / Speech Recognition](#whisper--speech-recognition)
4. [Gemini API Issues](#gemini-api-issues)
5. [Bluetooth Printer Issues](#bluetooth-printer-issues)
6. [Build and Runtime Issues](#build-and-runtime-issues)
7. [iOS-Specific Issues](#ios-specific-issues)
8. [Android-Specific Issues](#android-specific-issues)
9. [Performance Issues](#performance-issues)
10. [Getting Help](#getting-help)

## Installation Issues

### Issue: `pnpm install` fails with permission errors

**Symptoms:**
```
Error: EACCES: permission denied
```

**Solutions:**

```bash
# Option 1: Use sudo (not recommended)
sudo pnpm install

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 3: Clear cache and retry
rm -rf node_modules
rm -rf .pnpm-store
pnpm install --force

# Option 4: Use nvm (for Node.js version management)
curl https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
nvm use 18  # Use Node 18+
pnpm install
```

### Issue: Dependency conflicts or version mismatches

**Symptoms:**
```
ERR! peer dep missing
ERR! unsupported platform
```

**Solutions:**

```bash
# Clear and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for incompatibilities
pnpm list

# Update all dependencies to latest compatible versions
pnpm update --latest

# Force specific version if needed
pnpm install expo@54.0.23 --save
```

### Issue: `expo` CLI not found

**Symptoms:**
```
command not found: expo
```

**Solutions:**

```bash
# Install expo-cli globally
pnpm add -g expo-cli

# Verify installation
expo --version

# Or use via pnpm
pnpm exec expo --version
```

### Issue: Node version incompatibility

**Symptoms:**
```
This package requires Node >= 18.0.0
```

**Solutions:**

```bash
# Check your Node version
node --version

# If using nvm:
nvm install 18
nvm use 18
nvm alias default 18

# If using homebrew (macOS):
brew install node@18
brew link node@18

# Verify version after update
node --version  # Should show v18.x.x or higher
```

## Google Authentication Issues

### Issue: Google Sign-In button doesn't appear

**Symptoms:**
- App runs but sign-in button is missing
- No Google sign-in option visible

**Solutions:**

1. **Verify Google Sign-In plugin is installed:**
   ```bash
   pnpm list @react-native-google-signin/google-signin
   ```

2. **Check app.json configuration:**
   ```json
   {
     "expo": {
       "plugins": [
         ["@react-native-google-signin/google-signin"]
       ]
     }
   }
   ```

3. **Rebuild native projects:**
   ```bash
   pnpm prebuild:clean
   pnpm prebuild
   pnpm ios  # or android
   ```

### Issue: "Invalid Client ID" error

**Symptoms:**
```
Error: Invalid Client ID
Google Sign-In initialization failed
```

**Solutions:**

1. **Verify .env file has correct values:**
   ```bash
   cat .env
   ```
   Check if values are not set or incorrect

2. **Compare with Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to APIs & Services > Credentials
   - Copy the exact Client IDs and verify in .env

3. **Check bundle ID matches:**
   - In app.json, check: `"bundleIdentifier": "com.stickerdream.app"`
   - In Google Console, OAuth iOS credentials should use same bundle ID
   - Same for Android: `"package": "com.stickerdream.app"`

4. **Rebuild with correct credentials:**
   ```bash
   # Make sure .env is saved
   pnpm prebuild:clean
   pnpm prebuild
   pnpm ios  # or android
   ```

### Issue: Sign-in button appears but tapping does nothing

**Symptoms:**
- Button is visible but unresponsive
- No error messages

**Solutions:**

1. **Check if Google Play Services available (Android only):**
   ```bash
   # On Android emulator with Google Play Services
   pnpm android
   ```

2. **Verify internet connectivity:**
   ```bash
   # Test internet connection
   ping -c 3 google.com
   ```

3. **Check console for silent errors:**
   - iOS: Open Xcode console
   - Android: Run `adb logcat | grep -i google`

4. **Test with a fresh rebuild:**
   ```bash
   pnpm prebuild:clean
   pnpm prebuild
   pnpm ios  # or android
   ```

### Issue: "User not found" or "User not registered"

**Symptoms:**
```
Error: User is not a test user for this app
```

**Solutions:**

1. **Add your email as test user:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services > OAuth consent screen
   - Scroll to "Test users"
   - Click "ADD USERS"
   - Enter your email address
   - Click "ADD"

2. **Or submit app for verification:**
   - In OAuth consent screen, click "SUBMIT FOR VERIFICATION"
   - Google will review your app
   - Once approved, you can remove test user restrictions

3. **Sign out and back in:**
   ```
   In app: Settings > Sign Out
   Then tap Sign In again
   ```

## Whisper / Speech Recognition

### Issue: "Whisper model not found" error

**Symptoms:**
```
Error: Model file not found
Cannot find ggml-tiny.en.bin
```

**Solutions:**

1. **Verify model is downloaded:**
   ```bash
   ls -la ~/.cache/whisper.cpp/ggml-tiny.en.bin
   ```

2. **If not found, download it:**
   ```bash
   mkdir -p ~/.cache/whisper.cpp/
   curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin \
     -o ~/.cache/whisper.cpp/ggml-tiny.en.bin
   ```

3. **Verify file size (should be ~140 MB):**
   ```bash
   ls -lh ~/.cache/whisper.cpp/ggml-tiny.en.bin
   ```

4. **Rebuild app:**
   ```bash
   pnpm prebuild:clean
   pnpm prebuild
   pnpm ios  # or android
   ```

See [SETUP_WHISPER.md](./SETUP_WHISPER.md) for complete Whisper setup.

### Issue: Microphone permission denied

**Symptoms:**
- Record button is greyed out or disabled
- Error when tapping record button
- "Permission denied" message

**Solutions:**

1. **Grant permission on device:**
   - For iOS: Settings > Sticker Dream > Microphone > Allow
   - For Android: Settings > Apps > Sticker Dream > Permissions > Microphone > Allow

2. **If permission prompt never appears:**
   - Check app.json has microphone permission:
     ```json
     {
       "expo": {
         "ios": {
           "infoPlist": {
             "NSMicrophoneUsageDescription": "Sticker Dream needs microphone access..."
           }
         },
         "android": {
           "permissions": ["android.permission.RECORD_AUDIO"]
         }
       }
     }
     ```
   - Rebuild: `pnpm prebuild && pnpm ios/android`

3. **Reset app permissions:**
   - iOS: Settings > General > Reset > Reset Location & Privacy
   - Android: Settings > Apps > Sticker Dream > Permissions > Reset to defaults

### Issue: Transcription is very slow or times out

**Symptoms:**
- Recording stops but transcription takes 30+ seconds
- App becomes unresponsive
- "Transcription timeout" error

**Solutions:**

1. **Keep recordings short:**
   - Aim for 3-10 seconds
   - App supports up to 15 seconds
   - Shorter = faster transcription

2. **Close other apps:**
   - Transcription is CPU-intensive
   - Close heavy apps before recording

3. **Ensure tiny model is installed:**
   ```bash
   # Should be ggml-tiny.en.bin, not ggml-base.en.bin
   ls -la ~/.cache/whisper.cpp/ | grep tiny
   ```

4. **Check device resources:**
   - Restart device if needed
   - Check if storage is nearly full
   - Close background processes

5. **Update to latest version:**
   ```bash
   pnpm install
   pnpm prebuild
   ```

### Issue: Transcription accuracy is poor

**Symptoms:**
- Voice is transcribed incorrectly
- Words are missing or garbled
- "cat" becomes "hat" or other mishaps

**Solutions:**

1. **Improve audio quality:**
   - Record in quiet environment
   - Speak clearly at normal pace
   - Move away from background noise
   - Ensure microphone is clean

2. **Be more descriptive:**
   - Instead of "cat", say "Create a cute pink cat wearing sunglasses"
   - More detailed prompts = better stickers

3. **Upgrade to larger Whisper model:**
   ```bash
   # Download base model (better accuracy)
   mkdir -p ~/.cache/whisper.cpp/
   curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin \
     -o ~/.cache/whisper.cpp/ggml-base.en.bin

   # Update in services/whisper.service.ts
   # Change: modelPath: 'ggml-tiny.en.bin'
   # To: modelPath: 'ggml-base.en.bin'
   ```

## Gemini API Issues

### Issue: "Gemini API not enabled" error

**Symptoms:**
```
Error: Generative AI API is not enabled
Please enable it in Google Cloud Console
```

**Solutions:**

1. **Enable the API:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services > Library
   - Search "Generative AI"
   - Click on result and click "ENABLE"
   - Wait a few minutes for activation

2. **Verify API is enabled:**
   - Go to APIs & Services > Enabled APIs & Services
   - Look for "Google Generative AI API" in the list

3. **Rebuild app:**
   ```bash
   pnpm prebuild && pnpm ios  # or android
   ```

### Issue: "API Key invalid" or "Unauthorized" error

**Symptoms:**
```
Error: Invalid API Key
Error: Unauthorized
```

**Solutions:**

1. **Verify API key in .env:**
   ```bash
   grep GEMINI_API_KEY_FALLBACK .env
   ```

2. **Check if key is correct:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services > Credentials
   - Copy your API key again
   - Update .env

3. **Rebuild with new key:**
   ```bash
   pnpm prebuild && pnpm ios  # or android
   ```

### Issue: "Quota exceeded" or rate limiting

**Symptoms:**
```
Error: Quota exceeded
Error: Too many requests
```

**Solutions:**

1. **Check quota status:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - APIs & Services > Credentials
   - Click on your API key
   - Scroll to "Quotas" section
   - Check usage and limits

2. **Wait for quota reset:**
   - Quotas usually reset daily
   - Note the reset time

3. **Request quota increase:**
   - Click on quota metric
   - Click "EDIT QUOTAS"
   - Enter desired quota
   - Submit request

4. **Optimize API usage:**
   - Cache generated images
   - Avoid regenerating same prompt
   - Implement request throttling

### Issue: Image generation produces poor results

**Symptoms:**
- Generated stickers look nothing like description
- Blurry or distorted images
- Wrong colors or objects

**Solutions:**

1. **Improve prompt description:**
   - Be specific: "cute pink cat" vs "cat"
   - Include details: "sticker, cartoon style, colorful"
   - Avoid complex requests

2. **Provide examples of what you want:**
   - "Similar to a Sanrio character" or "Kawaii style"
   - Specific colors and styles help

3. **Adjust model if available:**
   - Check Gemini API documentation for model options
   - Try different models if available

4. **Regenerate the image:**
   - Try again with slightly different wording
   - Gemini output varies per request

## Bluetooth Printer Issues

### Issue: Printer doesn't appear in available devices

**Symptoms:**
- Empty list of printers
- "No devices found"
- Printer exists but not showing

**Solutions:**

1. **Ensure printer is powered and ready:**
   - Check printer power is on
   - Look for green light or status indicator
   - Verify printer is in pairing mode

2. **Check Bluetooth is enabled:**
   - iOS: Settings > Bluetooth (toggle ON)
   - Android: Settings > Bluetooth (toggle ON)

3. **Grant Bluetooth permissions:**
   - iOS: Settings > Sticker Dream > Bluetooth > Allow
   - Android: Settings > Apps > Sticker Dream > Permissions > Bluetooth > Allow

4. **Bring printer closer:**
   - Bluetooth range is typically 10 meters
   - Move device and printer closer
   - Remove obstacles between devices

5. **Restart Bluetooth:**
   - Turn Bluetooth off, wait 10 seconds
   - Turn Bluetooth back on
   - Try discovering printers again

6. **Verify app.json has Bluetooth config:**
   ```json
   {
     "expo": {
       "android": {
         "permissions": [
           "android.permission.BLUETOOTH",
           "android.permission.BLUETOOTH_ADMIN",
           "android.permission.BLUETOOTH_CONNECT",
           "android.permission.BLUETOOTH_SCAN"
         ]
       }
     }
   }
   ```

### Issue: "Bluetooth permission denied" error

**Symptoms:**
```
Error: Bluetooth permission denied
Cannot access Bluetooth devices
```

**Solutions:**

1. **Grant permissions on device:**
   - iOS: Settings > Sticker Dream > Bluetooth > ON
   - Android: Settings > Apps > Sticker Dream > Permissions > Bluetooth > Allow All

2. **Verify app.json includes Bluetooth permissions:**
   ```json
   {
     "expo": {
       "ios": {
         "infoPlist": {
           "NSBluetoothAlwaysUsageDescription": "...",
           "NSBluetoothPeripheralUsageDescription": "..."
         }
       },
       "android": {
         "permissions": [
           "android.permission.BLUETOOTH",
           "android.permission.BLUETOOTH_ADMIN",
           "android.permission.BLUETOOTH_CONNECT",
           "android.permission.BLUETOOTH_SCAN"
         ]
       }
     }
   }
   ```

3. **Rebuild app:**
   ```bash
   pnpm prebuild:clean
   pnpm prebuild
   pnpm ios  # or android
   ```

4. **For Android 12+, enable location permission:**
   - Android 12+ requires location to scan Bluetooth
   - Settings > Apps > Sticker Dream > Permissions > Location > Allow only while using app

### Issue: "Connection failed" after selecting printer

**Symptoms:**
- Printer is found but connection fails
- "Unable to establish connection"
- Printer disconnects after brief connection

**Solutions:**

1. **Restart printer:**
   - Turn printer off
   - Wait 10 seconds
   - Turn printer back on

2. **Clear paired devices and re-pair:**
   - iOS: Settings > Bluetooth > Info next to printer > Forget
   - Android: Settings > Bluetooth > Settings next to printer > Unpair
   - Then reconnect from app

3. **Check printer battery:**
   - If battery low, printer may be unstable
   - Charge printer fully
   - Check battery indicator in app

4. **Verify printer compatibility:**
   - App supports ESC/POS thermal printers
   - Supported: Epson TM series, Star Micronics, etc.
   - Unsupported: Regular inkjet printers, receipt printers without ESC/POS

5. **Update printer firmware:**
   - Check manufacturer website
   - Download and install latest firmware
   - Some updates improve Bluetooth stability

### Issue: Sticker prints but with distorted image

**Symptoms:**
- Image prints but colors are wrong
- Image is rotated or stretched
- Part of image is cut off

**Solutions:**

1. **Check image size settings:**
   - Verify sticker size matches printer's paper width
   - Reduce image size if needed
   - Standard thermal paper: 4 inches (100mm) wide

2. **Adjust image format:**
   - Ensure image is in correct format (PNG or JPEG)
   - Check image resolution (should be at least 200x200)

3. **Update printer driver/firmware:**
   - Visit printer manufacturer's website
   - Download latest firmware
   - Update printer via USB or web interface

4. **Test with sample image:**
   - Use a known good image to test
   - This isolates whether issue is with generation or printing

5. **Check printer settings:**
   - Verify correct paper size is set
   - Check darkness/contrast settings
   - Ensure quality settings are appropriate

## Build and Runtime Issues

### Issue: Build fails with random native errors

**Symptoms:**
```
Error: Native build failed
Xcode build failed
Android build failed
```

**Solutions:**

1. **Clean and rebuild:**
   ```bash
   # Clean build artifacts
   rm -rf ios android

   # Clean cache
   pnpm cache clean --force

   # Rebuild
   pnpm prebuild:clean
   pnpm prebuild
   ```

2. **Check Node and tool versions:**
   ```bash
   node --version      # Should be v18+
   npm --version       # v9+
   pnpm --version      # v8+
   ```

3. **Update Expo:**
   ```bash
   pnpm update expo
   pnpm prebuild:clean
   pnpm prebuild
   ```

### Issue: App crashes on startup

**Symptoms:**
- App opens then immediately crashes
- White screen appears briefly
- No error messages

**Solutions:**

1. **Check console for errors:**
   - iOS: Open Xcode > Product > Scheme > Edit Scheme > Run > Console
   - Android: Run `adb logcat | grep -i error`

2. **Check .env file:**
   ```bash
   # Verify .env exists and is readable
   cat .env

   # Make sure it has all required variables
   grep GOOGLE .env
   ```

3. **Verify all dependencies installed:**
   ```bash
   pnpm install --force
   pnpm prebuild:clean
   pnpm prebuild
   ```

4. **Try on clean device/emulator:**
   - Uninstall app completely
   - Restart device/emulator
   - Rebuild and reinstall

### Issue: TypeScript compilation errors

**Symptoms:**
```
Error: Type 'X' is not assignable to type 'Y'
Cannot find module '@/...'
```

**Solutions:**

```bash
# Check TypeScript version
npm list typescript

# Rebuild TypeScript
npx tsc --noEmit

# If errors persist, update config
pnpm update typescript

# Clear and reinstall
rm -rf node_modules
pnpm install
```

## iOS-Specific Issues

### Issue: Xcode build fails with pod install error

**Symptoms:**
```
Error: Pod install failed
CocoaPods error
```

**Solutions:**

```bash
# Update CocoaPods
sudo gem install cocoapods

# Clean and reinstall pods
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..

# Rebuild
pnpm ios
```

### Issue: "No provisioning profile found"

**Symptoms:**
```
Error: No matching provisioning profile found
Building for generic iOS device is not supported
```

**Solutions:**

1. **For simulator only:**
   ```bash
   # Use simulator explicitly
   pnpm ios -- --simulator
   ```

2. **For physical device, set up signing:**
   - Open Xcode: `xed ios/`
   - Select target in Project Navigator
   - Go to Signing & Capabilities
   - Set Team to your Apple ID
   - Xcode will automatically create provisioning profile

3. **Or use EAS Build (recommended for CI/CD):**
   ```bash
   # Install EAS CLI
   npm install -g eas-cli

   # Configure
   eas init

   # Build
   eas build --platform ios
   ```

### Issue: "Command PhaseScriptExecution failed"

**Symptoms:**
```
Error: Phase script execution failed with a nonzero exit code
```

**Solutions:**

```bash
# Clear build artifacts
rm -rf ~/Library/Developer/Xcode/DerivedData
rm -rf ios

# Rebuild from scratch
pnpm prebuild:clean
pnpm prebuild
pnpm ios
```

## Android-Specific Issues

### Issue: "SDK not found" or "ANDROID_HOME not set"

**Symptoms:**
```
Error: ANDROID_HOME is not set
Cannot find Android SDK
```

**Solutions:**

```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk

# Verify Android SDK exists
ls $ANDROID_HOME

# Add to shell profile for persistence
# Add to ~/.bash_profile, ~/.zshrc, or ~/.bashrc:
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Reload shell
source ~/.zshrc  # or source ~/.bash_profile
```

### Issue: Gradle build fails

**Symptoms:**
```
Error: Gradle build failed
Build is broken
```

**Solutions:**

```bash
# Clean Gradle cache
cd android
./gradlew clean
cd ..

# Rebuild
pnpm android

# If still fails, clean everything
rm -rf android
pnpm prebuild:clean
pnpm prebuild
pnpm android
```

### Issue: "APK installation failed"

**Symptoms:**
```
Error: Package installation failed
Cannot install APK
```

**Solutions:**

1. **Ensure emulator/device is ready:**
   ```bash
   adb devices  # Should list your device
   ```

2. **Clear previous installation:**
   ```bash
   adb uninstall com.stickerdream.app
   ```

3. **Rebuild and reinstall:**
   ```bash
   pnpm android
   ```

4. **If using old emulator, recreate it:**
   ```bash
   emulator -list-avds
   emulator -avd Pixel_API_34  # Replace with your AVD name
   ```

## Performance Issues

### Issue: App runs slowly or feels laggy

**Symptoms:**
- Buttons take time to respond
- Animations are choppy
- Scrolling is not smooth

**Solutions:**

1. **Check device performance:**
   - Close other apps
   - Restart device
   - Check available memory

2. **Enable performance profiler:**
   - In Expo dev menu: Shake device or press D
   - Enable "Performance Monitor"

3. **Optimize images:**
   - Ensure generated images are not too large
   - Compress before display
   - Check Gemini image output size

4. **Profile memory usage:**
   - iOS: Xcode > Debug Navigator > Memory
   - Android: Android Profiler in Android Studio

### Issue: Battery drains quickly

**Symptoms:**
- Battery percentage drops rapidly
- Device gets hot

**Solutions:**

1. **Disable dev tools in production:**
   - Remove console.logs in production build
   - Disable remote debugging

2. **Optimize transcription:**
   - Use tiny Whisper model
   - Keep recordings short
   - Process transcription in background

3. **Optimize Bluetooth:**
   - Only scan when needed
   - Don't keep Bluetooth on constantly
   - Close connection when not in use

## Getting Help

### If you can't find a solution:

1. **Check existing documentation:**
   - [README.md](./README.md) - Overview
   - [SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md) - OAuth setup
   - [SETUP_WHISPER.md](./SETUP_WHISPER.md) - Whisper setup
   - Service docs in [services/](./services/)

2. **Check console logs:**
   - iOS: Xcode Console
   - Android: `adb logcat`
   - Expo: Dev server output

3. **Search existing issues:**
   - GitHub Issues (if applicable)
   - Stack Overflow
   - React Native documentation

4. **Provide detailed information:**
   When asking for help, include:
   - Your OS and versions (Node, Expo, React Native)
   - Error message (full text)
   - Steps to reproduce
   - What you've already tried
   - Relevant code snippets

---

**Last Updated**: November 2024
