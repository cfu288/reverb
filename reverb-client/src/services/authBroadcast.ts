import { AuthService } from './authService';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

type AuthMessage = 
  | { type: 'TOKEN_REFRESH_SUCCESS'; expiresAt: number }
  | { type: 'LOGOUT' }
  | { type: 'NEW_TAB_OPENED'; tabId: string }
  | { type: 'SHARE_TOKENS_REQUEST'; tabId: string }
  | { type: 'SHARE_TOKENS_RESPONSE'; tabId: string; tokens: EncryptedTokens }
  | { type: 'AUTH_STATE_CHANGED'; isAuthenticated: boolean };

interface EncryptedTokens {
  data: string;
  timestamp: number;
}

export class AuthBroadcast {
  private static instance: AuthBroadcast;
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private initPromise: Promise<void> | null = null;
  private useBroadcastChannel: boolean = false;

  private constructor() {
    this.tabId = this.generateTabId();
    
    // Check if BroadcastChannel is supported
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('reverb_auth_sync');
        this.useBroadcastChannel = true;
      } catch (e) {
        console.warn('BroadcastChannel not available, falling back to localStorage');
      }
    }
    
    this.setupListeners();
  }

  static getInstance(): AuthBroadcast {
    if (!this.instance) {
      this.instance = new AuthBroadcast();
    }
    return this.instance;
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
        await this.handleMessage(event.data);
      };
    } else {
      // Use localStorage events as fallback
      window.addEventListener('storage', (event) => {
        if (event.key === 'reverb_auth_message' && event.newValue) {
          try {
            const message = JSON.parse(event.newValue) as AuthMessage;
            this.handleMessage(message);
          } catch (e) {
            console.error('Failed to parse auth message from localStorage', e);
          }
        }
      });
    }
  }

  private async handleMessage(data: AuthMessage) {
    // Ignore our own messages
    if (data.type === 'NEW_TAB_OPENED' && data.tabId === this.tabId) {
      return;
    }

    switch (data.type) {
        case 'NEW_TAB_OPENED':
          // A new tab opened - if we have tokens, offer to share
          if (AuthService.isAuthenticated()) {
            const tokens = AuthService.getStoredTokens();
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
          }
          break;

        case 'SHARE_TOKENS_RESPONSE':
          // Another tab is sharing tokens with us
          if (data.tabId === this.tabId && !AuthService.isAuthenticated()) {
            const tokens = this.deserializeTokens(data.tokens.data);
            if (tokens && data.tokens.timestamp > Date.now() - 5000) { // 5 second window
              // Restore tokens in this tab
              AuthService.restoreTokens(tokens);
              // Notify UI to update
              window.dispatchEvent(new CustomEvent('auth-state-changed', { 
                detail: { isAuthenticated: true } 
              }));
            }
          }
          break;

        case 'TOKEN_REFRESH_SUCCESS':
          // Another tab refreshed tokens - we should refresh too
          if (AuthService.isAuthenticated()) {
            const currentTokens = AuthService.getStoredTokens();
            if (currentTokens && currentTokens.expiresAt < data.expiresAt) {
              // Our tokens are older, trigger a refresh
              AuthService.getAccessToken(); // This will auto-refresh
            }
          }
          break;

        case 'LOGOUT':
          // Another tab logged out - we should too
          AuthService.clearTokens();
          window.location.href = '/login';
          break;

        case 'AUTH_STATE_CHANGED':
          // Notify UI components about auth state change
          window.dispatchEvent(new CustomEvent('auth-state-changed', { 
            detail: { isAuthenticated: data.isAuthenticated } 
          }));
          break;
      }
  }

  private postMessage(message: AuthMessage) {
    if (this.useBroadcastChannel && this.channel) {
      this.channel.postMessage(message);
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
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      // Announce ourselves to other tabs
      this.postMessage({ 
        type: 'NEW_TAB_OPENED', 
        tabId: this.tabId 
      });

      // Wait a bit for responses
      setTimeout(() => {
        resolve();
      }, 100);
    });

    return this.initPromise;
  }

  notifyTokenRefresh(expiresAt: number) {
    this.postMessage({ 
      type: 'TOKEN_REFRESH_SUCCESS', 
      expiresAt 
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

  cleanup() {
    if (this.channel) {
      this.channel.close();
    }
  }
}