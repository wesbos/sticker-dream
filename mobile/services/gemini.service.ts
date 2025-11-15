import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Image generation response type
 */
export interface ImageGenerationResponse {
  base64: string;
  mimeType: string;
}

/**
 * Error types for image generation
 */
export class ImageGenerationError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ImageGenerationError';
  }
}

/**
 * Configuration for the Gemini service
 */
interface GeminiServiceConfig {
  accessToken?: string;
  apiKey?: string;
}

/**
 * Validates the provided prompt
 */
function validatePrompt(prompt: string): void {
  if (!prompt || typeof prompt !== 'string') {
    throw new ImageGenerationError(
      'INVALID_PROMPT',
      'Prompt must be a non-empty string'
    );
  }

  if (prompt.trim().length === 0) {
    throw new ImageGenerationError(
      'EMPTY_PROMPT',
      'Prompt cannot be empty or only whitespace'
    );
  }

  if (prompt.length > 2000) {
    throw new ImageGenerationError(
      'PROMPT_TOO_LONG',
      'Prompt cannot exceed 2000 characters'
    );
  }
}

/**
 * Validates the provided access token or API key
 */
function validateAuth(accessToken?: string, apiKey?: string): void {
  if (!accessToken && !apiKey) {
    throw new ImageGenerationError(
      'NO_AUTH',
      'Either accessToken or apiKey must be provided'
    );
  }

  if (accessToken && typeof accessToken !== 'string') {
    throw new ImageGenerationError(
      'INVALID_TOKEN',
      'Access token must be a string'
    );
  }

  if (apiKey && typeof apiKey !== 'string') {
    throw new ImageGenerationError(
      'INVALID_API_KEY',
      'API key must be a string'
    );
  }
}

/**
 * Creates the exact prompt template used in the original web app
 */
function createPromptTemplate(userPrompt: string): string {
  return `A black and white kids coloring page.
<image-description>
${userPrompt}
</image-description>
${userPrompt}`;
}

/**
 * Generates an image using Google's Imagen model
 * Supports OAuth authentication with access tokens
 *
 * @param prompt - The description of the image to generate
 * @param accessToken - Google OAuth access token for authentication
 * @returns Promise containing base64 encoded image data and MIME type
 * @throws ImageGenerationError if generation fails
 */
export async function generateImage(
  prompt: string,
  accessToken: string
): Promise<ImageGenerationResponse> {
  try {
    // Validate inputs
    validatePrompt(prompt);
    validateAuth(accessToken);

    // Initialize Google Generative AI with the access token
    // The access token is used to authenticate the request
    const genAI = new GoogleGenerativeAI(accessToken);

    // Get the Imagen model
    const model = genAI.getGenerativeModel({
      model: 'imagen-4.0-generate-001',
    });

    // Create the prompt using the exact template from the original web app
    const fullPrompt = createPromptTemplate(prompt);

    console.log('🎨 Generating image with Imagen 4.0...');
    console.time('image_generation');

    // Generate the image
    const result = await model.generateImages({
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '9:16',
      },
    });

    console.timeEnd('image_generation');

    // Validate the response
    if (!result || !result.images || result.images.length === 0) {
      throw new ImageGenerationError(
        'NO_IMAGES_GENERATED',
        'Imagen API returned no images'
      );
    }

    const image = result.images[0];

    // Extract base64 image data
    if (!image || typeof image !== 'string') {
      throw new ImageGenerationError(
        'INVALID_IMAGE_FORMAT',
        'Invalid image format returned from API'
      );
    }

    console.log('✅ Image generated successfully');

    return {
      base64: image,
      mimeType: 'image/png',
    };
  } catch (error) {
    // Re-throw ImageGenerationError as-is
    if (error instanceof ImageGenerationError) {
      throw error;
    }

    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        throw new ImageGenerationError(
          'AUTH_FAILED',
          'Authentication failed. Please check your access token.',
          error
        );
      }

      if (errorMessage.includes('invalid') && errorMessage.includes('prompt')) {
        throw new ImageGenerationError(
          'INVALID_PROMPT_CONTENT',
          'The prompt contains content that cannot be processed.',
          error
        );
      }

      if (errorMessage.includes('quota') || errorMessage.includes('rate')) {
        throw new ImageGenerationError(
          'QUOTA_EXCEEDED',
          'API quota exceeded. Please try again later.',
          error
        );
      }

      if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        throw new ImageGenerationError(
          'NETWORK_ERROR',
          'Network error occurred. Please check your connection.',
          error
        );
      }

      throw new ImageGenerationError(
        'GENERATION_FAILED',
        `Image generation failed: ${error.message}`,
        error
      );
    }

    // Handle unknown error types
    throw new ImageGenerationError(
      'UNKNOWN_ERROR',
      'An unknown error occurred during image generation',
      error
    );
  }
}

/**
 * Generates an image and returns it as a base64 data URI
 * Useful for directly setting as an Image source in React Native
 *
 * @param prompt - The description of the image to generate
 * @param accessToken - Google OAuth access token for authentication
 * @returns Promise containing base64 data URI string
 * @throws ImageGenerationError if generation fails
 */
export async function generateImageAsDataUri(
  prompt: string,
  accessToken: string
): Promise<string> {
  const result = await generateImage(prompt, accessToken);
  return `data:${result.mimeType};base64,${result.base64}`;
}

/**
 * Generates an image and saves it to a file path
 * Useful for saving generated images to the device's file system
 *
 * @param prompt - The description of the image to generate
 * @param accessToken - Google OAuth access token for authentication
 * @param filePath - The file path where the image should be saved
 * @returns Promise containing the file path
 * @throws ImageGenerationError if generation fails or file operation fails
 */
export async function generateImageToFile(
  prompt: string,
  accessToken: string,
  filePath: string
): Promise<string> {
  try {
    // Import FileSystem from Expo (lazy load to handle environments without it)
    const { writeAsStringAsync } = await import('expo-file-system');

    const result = await generateImage(prompt, accessToken);

    // Write the base64 image data to file
    await writeAsStringAsync(filePath, result.base64, {
      encoding: 'base64',
    });

    console.log(`📁 Image saved to ${filePath}`);
    return filePath;
  } catch (error) {
    if (error instanceof ImageGenerationError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ImageGenerationError(
        'FILE_WRITE_FAILED',
        `Failed to save image to file: ${error.message}`,
        error
      );
    }

    throw new ImageGenerationError(
      'FILE_WRITE_ERROR',
      'Failed to save image to file due to an unknown error',
      error
    );
  }
}

/**
 * Health check function to verify API connectivity
 *
 * @param accessToken - Google OAuth access token for authentication
 * @returns Promise<boolean> - true if API is accessible, false otherwise
 */
export async function checkGeminiHealth(accessToken: string): Promise<boolean> {
  try {
    validateAuth(accessToken);

    // Attempt to initialize the API
    const genAI = new GoogleGenerativeAI(accessToken);
    const model = genAI.getGenerativeModel({
      model: 'imagen-4.0-generate-001',
    });

    // If we can get the model without errors, API is accessible
    return !!model;
  } catch (error) {
    console.warn('⚠️ Gemini health check failed:', error);
    return false;
  }
}

/**
 * Service object for type-safe Gemini operations
 */
export const GeminiService = {
  generateImage,
  generateImageAsDataUri,
  generateImageToFile,
  checkGeminiHealth,
  ImageGenerationError,
};

export default GeminiService;
