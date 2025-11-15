# Sticker Dream Deployment Guide

Complete guide to building, testing, and deploying Sticker Dream to Apple App Store and Google Play Store.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Building for Production](#building-for-production)
3. [iOS Deployment](#ios-deployment)
4. [Android Deployment](#android-deployment)
5. [Testing Before Submission](#testing-before-submission)
6. [App Store Submission](#app-store-submission)
7. [Play Store Submission](#play-store-submission)
8. [Post-Launch Monitoring](#post-launch-monitoring)
9. [Troubleshooting Deployment](#troubleshooting-deployment)
10. [Update Management](#update-management)

## Pre-Deployment Checklist

### Functional Testing
- [ ] All features work on iOS device
- [ ] All features work on Android device
- [ ] Voice recording works and transcription is accurate
- [ ] Image generation produces quality results
- [ ] Bluetooth printing successfully prints stickers
- [ ] Google OAuth authentication works correctly
- [ ] Error handling is graceful with helpful messages
- [ ] App doesn't crash or freeze under normal usage

### Code Quality
- [ ] No console.log statements left in production code
- [ ] All TypeScript errors fixed (run `npx tsc --noEmit`)
- [ ] Remove debug code and commented-out code
- [ ] No hardcoded API keys or secrets
- [ ] Version number updated in package.json and app.json
- [ ] All dependencies up to date (run `pnpm update`)

### Security & Privacy
- [ ] Privacy policy created and accessible in app
- [ ] Terms of service created and accessible
- [ ] All API keys moved to environment variables
- [ ] No sensitive data logged or stored insecurely
- [ ] SSL/TLS used for all API calls (default with Expo)
- [ ] Permissions only requested when necessary

### Performance & Optimization
- [ ] App bundle size checked and optimized
- [ ] Unnecessary images removed or compressed
- [ ] Whisper model is tiny variant (ggml-tiny.en.bin)
- [ ] Image caching implemented
- [ ] Memory leaks investigated and fixed
- [ ] App starts in under 3 seconds

### App Store Requirements
- [ ] App icons (all sizes) created
- [ ] Splash screen created
- [ ] Screenshots prepared (2-5 per platform)
- [ ] App description written (short and long versions)
- [ ] Keywords/search terms selected
- [ ] Release notes prepared
- [ ] Age rating questionnaire completed
- [ ] Contact information verified

### Configuration Files
- [ ] app.json version updated to match package.json
- [ ] Bundle IDs correct (iOS: com.stickerdream.app, Android: com.stickerdream.app)
- [ ] EAS project ID configured (if using EAS)
- [ ] .env file not committed to git
- [ ] .gitignore includes sensitive files

## Building for Production

### Step 1: Prepare Environment

```bash
# Ensure on main/release branch
git checkout main

# Update version number
# Edit package.json and app.json
# Example: 1.0.0 -> 1.1.0

# Create production environment
cp .env.example .env.production
# Update .env.production with production API keys
```

### Step 2: Update Version Numbers

Update in two files:

**package.json:**
```json
{
  "version": "1.0.0",  // Increment this
  "dependencies": { ... }
}
```

**app.json:**
```json
{
  "expo": {
    "version": "1.0.0",  // Same as package.json
    "ios": {
      "buildNumber": "1"  // Increment for each iOS build
    },
    "android": {
      "versionCode": 1  // Increment for each Android build
    }
  }
}
```

### Step 3: Verify Production Configuration

```bash
# Check app.json is valid
expo start --no-dev --no-debugger

# Verify bundle IDs match Google Cloud and Apple
grep -E "bundleIdentifier|package" app.json

# Expected output:
# "bundleIdentifier": "com.stickerdream.app",
# "package": "com.stickerdream.app",
```

### Step 4: Create Production Build

#### Option A: Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Configure project
eas init  # If not already done

# Build for iOS
eas build --platform ios --auto-submit

# Build for Android
eas build --platform android

# Check build status
eas build:list
```

#### Option B: Manual Build (Advanced)

**iOS:**
```bash
pnpm prebuild:clean
pnpm prebuild

# Open in Xcode
xed ios/

# In Xcode:
# 1. Select Product > Scheme > Edit Scheme
# 2. Change Build Configuration from Debug to Release
# 3. Select Product > Build for Testing (or Generic iOS Device)
# 4. Product > Archive
```

**Android:**
```bash
pnpm prebuild:clean
pnpm prebuild

cd android

# Build release APK
./gradlew assembleRelease

# Or build Bundle (better for Play Store)
./gradlew bundleRelease

cd ..
```

## iOS Deployment

### Prerequisites

- Apple Developer Account ($99/year)
- Mac with Xcode 15+
- App Store Connect access

### Step 1: Setup Apple Developer Account

1. Go to [Apple Developer](https://developer.apple.com)
2. Sign in or create account
3. Go to [App Store Connect](https://appstoreconnect.apple.com)
4. Agree to agreements and setup payment info

### Step 2: Create App ID

In App Store Connect:

1. Click **Identifiers** in left sidebar
2. Click **+** to add new
3. Select **App IDs**
4. Choose **App** type
5. Fill in:
   - **Description**: Sticker Dream
   - **Bundle ID**: com.stickerdream.app (Explicit)
   - **Capabilities**:
     - Enable Sign in with Apple
     - Enable On Demand Resources (optional)
6. Click **Continue** and **Register**

### Step 3: Create Signing Certificate

1. In **Certificates, Identifiers & Profiles**, select **Certificates**
2. Click **+** to create new
3. Choose **Apple Distribution**
4. Follow instructions to:
   - Create Certificate Signing Request (CSR) on Mac
   - Upload CSR
   - Download certificate
   - Install certificate (double-click on Mac)

### Step 4: Create Provisioning Profile

1. In **Identifiers & Profiles**, select **Provisioning Profiles**
2. Click **+** to create new
3. Choose **App Store**
4. Select your App ID (Sticker Dream)
5. Select your certificate
6. Enter Profile Name: `StickerDream_AppStore`
7. Download and install (double-click on Mac)

### Step 5: Configure Xcode for Signing

```bash
# Rebuild with new credentials
pnpm prebuild:clean
pnpm prebuild

# Open in Xcode
xed ios/

# In Xcode:
# 1. Select project in navigator
# 2. Select target "sticker-dream-mobile"
# 3. Go to "Signing & Capabilities" tab
# 4. Select your team
# 5. Ensure provisioning profile is selected
# 6. Sign in with Apple should show as capability
```

### Step 6: Archive and Upload

```bash
# In Xcode
# 1. Product > Scheme > Select "sticker-dream-mobile"
# 2. Product > Destination > Generic iOS Device
# 3. Product > Archive
# 4. Archives window opens
# 5. Click "Distribute App"
# 6. Select "App Store Connect"
# 7. Select "Upload"
# 8. Follow prompts to complete upload
```

### Step 7: Submit on App Store Connect

In [App Store Connect](https://appstoreconnect.apple.com):

1. Click **Apps** > **Sticker Dream**
2. Fill in required information:
   - **App Information**: Name, subtitle, privacy policy, support URL
   - **Pricing and Availability**: Choose countries, price tier
   - **General App Information**:
     - Bundle ID (auto-filled)
     - Category: Graphics & Design
     - Subcategory: Stickers
   - **App Screenshots**: Add 2-5 screenshots for each device type
   - **Description**: Write compelling description (1000 chars max)
   - **Keywords**: Add relevant keywords
   - **Support URL**: Your website or contact
   - **Privacy Policy URL**: Required
   - **Rating**: Complete age rating questionnaire
   - **Build**: Select the build you just uploaded

3. Click **Submit for Review**

### iOS Submission Tips

- Include clear screenshots showing key features
- Mention voice recording, AI generation, and printing
- Set accurate age rating (usually 4+ for this app)
- Provide test account if login required
- Explain what microphone and Bluetooth permissions are for
- Check Apple's review guidelines before submitting

## Android Deployment

### Prerequisites

- Google Play Developer Account ($25 one-time)
- Android Studio
- Signing key for app

### Step 1: Setup Google Play Developer Account

1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with Google account or create new one
3. Complete account setup:
   - Accept terms
   - Provide payment method
   - Enter business information
4. Wait for account activation (usually instant)

### Step 2: Create Signing Key

```bash
# Generate keystore (only do once!)
keytool -genkey-keystore ~/sticker-dream-key.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias sticker-dream-key

# Follow prompts:
# - Password: Create strong password (save it!)
# - First and last name: Your name
# - Organization unit: Your company
# - Organization: Your company
# - City: Your city
# - State: Your state
# - Country: Your country code (US, UK, etc.)
```

**Important**: Back up this keystore file! You'll need it for all future updates.

```bash
# Backup keystore
cp ~/sticker-dream-key.keystore ~/backup/sticker-dream-key.keystore
```

### Step 3: Create App on Google Play

1. In Google Play Console, click **+ Create app**
2. Enter app name: "Sticker Dream"
3. Choose category: "Graphics & Design"
4. Fill in:
   - Default language: English
   - App type: Application
   - Paid or free: Free
5. Accept declarations
6. Click **Create app**

### Step 4: Build Signed Bundle

```bash
# Update version numbers first
# Edit package.json and app.json - increment versionCode

# Prepare environment
export ANDROID_KEYSTORE_PATH=~/sticker-dream-key.keystore
export ANDROID_KEYSTORE_ALIAS=sticker-dream-key
export ANDROID_KEYSTORE_PASSWORD=your_password

# Rebuild
pnpm prebuild:clean
pnpm prebuild

# Build signed app bundle
cd android
./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file=$ANDROID_KEYSTORE_PATH \
  -Pandroid.injected.signing.store.password=$ANDROID_KEYSTORE_PASSWORD \
  -Pandroid.injected.signing.key.alias=$ANDROID_KEYSTORE_ALIAS \
  -Pandroid.injected.signing.key.password=$ANDROID_KEYSTORE_PASSWORD

cd ..

# Find bundle
ls -lh android/app/build/outputs/bundle/release/
```

### Step 5: Upload to Google Play

In Google Play Console:

1. Click **Testing** > **Internal testing**
2. Click **Create new release**
3. Click **Browse files** and select `app-release.aab` from build output
4. Enter release notes
5. Click **Review release**
6. Click **Roll out to internal testing**

### Step 6: Create Production Release

After testing internally:

1. Click **Testing** > **Closed testing** > **Create release**
2. Promote from internal testing release
3. Add beta testers (Google accounts)
4. Test for 1-2 weeks

Then promote to **Production**:

1. In Google Play Console, click **Production**
2. Click **Create new release**
3. Select your tested build
4. Add release notes: "Initial launch"
5. Complete store listing (see below)
6. Click **Review release**
7. Click **Roll out to production**

### Step 7: Complete Store Listing

In **All apps** > **Sticker Dream** > **Store listing**:

1. **App name**: Sticker Dream
2. **Short description**: One-line description (80 chars)
3. **Full description**: Detailed description (4000 chars max)
4. **Screenshots**: Upload 2-8 screenshots
5. **Feature graphic**: 1024 x 500px image
6. **Icon**: 512 x 512px app icon (PNG)
7. **Category**: Graphics & Design
8. **Content rating**: Complete questionnaire
9. **Target audience**: Select appropriate age group
10. **Contact details**: Email for support

### Android Submission Tips

- Provide clear screenshots showing voice recording, image generation, printing
- Explain Microphone and Bluetooth permissions clearly
- Mention it's an AI-powered sticker generation app
- Include privacy policy URL
- Content rating: Usually "Low Maturity"
- Provide support email for user feedback

## Testing Before Submission

### Manual Testing Checklist

- [ ] Test on iOS (minimum iOS 13)
- [ ] Test on Android (minimum Android 10)
- [ ] Test all UI interactions
- [ ] Test voice recording (test with different accents, volumes)
- [ ] Test image generation (test with various prompts)
- [ ] Test Bluetooth printing (with actual printer if possible)
- [ ] Test error handling (simulate network errors, permission denials)
- [ ] Test authentication (sign in, sign out, re-authentication)
- [ ] Verify all images load and display correctly
- [ ] Check orientation handling (portrait and landscape if applicable)
- [ ] Test on low-memory device
- [ ] Test on low-bandwidth network

### Automated Testing

```bash
# Run TypeScript type checking
npx tsc --noEmit

# Check for console errors
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | grep -v ".test."

# Check for hardcoded secrets
grep -r "API_KEY\|SECRET\|PASSWORD" --include="*.ts" --include="*.tsx" | grep -v ".env"
```

### Performance Testing

- App should start in under 3 seconds
- Recording should be responsive (UI doesn't freeze)
- Image generation should show loading indicator
- Transcription should complete in under 10 seconds
- Printing should not block UI
- Memory usage should not exceed 200MB

### Crash Testing

Test app doesn't crash when:

- Network is disconnected
- Microphone permission is denied
- Bluetooth permission is denied
- Bluetooth disconnects mid-print
- API key is invalid
- API quota is exceeded
- Device storage is low
- Device memory is low

## App Store Submission

### Before You Submit (iOS)

1. **Ensure all data is real:**
   - Screenshot text should be accurate
   - Feature descriptions should match functionality
   - No placeholder text ("TODO", "FIX ME", etc.)

2. **Test on real device:**
   - Not just simulator
   - iOS 13+ devices
   - Different iPhone sizes

3. **Verify permissions are needed:**
   - Remove unnecessary permission requests
   - Explain in app why each permission is needed

4. **Check guidelines:**
   - Review [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
   - Ensure no prohibited content
   - Verify no use of private APIs

### Common App Store Rejections

**Rejection: "Missing privacy policy"**
- Solution: Add privacy policy URL in App Store Connect
- Policy should explain data collection and usage

**Rejection: "Unexplained Bluetooth usage"**
- Solution: Clearly explain in app description why Bluetooth is needed
- Add usage explanation in Bluetooth permission prompt

**Rejection: "Unreleased/Beta features"**
- Solution: Remove beta tags from screenshots
- Ensure all features in screenshots actually work

**Rejection: "Poor user experience"**
- Solution: Ensure app doesn't crash
- Test all buttons and features work
- Provide clear feedback for all actions

## Play Store Submission

### Before You Submit (Android)

1. **APK/Bundle requirements:**
   - Signed with same key as previous version (if update)
   - Minimum API level 29+
   - Target API level 34+

2. **Test on real device:**
   - Not just emulator
   - Android 10+ devices
   - Different screen sizes

3. **Complete data policy:**
   - Declare all permissions used
   - Explain data collection
   - Provide privacy policy

### Common Play Store Rejections

**Rejection: "Malware/PHA detected"**
- Solution: Ensure no malicious code
- Run through [App Security Analysis](https://play.google.com/console)

**Rejection: "Targeting issue"**
- Solution: Verify target API level is current
- Test on target devices

**Rejection: "Misleading description"**
- Solution: Ensure app features match description
- No false claims about AI or capabilities

## Post-Launch Monitoring

### Day 1-7: Critical Monitoring

- Monitor crash reports
- Check user reviews for critical issues
- Ensure server/API capacity is sufficient
- Monitor API quota usage
- Check error logs for patterns

### Week 1-4: Active Monitoring

- Track user engagement metrics
- Monitor feature usage
- Collect user feedback
- Fix any discovered bugs
- Prepare first update if needed

### Ongoing: Regular Maintenance

```bash
# Check for dependency updates monthly
pnpm outdated

# Update dependencies
pnpm update --latest

# Re-test and release patch version
```

### Analytics Setup (Optional)

Consider implementing:
- Crash reporting (Sentry, Bugsnag)
- Analytics (Firebase, Amplitude)
- User feedback collection
- Beta testing program

## Update Management

### Publishing Updates

```bash
# Increment version numbers
# In package.json and app.json
# Example: 1.0.0 -> 1.0.1 (patch)
# Example: 1.0.0 -> 1.1.0 (minor)
# Example: 1.0.0 -> 2.0.0 (major)

# Rebuild
pnpm prebuild:clean
pnpm prebuild

# Build and submit
# Follow same steps as initial release
# But with incremented version numbers
```

### Release Notes Template

```
Version 1.0.1 - November 15, 2024

New Features:
- [Feature description]

Bug Fixes:
- [Bug fix description]

Improvements:
- [Improvement description]

Known Issues:
- [Any known issues to users]
```

### Version Management Best Practices

- **Patch (1.0.1)**: Bug fixes only
- **Minor (1.1.0)**: New features, no breaking changes
- **Major (2.0.0)**: Breaking changes, significant redesign
- Update every 2-4 weeks with improvements
- Major updates every 2-3 months

## Troubleshooting Deployment

### Issue: Build fails with signing errors

```bash
# iOS
xed ios/
# Check Signing & Capabilities tab
# Ensure team is selected

# Android
./gradlew clean
./gradlew bundleRelease
```

### Issue: App rejected for unclear reason

- Check rejection email for specific reasons
- Review corresponding guideline
- Make required changes
- Resubmit with detailed explanations

### Issue: Update not showing in app store

- Verify build was uploaded successfully
- Check processing status in console
- Wait up to 24 hours for propagation
- Clear app cache: Settings > Apps > Clear Cache

### Getting Help

- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policies](https://play.google.com/about/developer-content-policy/)
- [Expo Build Documentation](https://docs.expo.dev/eas-update/introduction/)
- React Native Discord community

---

**Last Updated**: November 2024

## Quick Reference

### iOS Submission Checklist
```
[ ] Apple Developer Account active
[ ] App ID created
[ ] Signing certificate created
[ ] Provisioning profile created
[ ] Build archived in Xcode
[ ] Upload to App Store Connect
[ ] Complete store listing
[ ] Submit for review
```

### Android Submission Checklist
```
[ ] Google Play Developer Account active
[ ] Keystore created and backed up
[ ] App created in Play Console
[ ] Signed bundle built
[ ] Upload to internal testing
[ ] Test internally
[ ] Promote to production
[ ] Complete store listing
[ ] Publish
```

