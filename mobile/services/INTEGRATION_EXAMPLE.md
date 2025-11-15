# Gemini Service Integration Example

Complete example showing how to integrate the Gemini image generation service with the existing Auth service.

## Integration Overview

The Gemini service is designed to work seamlessly with the Auth service:

```
Auth Service (GoogleSignin) -> Get AccessToken -> Gemini Service -> Generate Image
```

## Step-by-Step Integration

### 1. Get Access Token from Auth Service

```typescript
import { authService } from './services/auth.service';

// User is already signed in
const tokens = await authService.getTokens();
// tokens.accessToken is now available
```

### 2. Use Gemini Service with Access Token

```typescript
import { generateImage, ImageGenerationError } from './services/gemini.service';

try {
  const result = await generateImage(userPrompt, tokens.accessToken);
  // Image generated successfully
} catch (error) {
  if (error instanceof ImageGenerationError) {
    // Handle specific error
  }
}
```

## Complete Component Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Image, Button, Text, TextInput, ActivityIndicator, Alert } from 'react-native';
import { authService } from './services/auth.service';
import { generateImageAsDataUri, ImageGenerationError } from './services/gemini.service';

export function StickerDreamScreen() {
  const [prompt, setPrompt] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<any>(null);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        const userTokens = await authService.getTokens();
        setTokens(userTokens);
      } catch (err) {
        setError('Failed to initialize authentication');
      }
    };
    
    initAuth();
  }, []);

  const handleGenerateSticker = async () => {
    if (!prompt.trim()) {
      Alert.alert('Empty Prompt', 'Please describe what sticker you want');
      return;
    }

    if (!tokens) {
      Alert.alert('Authentication Error', 'Please sign in first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setImageUri(null);

      // Generate the image
      const dataUri = await generateImageAsDataUri(
        prompt,
        tokens.accessToken
      );

      setImageUri(dataUri);
      setPrompt(''); // Clear input after success
    } catch (err) {
      if (err instanceof ImageGenerationError) {
        handleImageGenerationError(err);
      } else {
        setError('Unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageGenerationError = (error: ImageGenerationError) => {
    switch (error.code) {
      case 'AUTH_FAILED':
        Alert.alert('Authentication Error', 'Your session expired. Please sign in again.');
        // Could trigger re-authentication
        break;

      case 'QUOTA_EXCEEDED':
        Alert.alert(
          'Too Many Requests',
          'Too many stickers generated. Please wait a moment and try again.'
        );
        break;

      case 'NETWORK_ERROR':
        Alert.alert(
          'Network Error',
          'Please check your internet connection and try again.'
        );
        break;

      case 'INVALID_PROMPT_CONTENT':
        Alert.alert(
          'Content Not Allowed',
          'That request contains content that cannot be turned into a sticker. Please try a different description.'
        );
        break;

      case 'PROMPT_TOO_LONG':
        Alert.alert(
          'Description Too Long',
          'Please use a shorter description (under 2000 characters).'
        );
        break;

      case 'EMPTY_PROMPT':
        Alert.alert('Empty Description', 'Please describe what sticker you want');
        break;

      default:
        Alert.alert(
          `Error (${error.code})`,
          error.message || 'Failed to generate sticker'
        );
    }
    
    setError(`${error.code}: ${error.message}`);
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Loading state */}
      {loading && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 10 }}>Dreaming up your sticker...</Text>
        </View>
      )}

      {/* Input area */}
      <View style={{ marginVertical: 10 }}>
        <TextInput
          placeholder="Describe your sticker idea..."
          value={prompt}
          onChangeText={setPrompt}
          editable={!loading}
          multiline
          numberOfLines={3}
          style={{
            borderWidth: 1,
            borderColor: '#ccc',
            borderRadius: 8,
            padding: 10,
            marginBottom: 10,
          }}
        />

        <Button
          title={loading ? 'Generating...' : 'Generate Sticker'}
          onPress={handleGenerateSticker}
          disabled={loading}
        />
      </View>

      {/* Error display */}
      {error && (
        <Text style={{ color: 'red', marginVertical: 10 }}>
          {error}
        </Text>
      )}

      {/* Generated image */}
      {imageUri && (
        <View style={{ marginVertical: 10, alignItems: 'center' }}>
          <Image
            source={{ uri: imageUri }}
            style={{ width: 300, height: 400, borderRadius: 8 }}
          />
          <Text style={{ marginTop: 10, textAlign: 'center', fontWeight: 'bold' }}>
            Your Sticker is Ready!
          </Text>
        </View>
      )}
    </View>
  );
}
```

## Advanced Integration: With Caching

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateImage } from './services/gemini.service';

interface CachedImage {
  prompt: string;
  base64: string;
  timestamp: number;
}

class StickerCache {
  private static CACHE_KEY = 'sticker_cache';
  private static MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  static async get(prompt: string): Promise<string | null> {
    try {
      const cache = await AsyncStorage.getItem(this.CACHE_KEY);
      if (!cache) return null;

      const images: CachedImage[] = JSON.parse(cache);
      const cached = images.find(img => img.prompt === prompt);

      if (!cached) return null;

      // Check if cache is expired
      if (Date.now() - cached.timestamp > this.MAX_AGE) {
        await this.remove(prompt);
        return null;
      }

      return cached.base64;
    } catch (err) {
      console.warn('Cache read error:', err);
      return null;
    }
  }

  static async set(prompt: string, base64: string): Promise<void> {
    try {
      const cache = await AsyncStorage.getItem(this.CACHE_KEY) || '[]';
      let images: CachedImage[] = JSON.parse(cache);

      // Remove old entry if exists
      images = images.filter(img => img.prompt !== prompt);

      // Add new entry
      images.push({
        prompt,
        base64,
        timestamp: Date.now(),
      });

      // Keep only last 50 images
      if (images.length > 50) {
        images = images.slice(-50);
      }

      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(images));
    } catch (err) {
      console.warn('Cache write error:', err);
    }
  }

  static async remove(prompt: string): Promise<void> {
    try {
      const cache = await AsyncStorage.getItem(this.CACHE_KEY) || '[]';
      let images: CachedImage[] = JSON.parse(cache);
      images = images.filter(img => img.prompt !== prompt);
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(images));
    } catch (err) {
      console.warn('Cache remove error:', err);
    }
  }
}

// Usage with caching
async function generateStickerWithCache(
  prompt: string,
  accessToken: string
): Promise<string> {
  // Check cache first
  const cached = await StickerCache.get(prompt);
  if (cached) {
    console.log('Using cached sticker');
    return `data:image/png;base64,${cached}`;
  }

  // Generate new image
  const result = await generateImage(prompt, accessToken);

  // Cache the result
  await StickerCache.set(prompt, result.base64);

  return `data:image/png;base64,${result.base64}`;
}
```

