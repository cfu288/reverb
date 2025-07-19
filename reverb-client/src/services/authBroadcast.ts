
export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

type AuthMessage = 
  | { type: 'TOKEN_REFRESH_SUCCESS'; expiresAt: number; tokens: EncryptedTokens }
  | { type: 'LOGOUT' }
  | { type: 'NEW_TAB_OPENED'; tabId: string }
  | { type: 'SHARE_TOKENS_REQUEST'; tabId: string }
  | { type: 'SHARE_TOKENS_RESPONSE'; tabId: string; tokens: EncryptedTokens }
  | { type: 'AUTH_STATE_CHANGED'; isAuthenticated: boolean }
  | { type: 'LOGIN_SUCCESS'; tokens: EncryptedTokens };

interface EncryptedTokens {
  data: string;
  timestamp: number;
}

interface AuthCallbacks {
  isAuthenticated: () => boolean;
  getStoredTokens: () => StoredTokens | null;
  restoreTokens: (tokens: StoredTokens) => void;
  clearTokens: (isLocalLogout: boolean) => void | Promise<void>;
}

export class AuthBroadcast {
  private static instance: AuthBroadcast;
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private initPromise: Promise<void> | null = null;
  private useBroadcastChannel: boolean = false;
  private authCallbacks: AuthCallbacks | null = null;

