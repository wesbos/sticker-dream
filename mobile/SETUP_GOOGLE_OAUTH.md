# Google Cloud Console OAuth Setup Guide

Complete step-by-step guide to set up Google OAuth 2.0 credentials for Sticker Dream on iOS, Android, and Web platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Google Cloud Project](#create-google-cloud-project)
3. [Enable Required APIs](#enable-required-apis)
4. [Configure OAuth Consent Screen](#configure-oauth-consent-screen)
5. [Create OAuth Credentials](#create-oauth-credentials)
6. [Get Gemini API Key](#get-gemini-api-key)
7. [Configure Your App](#configure-your-app)
8. [Testing OAuth](#testing-oauth)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

- Google Account with billing enabled (required for API access)
- Access to [Google Cloud Console](https://console.cloud.google.com)
- Sticker Dream mobile app cloned locally
- iOS bundle identifier: `com.stickerdream.app`
- Android package name: `com.stickerdream.app`

## Create Google Cloud Project

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google Account
3. You'll see the main dashboard

### Step 2: Create New Project

1. In the top navigation bar, click **Select a Project**
2. Click the **NEW PROJECT** button
3. Fill in the form:
   - **Project Name**: `Sticker Dream` (or your preferred name)
   - **Organization**: Leave as default or select yours
   - **Location**: Leave as default
4. Click **CREATE**
5. Wait for the project to be created (this may take a minute)
6. Once created, select it from the dropdown

### Step 3: Set Up Billing (if needed)

1. Click the hamburger menu (≡) on the left
2. Go to **Billing**
3. Link a payment method to enable APIs
4. You have free credits ($300) for new accounts

## Enable Required APIs

### Step 1: Open API Library

1. In the left sidebar, click **APIs & Services**
2. Click **Library**
3. You'll see the API library with search capabilities

### Step 2: Enable Google Sign-In API

1. Search for `Google Sign-In`
2. Click on **Google Sign-In API**
3. Click **ENABLE**
4. Wait for enabling to complete

### Step 3: Enable Google Generative AI API

1. In the API library, search for `Generative AI`
2. Click on **Google Generative AI API**
3. Click **ENABLE**
4. Wait for enabling to complete

### Step 4: Verify APIs

1. Go to **APIs & Services** > **Enabled APIs & Services**
2. Confirm both APIs are listed:
   - Google Sign-In API
   - Google Generative AI API

## Configure OAuth Consent Screen

### Step 1: Access Consent Screen Settings

1. In **APIs & Services**, click **OAuth consent screen**
2. If prompted to choose a user type, select **External** (for testing)
3. Click **CREATE**

### Step 2: Fill in App Information

On the **OAuth consent screen** form:

**App Information:**
- **App name**: `Sticker Dream`
- **User support email**: your-email@gmail.com
- **App logo**: (optional) Upload your app icon

**Developer contact information:**
- **Email addresses**: your-email@gmail.com

Click **SAVE AND CONTINUE**

### Step 3: Add Scopes

1. On the **Scopes** page, click **ADD OR REMOVE SCOPES**
2. Select these scopes:
   - `openid` - OpenID Connect
   - `email` - View your email
   - `profile` - View your profile information
3. Click **UPDATE**
4. Click **SAVE AND CONTINUE**

### Step 4: Add Test Users

1. On the **Test users** page, click **ADD USERS**
2. Enter your email address
3. Click **ADD**
4. Click **SAVE AND CONTINUE**

Once your app is ready for production, you can submit for verification to remove the test user requirement.

## Create OAuth Credentials

### Step 1: Create Web Client ID

This is used for initial authentication.

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth client ID**
3. If you haven't configured the consent screen, you'll be prompted
4. Choose **Web application**
5. Fill in:
   - **Name**: `Sticker Dream Web`
   - **Authorized redirect URIs**: Leave empty for now (not needed for mobile)
6. Click **CREATE**
7. Copy the **Client ID** - you'll need this for `GOOGLE_WEB_CLIENT_ID`
8. Click OK

**Save this value:**
```
GOOGLE_WEB_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

### Step 2: Create iOS Client ID

1. In **Credentials**, click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Choose **iOS**
3. Fill in:
   - **Name**: `Sticker Dream iOS`
   - **Bundle ID**: `com.stickerdream.app`
4. Click **CREATE**
5. A modal will show your **Client ID** - copy it
6. Click OK

**Save this value:**
```
GOOGLE_IOS_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

### Step 3: Create Android Client ID

1. In **Credentials**, click **+ CREATE CREDENTIALS** > **OAuth client ID**
2. Choose **Android**
3. Fill in the form:
   - **Name**: `Sticker Dream Android`
   - **Package name**: `com.stickerdream.app`
   - **SHA-1 certificate fingerprint**: See below

**Getting Your SHA-1 Fingerprint:**

For development, use the debug key:

```bash
# macOS/Linux
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep "SHA1"

# Windows
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android | grep "SHA1"
```

Copy the SHA-1 value (without colons) into the form.

4. Click **CREATE**
5. Copy the **Client ID** from the confirmation modal
6. Click OK

**Save this value:**
```
GOOGLE_ANDROID_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

## Get Gemini API Key

### Step 1: Create API Key

1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Your new API key will be displayed in a modal
4. Click the copy icon to copy it
5. Click **CLOSE**

**Save this value:**
```
GEMINI_API_KEY_FALLBACK=YOUR_API_KEY
```

### Step 2: Restrict API Key (Recommended)

For security in production:

1. Click on the API key you just created
2. Under **API restrictions**, select **Restrict key**
3. Select **Google Generative AI API**
4. Click **SAVE**

**Note**: The fallback API key should only be used for development/testing. In production, users should authenticate via OAuth.

## Configure Your App

### Step 1: Update Environment Variables

Create or update `.env` in the project root:

```env
# From your OAuth credentials
GOOGLE_WEB_CLIENT_ID=123456789.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=123456789-xyz.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=123456789-abc.apps.googleusercontent.com

# Optional: Fallback API key
GEMINI_API_KEY_FALLBACK=AIzaSyD...
```

### Step 2: Update app.json (iOS)

The app.json already includes iOS configuration, but verify:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.YOUR_CLIENT_ID"
            ]
          }
        ]
      }
    }
  }
}
```

Replace `YOUR_CLIENT_ID` with your iOS client ID (the part before `.apps.googleusercontent.com`).

### Step 3: Rebuild Native Projects

```bash
pnpm prebuild:clean
pnpm prebuild
```

This regenerates the native projects with your updated credentials.

## Testing OAuth

### Test on iOS

1. Start the dev server:
   ```bash
   pnpm start
   ```

2. Run on iOS simulator:
   ```bash
   pnpm ios
   ```

3. On the main screen, tap the "Sign In" button
4. You should be presented with the Google Sign-In dialog
5. Sign in with the test user email you added in the consent screen
6. After successful authentication, you should see a welcome message

### Test on Android

1. Start the dev server:
   ```bash
   pnpm start
   ```

2. Run on Android emulator:
   ```bash
   pnpm android
   ```

3. On the main screen, tap the "Sign In" button
4. Google Sign-In dialog should appear
5. Sign in with the test user email
6. After successful authentication, you should be authenticated

### Test Gemini API Access

After signing in:

1. Record a short voice message (e.g., "Create a cat sticker")
2. The app should transcribe it and send it to Gemini
3. A sticker image should be generated
4. You can preview and print it

## Troubleshooting

### Issue: "Invalid Client ID"

**Cause**: Client ID doesn't match app configuration

**Solution**:
1. Verify the Client ID in `.env` is correct
2. Ensure you're using the correct credential type (iOS/Android)
3. Check bundle ID/package name matches in Google Console
4. Rebuild: `pnpm prebuild:clean && pnpm prebuild`

### Issue: "Redirect URI mismatch"

**Cause**: Usually only occurs with Web OAuth flow, not mobile

**Solution**:
1. Make sure you're using the correct Client ID type
2. For mobile apps, you don't need redirect URIs
3. Verify you're using iOS or Android credentials, not Web

### Issue: Sign-In Dialog Doesn't Appear

**Cause**: Google Sign-In plugin not properly configured

**Solution**:
1. Check that iOS Client ID is set in app.json
2. Verify bundle ID in app.json matches Google Console
3. Ensure @react-native-google-signin/google-signin is installed: `pnpm install`
4. Rebuild native projects: `pnpm prebuild:clean && pnpm prebuild`

### Issue: "User not found in test users"

**Cause**: You signed in with a different Google account

**Solution**:
1. Add your actual Google account as a test user in OAuth consent screen
2. Or, submit your app for verification to allow any user
3. Sign out and sign back in with the correct account

### Issue: "Gemini API not enabled"

**Cause**: API not activated in Google Cloud Project

**Solution**:
1. Go to **APIs & Services** > **Enabled APIs & Services**
2. Search for "Generative AI"
3. Click and **ENABLE** if not already enabled
4. Wait a few minutes for activation
5. Rebuild and retry: `pnpm prebuild && pnpm ios/android`

### Issue: "API quota exceeded"

**Cause**: Too many API calls made

**Solution**:
1. Go to **APIs & Services** > **Credentials**
2. Click on your Gemini API key
3. Check quotas under **Quotas**
4. You can request quota increase if needed
5. Wait for quota to reset (usually daily)

## Best Practices

### Development

- Use test users for testing
- Use debug keystore for Android development
- Store credentials in `.env` (never commit to git)
- Test on real devices before deployment

### Production

- Submit app for verification to remove test user requirement
- Use production signing certificate for Android
- Create separate OAuth credentials for production app
- Never commit API keys or credentials to version control
- Rotate API keys periodically
- Monitor API usage and quota

### Security

- Keep API keys secret - never expose in frontend
- Use environment variables for all secrets
- Authenticate users via OAuth (not direct API keys)
- Use HTTPS for all API calls (handled automatically)
- Implement rate limiting on your backend if applicable

## Additional Resources

- [Google Cloud Console](https://console.cloud.google.com)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Gemini API Documentation](https://ai.google.dev/tutorials/python_quickstart)
- [App Signing with Google Cloud](https://cloud.google.com/docs/authentication)

## Next Steps

1. Verify OAuth works in your app
2. Test Gemini API image generation
3. Set up [Whisper model](./SETUP_WHISPER.md)
4. Test voice-to-text functionality
5. Set up Bluetooth printer connection
6. Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues

---

**Last Updated**: November 2024