## Error Handling Flow

```typescript
async function robustGenerateSticker(
  prompt: string,
  accessToken: string,
  maxRetries = 3
): Promise<string> {
  let lastError: ImageGenerationError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generateImage(prompt, accessToken);
      return `data:image/png;base64,${result.base64}`;
    } catch (error) {
      if (!(error instanceof ImageGenerationError)) {
        throw error;
      }

      lastError = error;

      // Don't retry on these errors
      if ([
        'INVALID_PROMPT',
        'EMPTY_PROMPT',
        'PROMPT_TOO_LONG',
        'INVALID_PROMPT_CONTENT',
        'AUTH_FAILED',
      ].includes(error.code)) {
        throw error;
      }

      // Retry on transient errors
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to generate sticker');
}
```

## Environment Setup

The Gemini service requires OAuth tokens from Google Sign-In:

1. Ensure Google Sign-In is configured (already in your project)
2. User must be authenticated before using Gemini service
3. Access token is obtained from Google Sign-In session

## Security Considerations

1. **Token Scope**: Ensure Google Sign-In has appropriate scopes
2. **Token Refresh**: Check token expiration before using
3. **Error Messages**: Don't expose API errors to users directly
4. **Rate Limiting**: Implement backoff strategies
5. **Prompt Validation**: Always validate user input before sending to API

## Performance Tips

1. **Show Loading State**: 3-5 second generation time
2. **Cache Results**: Avoid regenerating same prompts
3. **Lazy Load**: Only import when needed
4. **Memory**: Base64 strings can be large; manage carefully
5. **Cleanup**: Remove old cached images periodically

## Testing

```typescript
import { checkGeminiHealth } from './services/gemini.service';
import { authService } from './services/auth.service';

async function testIntegration() {
  try {
    const tokens = await authService.getTokens();
    const isHealthy = await checkGeminiHealth(tokens.accessToken);
    
    if (isHealthy) {
      console.log('✅ Gemini service is ready');
    } else {
      console.warn('⚠️ Gemini service may be unavailable');
    }
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}
```

## Troubleshooting

### Issue: AUTH_FAILED error
**Solution**: Check if access token is valid and not expired. Re-authenticate user.

### Issue: NETWORK_ERROR
**Solution**: Check internet connection. Implement retry logic with exponential backoff.

### Issue: QUOTA_EXCEEDED
**Solution**: Implement rate limiting. Wait before retrying. Consider caching results.

### Issue: INVALID_PROMPT_CONTENT
**Solution**: Modify the prompt to remove sensitive content. Try simpler descriptions.

## Next Steps

1. Integrate into your main screen component
2. Add image preview functionality
3. Implement image saving/sharing features
4. Add user feedback UI (loading spinners, progress, etc.)
5. Implement analytics for usage tracking
6. Add rate limiting UI
7. Test on both iOS and Android devices
