import { AuthBroadcast } from "./authBroadcast";

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number; // Timestamp when access token expires
}

export class AuthService {
  private static readonly TOKEN_KEY = "auth_tokens";
  private static refreshPromise: Promise<string | null> | null = null;
  private static broadcast: any = null;
  private static initialized = false;

  /**
   * Initialize the auth service with broadcast support (called automatically)
   */
  private static async ensureInitialized() {
    if (this.initialized) return;

    this.initialized = true;
    this.broadcast = AuthBroadcast.getInstance();
    await this.broadcast.initialize();
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
    await this.ensureInitialized();

    const tokenData: StoredTokens = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      idToken: tokens.id_token,
      expiresAt: Date.now() + tokens.expires_in * 1000 - 30000, // Subtract 30 seconds for safety with 15-minute tokens
    };

    sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));

    // Notify other tabs
    this.broadcast?.notifyAuthStateChange(true);
  }

  /**
   * Restore tokens from another tab (used by BroadcastChannel)
   */
  static restoreTokens(tokenData: StoredTokens): void {
    if (tokenData && tokenData.expiresAt > Date.now()) {
      sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokenData));
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
      // Use existing refresh promise if one is in progress
      if (this.refreshPromise) {
        return this.refreshPromise;
      }

      // Start new refresh
      this.refreshPromise = this.refreshAccessToken();
      try {
        const newToken = await this.refreshPromise;
        return newToken;
      } finally {
        this.refreshPromise = null;
      }
    }

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

      // Notify other tabs about the refresh
      this.broadcast?.notifyTokenRefresh(newTokenData.expiresAt);

      return data.access_token;
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearTokens();
      // Redirect to login
      window.location.href = "/login";
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens?.accessToken && tokens?.refreshToken);
  }

  /**
   * Clear all tokens
   */
  static clearTokens(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    // Notify other tabs about logout
    this.broadcast?.notifyLogout();
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
