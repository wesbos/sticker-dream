# Gemini Service - Quick Reference

## File Location
```
/home/user/sticker-dream-RN-/mobile/services/gemini.service.ts
```

## Import & Use

```typescript
// Option 1: Named imports
import { generateImage, ImageGenerationError } from './services/gemini.service';

// Option 2: Default import (Service object)
import GeminiService from './services/gemini.service';
```

## Quickstart

```typescript
try {
  // Generate image
  const result = await generateImage("A dancing robot", accessToken);
  
  // Convert to data URI for Image component
  const imageUri = `data:${result.mimeType};base64,${result.base64}`;
  
  // Use in React Native Image component
  <Image source={{ uri: imageUri }} style={{ width: 200, height: 200 }} />
} catch (error) {
  if (error instanceof ImageGenerationError) {
    Alert.alert(`Error: ${error.code}`, error.message);
  }
}
```

## Function Signatures

```typescript
// Generate image
generateImage(prompt: string, accessToken: string)
  -> Promise<ImageGenerationResponse>

// Get data URI (for <Image> component)
generateImageAsDataUri(prompt: string, accessToken: string)
  -> Promise<string>

// Save to file
generateImageToFile(prompt: string, accessToken: string, filePath: string)
  -> Promise<string>

// Check API health
checkGeminiHealth(accessToken: string)
  -> Promise<boolean>
```

## Key Configuration

- **Model**: imagen-4.0-generate-001
- **Format**: PNG (base64 encoded)
- **Aspect Ratio**: 9:16 (thermal printer optimized)
- **Output**: Single image per request
- **Auth**: OAuth access token

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| AUTH_FAILED | Token invalid | Re-authenticate user |
| QUOTA_EXCEEDED | Rate limited | Implement exponential backoff |
| NETWORK_ERROR | Connection issue | Check connectivity, retry |
| INVALID_PROMPT_CONTENT | Unsafe content | Ask user to modify prompt |
| PROMPT_TOO_LONG | Prompt >2000 chars | Truncate prompt |
| EMPTY_PROMPT | Empty string | Validate input |

## Integration with Google Sign-In

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { generateImage } from './services/gemini.service';

// Get access token from signed-in user
const tokens = await GoogleSignin.getTokens();
const result = await generateImage(userPrompt, tokens.accessToken);
```

## Usage in Component

```typescript
import React, { useState } from 'react';
import { View, Image, Button, Text } from 'react-native';
import { generateImageAsDataUri, ImageGenerationError } from './services/gemini.service';

export function StickerGenerator({ accessToken }) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (prompt: string) => {
    try {
      setLoading(true);
      setError(null);
      const uri = await generateImageAsDataUri(prompt, accessToken);
      setImageUri(uri);
    } catch (err) {
      if (err instanceof ImageGenerationError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button 
        title="Generate Sticker" 
        onPress={() => handleGenerate("A cute penguin")}
        disabled={loading}
      />
      {loading && <Text>Generating...</Text>}
      {imageUri && (
        <Image 
          source={{ uri: imageUri }} 
          style={{ width: 300, height: 400 }} 
        />
      )}
      {error && <Text style={{ color: 'red' }}>{error}</Text>}
    </View>
  );
}
```

## Prompt Tips

Good prompts:
- "A cute robot playing soccer"
- "A dragon guarding treasure"
- "A butterfly on a flower"
- "A happy whale swimming"

Avoid:
- Extremely long descriptions (>500 chars)
- Violent or inappropriate content
- Highly detailed realistic imagery
- Text overlays or captions

## Performance Tips

1. **Show progress feedback** - Generation takes 3-5 seconds
2. **Cache generated images** - Don't regenerate the same prompt
3. **Handle network errors** - Implement retry logic
4. **Refresh tokens** - Check token expiration before API calls
5. **Use data URIs** - Cache base64 strings for offline viewing

## Testing

```typescript
// Health check before using
const isHealthy = await checkGeminiHealth(userAccessToken);
if (!isHealthy) {
  console.warn('Gemini API may be unavailable');
}
```

## Production Checklist

- [ ] OAuth token properly obtained from Google Sign-In
- [ ] Error handling implemented for all error codes
- [ ] Loading state shown during generation
- [ ] Network error retry logic implemented
- [ ] Token refresh logic in place
- [ ] Image caching implemented
- [ ] User feedback for failed generations
- [ ] Tested on both iOS and Android
- [ ] Memory management for large base64 strings
- [ ] Rate limiting handled
