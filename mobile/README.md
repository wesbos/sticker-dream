# Sticker Dream - React Native App

![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61dafb)
![Expo](https://img.shields.io/badge/Expo-54.0.23-black)

Sticker Dream is a React Native mobile application that transforms voice descriptions into custom sticker designs using AI-powered image generation and enables seamless printing via Bluetooth-connected thermal printers.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Complete Setup Instructions](#complete-setup-instructions)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Google Cloud Setup](#3-google-cloud-setup)
  - [4. Whisper Model Setup](#4-whisper-model-setup)
  - [5. Environment Configuration](#5-environment-configuration)
  - [6. Platform-Specific Setup](#6-platform-specific-setup)
- [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [Architecture Overview](#architecture-overview)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Functionality

- **Voice-to-Text with Whisper**: Record voice descriptions up to 15 seconds and convert them to text using OpenAI's Whisper model
- **AI-Powered Image Generation**: Generate custom sticker images using Google's Gemini AI based on voice descriptions
- **Bluetooth Printing**: Print generated sticker images directly to thermal Bluetooth printers with real-time status monitoring
- **Authentication**: Secure Google OAuth authentication for API access
- **Offline Speech Recognition**: Run Whisper locally on the device for enhanced privacy
- **Real-time Printer Connectivity**: Monitor printer status, battery level, and connection quality

### User Experience

- Modern, intuitive UI with smooth animations
- Real-time transcript display while recording
- Image preview with zoom functionality
- Printer status monitoring dashboard
- Error handling with helpful recovery suggestions
- TypeScript for type-safe development
- Responsive design for iOS and Android

## Requirements

### System Requirements

- **Node.js**: v18 or higher
- **pnpm**: v8 or higher (recommended over npm/yarn for better dependency management)
- **Xcode**: 15.0+ (for iOS development)
- **Android Studio**: Latest version with SDK 34+
- **Mac/Linux/Windows**: Development machine with at least 8GB RAM

### Hardware Requirements

- **iOS Device**: iOS 13.0+
- **Android Device**: Android 10 (API 29)+
- **Bluetooth Printer**: Thermal ESC/POS compatible printer (e.g., Epson TM series, Star Micronics)

### API Requirements

- **Google Cloud Console Account**: For OAuth and Gemini API
- **Google Generative AI Access**: Enabled Gemini API

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/sticker-dream-RN.git
cd sticker-dream-RN-/mobile

# Install dependencies with pnpm
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys

# Download Whisper model
# See SETUP_WHISPER.md for detailed instructions

# For iOS
pnpm prebuild
pnpm ios

# For Android
pnpm prebuild
pnpm android
```

## Complete Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/sticker-dream-RN.git
cd sticker-dream-RN-/mobile
```

### 2. Install Dependencies

We recommend using `pnpm` for better dependency management:

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install project dependencies
pnpm install
```

**Why pnpm?**
- Faster installation
- Better disk space efficiency
- Strict dependency resolution
- Improved monorepo support

### 3. Google Cloud Setup

Follow these detailed steps to set up Google OAuth and Gemini API access.

#### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" at the top
3. Click "NEW PROJECT"
4. Name it "Sticker Dream" and click "CREATE"
5. Wait for the project to be created (may take a minute)
6. Select your new project from the dropdown

#### Step 2: Enable Required APIs

1. In the Google Cloud Console, search for "APIs & Services"
2. Click on "APIs & Services" > "Library"
3. Search for and enable:
   - **Google Generative AI API** (for Gemini)
   - **Google Sign-In API** (for OAuth)

#### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required app information
   - Add your email as a test user

#### Step 4: Create Client IDs for Each Platform

See [SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md) for detailed step-by-step instructions on creating:
- Web Client ID
- iOS Client ID
- Android Client ID

#### Step 5: Create API Key for Gemini

1. In **Credentials**, click **+ CREATE CREDENTIALS** > **API Key**
2. Copy the generated API key
3. You can use this as a fallback for Gemini API (not recommended for production)

### 4. Whisper Model Setup

The app uses OpenAI's Whisper model for speech-to-text conversion. You need to download the model file locally.

See [SETUP_WHISPER.md](./SETUP_WHISPER.md) for complete instructions on:
- Downloading the correct model (ggml-tiny.en.bin)
- Placing it in the correct directory
- Verifying the installation

Quick start:
```bash
# Download Whisper model
curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin \
  -o ~/.cache/whisper.cpp/ggml-tiny.en.bin

# Create directory if it doesn't exist
mkdir -p ~/.cache/whisper.cpp/
```

### 5. Environment Configuration

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Google OAuth Configuration
# Get these from https://console.cloud.google.com
GOOGLE_WEB_CLIENT_ID=YOUR_WEB_CLIENT_ID.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=YOUR_IOS_CLIENT_ID.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com

# Gemini API Key (optional fallback)
# Recommended: Use OAuth-authenticated users instead
GEMINI_API_KEY_FALLBACK=your_gemini_api_key_here
```

**Environment Variables Reference:**
- `GOOGLE_WEB_CLIENT_ID`: OAuth client for web (used in authentication flow)
- `GOOGLE_IOS_CLIENT_ID`: OAuth client specific to iOS
- `GOOGLE_ANDROID_CLIENT_ID`: OAuth client specific to Android
- `GEMINI_API_KEY_FALLBACK`: Direct API key for Gemini (development only)

See [Environment Variables](#environment-variables) section for more details.

### 6. Platform-Specific Setup

#### iOS Setup

**Prerequisites:**
- Xcode 15.0 or later
- CocoaPods
- iOS 13.0 target device/simulator

**Setup Steps:**

1. **Install CocoaPods** (if not already installed):
   ```bash
   sudo gem install cocoapods
   ```

2. **Configure Xcode settings:**
   ```bash
   pnpm prebuild
   ```
   This command:
   - Generates native iOS and Android projects
   - Installs native dependencies
   - Configures build settings

3. **Update info.plist** (if needed):
   The app.json configuration already includes:
   - Microphone usage permissions
   - Bluetooth permissions
   - OAuth scheme configuration

4. **Build and run:**
   ```bash
   pnpm ios
   ```

5. **For physical device testing:**
   - Connect iOS device to Mac
   - In Xcode, select your device as the build target
   - Trust the developer certificate on the device
   - Build and run: `pnpm ios`

#### Android Setup

**Prerequisites:**
- Android Studio latest version
- Android SDK 34+
- Java Development Kit (JDK) 11+
- Minimum API Level 29

**Setup Steps:**

1. **Configure Android SDK:**
   - Open Android Studio
   - Go to Settings > Languages & Frameworks > Android SDK
   - Install SDK API Level 34 and necessary build tools
   - Set ANDROID_HOME environment variable:
     ```bash
     export ANDROID_HOME=~/Android/Sdk
     export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
     ```

2. **Create prebuild:**
   ```bash
   pnpm prebuild
   ```

3. **Connect Android device or emulator:**
   - For physical device: Enable USB debugging
   - For emulator: Start from Android Studio
   - Verify device connection: `adb devices`

4. **Build and run:**
   ```bash
   pnpm android
   ```

5. **Grant permissions at runtime:**
   The app will request:
   - Microphone access (for voice recording)
   - Bluetooth permissions (for printer connection)
   - Grant these permissions when prompted

## Running the App

### Development Mode

**iOS:**
```bash
pnpm start        # Start Expo dev server
pnpm ios          # Run on iOS simulator/device
```

**Android:**
```bash
pnpm start        # Start Expo dev server
pnpm android      # Run on Android simulator/device
```

**Web (development only):**
```bash
pnpm web          # Run in browser
```

### Creating a Prebuild

Before running on physical devices, create native projects:

```bash
# Clean prebuild (recommended for fresh start)
pnpm prebuild:clean

# Or standard prebuild
pnpm prebuild
```

This generates:
- iOS: `ios/` directory with Xcode project
- Android: `android/` directory with Android Studio project

### Debugging

**React Native Debugger:**
- Install from [react-native-debugger](https://github.com/jhen0409/react-native-debugger)
- Enable in Expo dev menu (shake device or press `d`)

**Console Logs:**
- iOS: Check Xcode console
- Android: Use `adb logcat`

**Hot Reload:**
- Expo dev server automatically hot reloads on code changes
- Press `r` in Expo dev server terminal to reload

## Project Structure

```
sticker-dream-RN-/mobile/
├── app/                           # Expo Router navigation structure
│   ├── (main)/                    # Main app routes
│   │   ├── index.tsx              # Home/main screen
│   │   └── _layout.tsx            # Route layout
│   ├── _layout.tsx                # Root layout
│   └── index.tsx                  # App entry point
│
├── components/                    # Reusable React components
│   ├── Button.tsx                 # Custom button component
│   ├── LoadingSpinner.tsx          # Loading animation
│   ├── ErrorMessage.tsx            # Error/warning display
│   ├── ImagePreview.tsx            # Image viewer with zoom
│   ├── TranscriptDisplay.tsx       # Text display with animation
│   ├── PrinterStatus.tsx           # Printer status indicator
│   ├── RecordButton.tsx            # Voice recording component
│   ├── index.ts                    # Component exports
│   └── COMPONENTS.md               # Component documentation
│
├── services/                      # Business logic and API integration
│   ├── auth.service.ts            # Google OAuth authentication
│   ├── gemini.service.ts          # Gemini AI image generation
│   ├── whisper.service.ts         # Speech-to-text transcription
│   ├── printer.service.ts         # Bluetooth printer communication
│   └── *.md                       # Service documentation
│
├── types/                         # TypeScript type definitions
│   └── *.ts                       # Custom types and interfaces
│
├── assets/                        # Images, icons, fonts
│   ├── images/                    # App icons and splash screen
│   └── fonts/                     # Custom fonts (if any)
│
├── App.tsx                        # Root component
├── app.json                       # Expo configuration
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── babel.config.js                # Babel configuration
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── README.md                      # This file
├── SETUP_GOOGLE_OAUTH.md          # Google OAuth setup guide
├── SETUP_WHISPER.md               # Whisper model setup guide
├── TROUBLESHOOTING.md             # Common issues and solutions
└── DEPLOYMENT.md                  # App Store/Play Store deployment

```

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React Native 0.81.5 | Cross-platform mobile development |
| **Navigation** | Expo Router v5 | File-based routing |
| **Build System** | Expo 54 | Managed build environment |
| **Language** | TypeScript 5.9 | Type-safe development |
| **State Management** | React Hooks | Component state management |
| **Storage** | AsyncStorage | Persistent local data |

### Data Flow Architecture

```
User Voice Input
      ↓
┌─────────────────────┐
│  Whisper Service    │  (Speech-to-Text)
│  - Records audio    │
│  - Transcribes text │
└─────────────────────┘
      ↓
   Transcript
      ↓
┌─────────────────────┐
│  Gemini Service     │  (Image Generation)
│  - Sends prompt     │
│  - Receives image   │
└─────────────────────┘
      ↓
   Generated Image
      ↓
┌─────────────────────┐
│  Printer Service    │  (Bluetooth Printing)
│  - Formats image    │
│  - Sends to printer │
│  - Monitors status  │
└─────────────────────┘
      ↓
  Printed Sticker
```

### Service Architecture

#### Auth Service (`services/auth.service.ts`)
- Handles Google OAuth authentication
- Manages authentication tokens
- Provides user identity for API calls
- Supports Web, iOS, and Android platforms

#### Whisper Service (`services/whisper.service.ts`)
- Manages voice recording with expo-av
- Runs Whisper model locally via whisper.rn
- Converts audio to text (English)
- Records up to 15 seconds

#### Gemini Service (`services/gemini.service.ts`)
- Calls Google's Gemini API
- Sends text prompts for image generation
- Receives and processes AI-generated images
- Handles API errors and rate limiting

#### Printer Service (`services/printer.service.ts`)
- Manages Bluetooth connection
- Discovers available printers
- Sends print jobs
- Monitors printer status (battery, connectivity)
- Handles ESC/POS printer commands

### Component Architecture

All UI components are custom-built with:
- Full TypeScript support
- Smooth animations
- Accessibility features
- No external UI libraries
- Production-ready code

Key components:
- **Button**: Customizable action buttons
- **RecordButton**: Voice recording interface
- **LoadingSpinner**: Progress indication
- **ImagePreview**: Generated sticker display
- **TranscriptDisplay**: Voice recognition feedback
- **PrinterStatus**: Device connectivity dashboard

## Environment Variables

### Required Variables

```env
GOOGLE_WEB_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=123456789-xyz.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

### Optional Variables

```env
GEMINI_API_KEY_FALLBACK=AIzaSy...
```

### How to Obtain Variables

**Google Client IDs:**
1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Go to APIs & Services > Credentials
3. Create OAuth 2.0 Client ID for each platform
4. Copy the client ID values

**Gemini API Key:**
1. In Credentials, click CREATE CREDENTIALS > API Key
2. Copy the generated API key
3. Use for development/testing only

## Troubleshooting

### Common Issues

#### Issue: "Whisper model not found"
- **Solution**: Download and place the model in the correct location
- See [SETUP_WHISPER.md](./SETUP_WHISPER.md) for detailed steps

#### Issue: Google authentication fails
- **Solution**: Verify OAuth credentials in `.env` file
- Ensure app bundle ID matches in Google Cloud Console
- See [SETUP_GOOGLE_OAUTH.md](./SETUP_GOOGLE_OAUTH.md)

#### Issue: Bluetooth printer won't connect
- **Solution**: Ensure printer is powered, visible, and nearby
- Grant Bluetooth permissions on the device
- See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more

#### Issue: "Gemini API not accessible"
- **Solution**: Verify Google Cloud Project has API enabled
- Check API quotas and rate limits
- Ensure authenticated user has API access

### Getting Help

For detailed troubleshooting:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review console logs and error messages
3. Verify all setup steps were completed correctly
4. Check [services documentation](./services/) for specific service issues

## Deployment

### Preparing for App Store / Play Store

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions on:
- Building release versions
- Signing certificates and provisioning profiles
- Code obfuscation and optimization
- Testing before submission
- App Store Connect setup
- Google Play Console setup
- Submission procedures
- Post-launch monitoring

### Quick Deployment Checklist

- [ ] Environment variables configured for production
- [ ] Whisper model installed and tested
- [ ] OAuth credentials updated for production apps
- [ ] App icons and splash screens finalized
- [ ] Privacy policy and terms created
- [ ] App tested on real devices
- [ ] Performance optimized
- [ ] Analytics configured (optional)

## Contributing

We welcome contributions! Please follow these guidelines:

### Setup Development Environment

```bash
pnpm install
pnpm prebuild
# Then run on iOS or Android
```

### Development Process

1. Create a feature branch from `main`
2. Make your changes
3. Write/update tests if applicable
4. Test on both iOS and Android
5. Create a pull request with description

### Code Style

- Use TypeScript for all code
- Follow the existing code style
- Use meaningful variable and function names
- Add comments for complex logic
- Keep components small and focused

### Commit Message Format

```
<type>: <subject>

<body (optional)>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat: add printer status refresh button
docs: update Whisper setup instructions
```

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

---

## Additional Documentation

- [Component Library](./COMPONENTS.md) - UI components guide
- [Google OAuth Setup](./SETUP_GOOGLE_OAUTH.md) - Detailed Google Cloud setup
- [Whisper Setup](./SETUP_WHISPER.md) - Speech recognition model setup
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions
- [Deployment Guide](./DEPLOYMENT.md) - App Store and Play Store submission
- [Gemini Service](./services/GEMINI_SERVICE_USAGE.md) - Image generation API
- [Architecture](./COMPONENT_ARCHITECTURE.md) - Component architecture details

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review service-specific documentation in `/services` directory
- Consult [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Status**: Production Ready