  private constructor() {
    this.tabId = this.generateTabId();
    console.log('[AuthBroadcast] Initializing with tabId:', this.tabId);
    
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('reverb_auth_sync');
        this.useBroadcastChannel = true;
        console.log('[AuthBroadcast] Using BroadcastChannel for cross-tab sync');
      } catch (e) {
        console.warn('[AuthBroadcast] BroadcastChannel not available, falling back to localStorage', e);
      }
    } else {
      console.log('[AuthBroadcast] BroadcastChannel not supported, using localStorage fallback');
    }
    
    this.setupListeners();
  }

  static getInstance(): AuthBroadcast {
    if (!this.instance) {
      this.instance = new AuthBroadcast();
    }
    return this.instance;
  }

  setAuthCallbacks(callbacks: AuthCallbacks) {
    this.authCallbacks = callbacks;
    console.log('[AuthBroadcast] Auth callbacks set');
  }

  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private serializeTokens(tokens: StoredTokens): string {
    // For cross-tab communication, we rely on the secure nature of BroadcastChannel
    // which only allows same-origin communication
    return JSON.stringify(tokens);
  }

  private deserializeTokens(data: string): StoredTokens | null {
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private setupListeners() {
    if (this.useBroadcastChannel && this.channel) {
      this.channel.onmessage = async (event: MessageEvent<AuthMessage>) => {
        console.log('[AuthBroadcast] Received message via BroadcastChannel:', event.data.type, event.data);
        await this.handleMessage(event.data);
      };
      console.log('[AuthBroadcast] BroadcastChannel listener setup complete');
    } else {
      // Use localStorage events as fallback
      window.addEventListener('storage', (event) => {
        if (event.key === 'reverb_auth_message' && event.newValue) {
          try {
            const message = JSON.parse(event.newValue) as AuthMessage;
            console.log('[AuthBroadcast] Received message via localStorage:', message.type, message);
            this.handleMessage(message);
          } catch (e) {
            console.error('[AuthBroadcast] Failed to parse auth message from localStorage', e);
          }
        }
      });
      console.log('[AuthBroadcast] localStorage listener setup complete');
    }
  }

  private async handleMessage(data: AuthMessage) {
    // Ignore our own messages
    if (data.type === 'NEW_TAB_OPENED' && data.tabId === this.tabId) {
      console.log('[AuthBroadcast] Ignoring own NEW_TAB_OPENED message');
      return;
    }

    console.log('[AuthBroadcast] Handling message:', data.type, 'in tab:', this.tabId);

    switch (data.type) {
        case 'NEW_TAB_OPENED':
          // A new tab opened - if we have tokens, offer to share
          console.log('[AuthBroadcast] New tab opened:', data.tabId);
          if (this.authCallbacks?.isAuthenticated()) {
            const tokens = this.authCallbacks.getStoredTokens();
            console.log('[AuthBroadcast] We are authenticated, sharing tokens with new tab');
            if (tokens) {
              const serialized = this.serializeTokens(tokens);
              this.postMessage({
                type: 'SHARE_TOKENS_RESPONSE',
                tabId: data.tabId,
                tokens: {
                  data: serialized,
                  timestamp: Date.now()
                }
              });
            }
          } else {
            console.log('[AuthBroadcast] We are not authenticated, not sharing tokens');
          }
          break;

        case 'SHARE_TOKENS_RESPONSE':
          // Another tab is sharing tokens with us
          console.log('[AuthBroadcast] Received token share response for tab:', data.tabId, 'our tab:', this.tabId);
          if (data.tabId === this.tabId && !this.authCallbacks?.isAuthenticated()) {
            console.log('[AuthBroadcast] Token share is for us and we are not authenticated');
            const tokens = this.deserializeTokens(data.tokens.data);
            if (tokens && data.tokens.timestamp > Date.now() - 5000) { // 5 second window
              console.log('[AuthBroadcast] Restoring tokens from other tab');
              // Restore tokens in this tab
              this.authCallbacks?.restoreTokens(tokens);
              // Notify UI to update
              window.dispatchEvent(new CustomEvent('auth-state-changed', { 
                detail: { isAuthenticated: true } 
              }));
            } else {
              console.log('[AuthBroadcast] Token share expired or invalid');
            }
          } else {
            console.log('[AuthBroadcast] Ignoring token share (not for us or already authenticated)');
          }
          break;

        case 'TOKEN_REFRESH_SUCCESS':
          // Another tab refreshed tokens - use the same tokens
          console.log('[AuthBroadcast] Another tab refreshed tokens, syncing');
          if (this.authCallbacks?.isAuthenticated()) {
            const tokens = this.deserializeTokens(data.tokens.data);
            if (tokens && data.tokens.timestamp > Date.now() - 5000) { // 5 second window
              console.log('[AuthBroadcast] Syncing refreshed tokens from other tab');
              this.authCallbacks.restoreTokens(tokens);
            }
          }
          break;

        case 'LOGOUT':
          // Another tab logged out - we should too
          console.log('[AuthBroadcast] Another tab logged out, logging out this tab');
          // Pass false to indicate this is not a local logout (prevents re-broadcast)
          this.authCallbacks?.clearTokens(false);
          // Dispatch event for soft navigation instead of hard redirect
          window.dispatchEvent(new CustomEvent('auth-logout-required'));
          break;

        case 'AUTH_STATE_CHANGED':
          // Notify UI components about auth state change
          window.dispatchEvent(new CustomEvent('auth-state-changed', { 
            detail: { isAuthenticated: data.isAuthenticated } 
          }));
          break;

        case 'LOGIN_SUCCESS':
          // Another tab logged in - sync tokens to this tab
          console.log('[AuthBroadcast] Another tab logged in, checking if we need to sync');
          if (!this.authCallbacks?.isAuthenticated()) {
            console.log('[AuthBroadcast] We are not authenticated, syncing tokens');
            const tokens = this.deserializeTokens(data.tokens.data);
            if (tokens && data.tokens.timestamp > Date.now() - 5000) { // 5 second window
              console.log('[AuthBroadcast] Tokens are valid, restoring in this tab');
              // Restore tokens in this tab
              this.authCallbacks?.restoreTokens(tokens);
              // Notify UI to update
              window.dispatchEvent(new CustomEvent('auth-state-changed', { 
                detail: { isAuthenticated: true } 
              }));
              console.log('[AuthBroadcast] Auth state change event dispatched');
            } else {
              console.log('[AuthBroadcast] Login tokens expired or invalid');
            }
          } else {
            console.log('[AuthBroadcast] Already authenticated, ignoring login sync');
          }
          break;
      }
  }

  private postMessage(message: AuthMessage) {
    console.log('[AuthBroadcast] Posting message:', message.type, 'from tab:', this.tabId);
    if (this.useBroadcastChannel && this.channel) {
      this.channel.postMessage(message);
      console.log('[AuthBroadcast] Message posted via BroadcastChannel');
    } else {
      // Use localStorage for browsers without BroadcastChannel
      try {
        localStorage.setItem('reverb_auth_message', JSON.stringify(message));
        // Clear the message after a short delay to prevent memory buildup
        setTimeout(() => {
          localStorage.removeItem('reverb_auth_message');
        }, 100);
      } catch (e) {
        console.error('Failed to post auth message to localStorage', e);
      }
    }
  }

  async initialize(): Promise<void> {
    if (this.initPromise) {
      console.log('[AuthBroadcast] Already initialized, returning existing promise');
      return this.initPromise;
    }

    console.log('[AuthBroadcast] Starting initialization');
    this.initPromise = new Promise((resolve) => {
      // Announce ourselves to other tabs
      console.log('[AuthBroadcast] Announcing new tab to others');
      this.postMessage({ 
        type: 'NEW_TAB_OPENED', 
        tabId: this.tabId 
      });

      // Wait a bit for responses
      setTimeout(() => {
        console.log('[AuthBroadcast] Initialization complete');
        resolve();
      }, 100);
    });

    return this.initPromise;
  }

  notifyTokenRefresh(tokens: StoredTokens) {
    console.log('[AuthBroadcast] Notifying token refresh to other tabs');
    const serialized = this.serializeTokens(tokens);
    this.postMessage({ 
      type: 'TOKEN_REFRESH_SUCCESS', 
      expiresAt: tokens.expiresAt,
      tokens: {
        data: serialized,
        timestamp: Date.now()
      }
    });
  }

  notifyLogout() {
    this.postMessage({ type: 'LOGOUT' });
  }

  notifyAuthStateChange(isAuthenticated: boolean) {
    this.postMessage({ 
      type: 'AUTH_STATE_CHANGED', 
      isAuthenticated 
    });
  }

  notifyLoginSuccess(tokens: StoredTokens) {
    console.log('[AuthBroadcast] Notifying login success to other tabs');
    const serialized = this.serializeTokens(tokens);
    this.postMessage({
      type: 'LOGIN_SUCCESS',
      tokens: {
        data: serialized,
        timestamp: Date.now()
      }
    });
  }

  cleanup() {
    if (this.channel) {
      this.channel.close();
    }
  }
}