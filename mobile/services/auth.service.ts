import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import {
  GOOGLE_WEB_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_ANDROID_CLIENT_ID,
} from '@env';

/**
 * Types and Interfaces
 */

export interface GoogleUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  givenName: string;
  familyName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string | null;
  idToken: string;
  expiresAt: number;
}

export interface AuthState {
  user: GoogleUser | null;
  tokens: AuthTokens | null;
  isSignedIn: boolean;
}

export class AuthenticationError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class TokenRefreshError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'TokenRefreshError';
  }
}

/**
 * Storage Keys
 */
const STORAGE_KEYS = {
  USER: '@auth_user',
  TOKENS: '@auth_tokens',
  SIGNED_IN: '@auth_signed_in',
} as const;

/**
 * OAuth Scopes
 */
const OAUTH_SCOPES = [
  'profile',
  'email',
  'https://www.googleapis.com/auth/generative-language.retriever',
] as const;

/**
 * Google OAuth Authentication Service
 *
 * Provides complete OAuth authentication flow with Google Sign-In, secure token storage,
 * and support for Gemini API access via generative language retriever scope.
 */
class AuthService {
  private isInitialized = false;
  private currentUser: GoogleUser | null = null;
  private currentTokens: AuthTokens | null = null;

  /**
   * Initialize Google Sign-In with proper configuration
   *
   * Must be called before any other authentication operations.
   * Automatically restores previous authentication state if available.
   */
  async initGoogleSignIn(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      const clientId = this.getClientIdForPlatform();

      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        iosClientId: GOOGLE_IOS_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        scopes: Array.from(OAUTH_SCOPES),
        offlineAccess: true,
        forceCodeForRefreshToken: true,
      });

      this.isInitialized = true;

      // Restore previous session if available
      await this.restoreSession();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new AuthenticationError(
        'INIT_FAILED',
        `Failed to initialize Google Sign-In: ${message}`,
        error
      );
    }
  }

  /**
   * Sign in user with Google OAuth
   *
   * Handles the complete sign-in flow including token acquisition and secure storage.
   *
   * @returns Promise resolving to the signed-in Google user
   * @throws AuthenticationError if sign-in fails
   */
  async signInWithGoogle(): Promise<GoogleUser> {
    try {
      if (!this.isInitialized) {
        await this.initGoogleSignIn();
      }

      const userInfo = await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // Parse and validate user data
      const googleUser: GoogleUser = {
        id: userInfo.user.id,
        name: userInfo.user.name || '',
        email: userInfo.user.email,
        photo: userInfo.user.photo,
        givenName: userInfo.user.givenName || '',
        familyName: userInfo.user.familyName || '',
      };

      // Calculate token expiration time
      const expiresAt = Date.now() + (tokens.accessTokenExpiresIn || 3600) * 1000;

      const authTokens: AuthTokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || null,
        idToken: userInfo.idToken || '',
        expiresAt,
      };

      // Store user and tokens
      this.currentUser = googleUser;
      this.currentTokens = authTokens;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(googleUser)),
        AsyncStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(authTokens)),
        AsyncStorage.setItem(STORAGE_KEYS.SIGNED_IN, 'true'),
      ]);

      return googleUser;
    } catch (error) {
      // Handle specific Google Sign-In error codes
      if (error instanceof Error) {
        const errorCode = (error as any).code || 'UNKNOWN';

        if (errorCode === statusCodes.SIGN_IN_CANCELLED) {
          throw new AuthenticationError(
            'SIGN_IN_CANCELLED',
            'Sign-in was cancelled by user',
            error
          );
        }

        if (errorCode === statusCodes.IN_PROGRESS) {
          throw new AuthenticationError(
            'SIGN_IN_IN_PROGRESS',
            'Sign-in operation is already in progress',
            error
          );
        }

        if (errorCode === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new AuthenticationError(
            'PLAY_SERVICES_NOT_AVAILABLE',
            'Google Play Services not available or outdated',
            error
          );
        }
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new AuthenticationError(
        'SIGN_IN_FAILED',
        `Failed to sign in with Google: ${message}`,
        error
      );
    }
  }

  /**
   * Sign out the current user and clear stored authentication data
   *
   * Properly clears tokens and user information from both Google Sign-In and local storage.
   *
   * @throws AuthenticationError if sign-out fails
   */
  async signOut(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initGoogleSignIn();
      }

      await GoogleSignin.signOut();

      // Clear stored data
      this.currentUser = null;
      this.currentTokens = null;

      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKENS),
        AsyncStorage.removeItem(STORAGE_KEYS.SIGNED_IN),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new AuthenticationError(
        'SIGN_OUT_FAILED',
        `Failed to sign out: ${message}`,
        error
      );
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   *
   * Automatically refreshes the token if it has expired or is about to expire.
   * Uses refresh token if available for seamless token renewal.
   *
   * @returns Promise resolving to the current valid access token
   * @throws TokenRefreshError if token refresh fails
   * @throws AuthenticationError if user is not signed in
   */
  async getAccessToken(): Promise<string> {
    try {
      if (!this.currentTokens) {
        const stored = await this.getStoredTokens();
        if (!stored) {
          throw new AuthenticationError(
            'NO_TOKENS',
            'No authentication tokens found. User must sign in first.'
          );
        }
        this.currentTokens = stored;
      }

      // Check if token needs refresh (if expiring within 5 minutes)
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
      if (Date.now() > this.currentTokens.expiresAt - refreshThreshold) {
        await this.refreshAccessToken();
      }

      if (!this.currentTokens) {
        throw new TokenRefreshError('Token refresh resulted in null tokens');
      }

      return this.currentTokens.accessToken;
    } catch (error) {
      if (
        error instanceof TokenRefreshError ||
        error instanceof AuthenticationError
      ) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new TokenRefreshError(`Failed to get access token: ${message}`, error);
    }
  }

  /**
   * Check if user is currently signed in
   *
   * Verifies both local state and Google Sign-In status.
   *
   * @returns Promise resolving to boolean indicating sign-in status
   */
  async isSignedIn(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initGoogleSignIn();
      }

      const hasValidTokens = this.currentTokens !== null;
      if (!hasValidTokens) {
        const stored = await this.getStoredSignedInStatus();
        if (!stored) {
          return false;
        }
      }

      const isGoogleSignedIn = await GoogleSignin.isSignedIn();
      return isGoogleSignedIn && hasValidTokens;
    } catch {
      return false;
    }
  }

  /**
   * Get the currently signed-in user
   *
   * Returns user information from memory cache or restored from storage.
   * Returns null if no user is signed in.
   *
   * @returns Promise resolving to the current GoogleUser or null
   */
  async getCurrentUser(): Promise<GoogleUser | null> {
    try {
      if (this.currentUser) {
        return this.currentUser;
      }

      const user = await this.getStoredUser();
      if (user) {
        this.currentUser = user;
      }

      return user;
    } catch {
      return null;
    }
  }

  /**
   * Get complete authentication state
   *
   * Useful for restoring application state or debugging.
   * Includes user info and current token details.
   *
   * @returns Promise resolving to the current AuthState
   */
  async getAuthState(): Promise<AuthState> {
    try {
      const user = await this.getCurrentUser();
      const tokens = this.currentTokens || (await this.getStoredTokens());
      const signedIn = await this.isSignedIn();

      return {
        user,
        tokens,
        isSignedIn: signedIn,
      };
    } catch {
      return {
        user: null,
        tokens: null,
        isSignedIn: false,
      };
    }
  }

  /**
   * Private helper methods
   */

  private getClientIdForPlatform(): string {
    if (Platform.OS === 'ios') {
      return GOOGLE_IOS_CLIENT_ID;
    } else if (Platform.OS === 'android') {
      return GOOGLE_ANDROID_CLIENT_ID;
    }
    return GOOGLE_WEB_CLIENT_ID;
  }

  private async restoreSession(): Promise<void> {
    try {
      const signedIn = await this.getStoredSignedInStatus();

      if (!signedIn) {
        return;
      }

      const [user, tokens] = await Promise.all([
        this.getStoredUser(),
        this.getStoredTokens(),
      ]);

      this.currentUser = user;
      this.currentTokens = tokens;

      // Verify with Google Sign-In that session is still valid
      if (tokens) {
        try {
          const isStillSignedIn = await GoogleSignin.isSignedIn();
          if (!isStillSignedIn) {
            // Clear stored data if not signed in with Google
            this.currentUser = null;
            this.currentTokens = null;
            await Promise.all([
              AsyncStorage.removeItem(STORAGE_KEYS.USER),
              AsyncStorage.removeItem(STORAGE_KEYS.TOKENS),
              AsyncStorage.removeItem(STORAGE_KEYS.SIGNED_IN),
            ]);
          }
        } catch {
          // If check fails, keep the session but it may need refresh
        }
      }
    } catch {
      // Silently fail restoration, user can sign in again if needed
    }
  }

  private async refreshAccessToken(): Promise<void> {
    try {
      if (!this.isInitialized) {
        await this.initGoogleSignIn();
      }

      const tokens = await GoogleSignin.getTokens();

      if (!tokens.accessToken) {
        throw new TokenRefreshError('Failed to retrieve new access token');
      }

      const expiresAt = Date.now() + (tokens.accessTokenExpiresIn || 3600) * 1000;

      this.currentTokens = {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken || this.currentTokens?.refreshToken || null,
        idToken: this.currentTokens?.idToken || '',
        expiresAt,
      };

      // Update stored tokens
      await AsyncStorage.setItem(
        STORAGE_KEYS.TOKENS,
        JSON.stringify(this.currentTokens)
      );
    } catch (error) {
      this.currentTokens = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKENS);

      const message = error instanceof Error ? error.message : String(error);
      throw new TokenRefreshError(
        `Failed to refresh access token: ${message}`,
        error
      );
    }
  }

  private async getStoredUser(): Promise<GoogleUser | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOKENS);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private async getStoredSignedInStatus(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SIGNED_IN);
      return stored === 'true';
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance of the authentication service
 */
