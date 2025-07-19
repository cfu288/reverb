import { AuthBroadcast, type StoredTokens } from "./authBroadcast";

export class AuthService {
  private static readonly TOKEN_KEY = "auth_tokens";
  private static refreshPromise: Promise<string | null> | null = null;
  private static broadcast: AuthBroadcast | null = null;
  private static initialized = false;

  /**
   * Initialize the auth service with broadcast support (called automatically)
   */
  static async ensureInitialized() {
    if (this.initialized) {
      console.log('[AuthService] Already initialized');
      return;
    }

    console.log('[AuthService] Initializing with broadcast support');
    this.initialized = true;
    this.broadcast = AuthBroadcast.getInstance();
    
    // Set up callbacks to avoid circular dependency
    this.broadcast.setAuthCallbacks({
      isAuthenticated: () => this.isAuthenticated(),
      getStoredTokens: () => this.getStoredTokens(),
      restoreTokens: (tokens) => this.restoreTokens(tokens),
      clearTokens: (isLocalLogout) => this.clearTokens(isLocalLogout),
    });
    
    await this.broadcast.initialize();
    console.log('[AuthService] Initialization complete');
  }

  /**
   * Save tokens to sessionStorage with calculated expiry time
   */
  static async saveTokens(tokens: {
    access_token: string;
    refresh_token: string;
    id_token: string;
    expires_in: number;
  }): Promise<void> {
    console.log('[AuthService] Saving tokens, expires_in:', tokens.expires_in);
    await this.ensureInitialized();

    const tokenData: StoredTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + tokens.expires_in * 1000 - 30000, // Subtract 30 seconds for safety with 15-minute tokens
    };

    sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
    console.log('[AuthService] Tokens saved to sessionStorage');

    // Notify other tabs about login
    console.log('[AuthService] Notifying other tabs about login');
    if (this.broadcast) {
      console.log('[AuthService] Broadcast is available, sending LOGIN_SUCCESS');
      this.broadcast.notifyLoginSuccess(tokenData);
      this.broadcast.notifyAuthStateChange(true);
    } else {
      console.error('[AuthService] Broadcast is null! Cannot notify other tabs');
    }
  }

  /**
   * Restore tokens from another tab (used by BroadcastChannel)
   */
  static restoreTokens(tokenData: StoredTokens): void {
    console.log('[AuthService] Restoring tokens from another tab');
    if (tokenData && tokenData.expiresAt > Date.now()) {
      sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
      console.log('[AuthService] Tokens restored successfully');
    } else {
      console.log('[AuthService] Tokens invalid or expired, not restoring');
    }
  }

  /**
   * Get tokens from sessionStorage
   */
  static getStoredTokens(): StoredTokens | null {
    const stored = sessionStorage.getItem(this.TOKEN_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }

  /**
   * Get access token, automatically refreshing if needed
   */
  static async getAccessToken(): Promise<string | null> {
    await this.ensureInitialized();

    const tokens = this.getStoredTokens();
    if (!tokens) return null;

    // Check if token is expired or about to expire
    if (Date.now() >= tokens.expiresAt) {
      console.log('[AuthService] Token expired, refreshing...');
      // Use existing refresh promise if one is in progress
      if (this.refreshPromise) {
        console.log('[AuthService] Using existing refresh promise');
        return this.refreshPromise;
      }

      // Start new refresh
      console.log('[AuthService] Starting new token refresh');
      this.refreshPromise = this.refreshAccessToken();
      try {
        const newToken = await this.refreshPromise;
        return newToken;
      } finally {
        this.refreshPromise = null;
      }
    }

    console.log('[AuthService] Returning existing token, expires in:', 
      Math.round((tokens.expiresAt - Date.now()) / 1000), 'seconds');
    return tokens.accessToken;
  }

  /**
   * Get refresh token
   */
  static getRefreshToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.refreshToken || null;
  }

  /**
   * Get ID token
   */
  static getIdToken(): string | null {
    const tokens = this.getStoredTokens();
    return tokens?.idToken || null;
  }

  /**
   * Refresh the access token using the refresh token
   */
  private static async refreshAccessToken(): Promise<string | null> {
    const tokens = this.getStoredTokens();
    if (!tokens?.refreshToken) {
      this.clearTokens();
      return null;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3333"
        }/user/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Include fingerprint cookie
          body: JSON.stringify({ refresh_token: tokens.refreshToken }),
        }
      );

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();

      // Update stored tokens with new access token
      const newTokenData: StoredTokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        idToken: data.id_token,
        expiresAt: Date.now() + data.expires_in * 1000 - 30000,
      };

      sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(newTokenData));

      // Notify other tabs about the refresh with full token data
      this.broadcast?.notifyTokenRefresh(newTokenData);

      return data.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await this.clearTokens();
      // Dispatch event for soft navigation instead of hard redirect
      window.dispatchEvent(new CustomEvent('auth-logout-required'));
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    const isAuth = !!(tokens?.accessToken && tokens?.refreshToken);
    return isAuth;
  }

  /**
   * Clear all tokens
   * @param isLocalLogout - true if this is initiated by the current tab, false if from another tab
   */
  static async clearTokens(isLocalLogout: boolean = true): Promise<void> {
    console.log('[AuthService] Clearing tokens, isLocalLogout:', isLocalLogout);
    sessionStorage.removeItem(this.TOKEN_KEY);
    
    // Only notify other tabs if this is a local logout (not triggered by another tab)
    if (isLocalLogout) {
      // Ensure broadcast is initialized
      await this.ensureInitialized();
      
      // Notify other tabs about logout
      console.log('[AuthService] Notifying other tabs about logout');
      if (this.broadcast) {
        this.broadcast.notifyLogout();
      } else {
        console.error('[AuthService] Broadcast is null during logout!');
      }
    }
  }

  /**
   * Decode JWT token payload
   */
  static decodeToken(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }
}