const authService = new AuthService();

/**
 * Public API Exports
 */

/**
 * Initialize the Google Sign-In service
 *
 * @returns Promise that resolves when initialization is complete
 */
export async function initGoogleSignIn(): Promise<void> {
  return authService.initGoogleSignIn();
}

/**
 * Initiate sign-in with Google OAuth
 *
 * @returns Promise resolving to the signed-in user
 */
export async function signInWithGoogle(): Promise<GoogleUser> {
  return authService.signInWithGoogle();
}

/**
 * Sign out the current user
 *
 * @returns Promise that resolves when sign-out is complete
 */
export async function signOut(): Promise<void> {
  return authService.signOut();
}

/**
 * Get a valid access token for API calls
 *
 * Automatically handles token refresh if needed.
 *
 * @returns Promise resolving to the current access token
 */
export async function getAccessToken(): Promise<string> {
  return authService.getAccessToken();
}

/**
 * Check if user is signed in
 *
 * @returns Promise resolving to sign-in status
 */
export async function isSignedIn(): Promise<boolean> {
  return authService.isSignedIn();
}

/**
 * Get the current user
 *
 * @returns Promise resolving to the current user or null
 */
export async function getCurrentUser(): Promise<GoogleUser | null> {
  return authService.getCurrentUser();
}

/**
 * Get complete authentication state
 *
 * @returns Promise resolving to the current authentication state
 */
export async function getAuthState(): Promise<AuthState> {
  return authService.getAuthState();
}

export default authService;
