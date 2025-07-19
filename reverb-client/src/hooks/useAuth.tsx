import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, ApiError, ApiService } from '@/services/api';
import { AuthService } from '@/services/authService';
import { AppRoutes } from '@/routes';
import { Tenant } from '@/schemas/auth';

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: UserData | null;
  tenants: Tenant[];
  currentTenant: Tenant | null;
}

interface UserData {
  id: number;
  email: string;
  name: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  username: string;
  first_name: string;
  last_name: string;
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  switchTenant: (tenant: Tenant) => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
  loginError: string | null;
  registerError: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isInitialized: false,
    user: null,
    tenants: [],
    currentTenant: null,
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[useAuth] Initializing auth state');
      
      // Ensure AuthService is initialized for all tabs (even non-authenticated ones)
      // This sets up the BroadcastChannel listeners
      await AuthService.ensureInitialized();
      
      try {
        const isAuthenticated = AuthService.isAuthenticated();
        console.log('[useAuth] Auth check result:', isAuthenticated);
        
        if (isAuthenticated) {
          const idToken = AuthService.getIdToken();
          if (idToken) {
            const decoded = AuthService.decodeToken(idToken);
            
            // Fetch tenants for already logged-in user
            try {
              const tenants = await authApi.getTenants();
              const savedTenantId = localStorage.getItem('selected_tenant_id');
              const currentTenant = tenants.find(t => t.id === Number(savedTenantId)) || tenants[0] || null;
              
              setAuthState({
                isAuthenticated: true,
                isInitialized: true,
                user: {
                  id: decoded.sub,
                  email: decoded.email || '',
                  name: decoded.name || `${decoded.first_name || ''} ${decoded.last_name || ''}`.trim(),
                  username: decoded.username || decoded.email?.split('@')[0] || decoded.name || '',
                  firstName: decoded.first_name || '',
                  lastName: decoded.last_name || '',
                },
                tenants,
                currentTenant,
              });
              
              if (currentTenant) {
                localStorage.setItem('selected_tenant_id', currentTenant.id.toString());
                localStorage.setItem('current_tenant_url_safe_name', currentTenant.urlSafeName);
                ApiService.setCurrentTenant(currentTenant.urlSafeName);
              }
            } catch (error) {
              console.error('Failed to fetch tenants during initialization:', error);
              setAuthState({
                isAuthenticated: true,
                isInitialized: true,
                user: {
                  id: decoded.sub,
                  email: decoded.email || '',
                  name: decoded.name || `${decoded.first_name || ''} ${decoded.last_name || ''}`.trim(),
                  username: decoded.username || decoded.email?.split('@')[0] || decoded.name || '',
                  firstName: decoded.first_name || '',
                  lastName: decoded.last_name || '',
                },
                tenants: [],
                currentTenant: null,
              });
            }
          } else {
            setAuthState({
              isAuthenticated: false,
              isInitialized: true,
              user: null,
              tenants: [],
              currentTenant: null,
            });
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            isInitialized: true,
            user: null,
            tenants: [],
            currentTenant: null,
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthState({
          isAuthenticated: false,
          isInitialized: true,
          user: null,
          tenants: [],
          currentTenant: null,
        });
      }
    };

    initializeAuth();

    // Listen for auth state changes from other tabs
    const handleAuthStateChange = (event: CustomEvent<{ isAuthenticated: boolean }>) => {
      console.log('[useAuth] Received auth state change event:', event.detail);
      if (event.detail.isAuthenticated && !authState.isAuthenticated) {
        console.log('[useAuth] Another tab logged in, reinitializing auth');
        initializeAuth();
      } else if (!event.detail.isAuthenticated && authState.isAuthenticated) {
        console.log('[useAuth] Another tab logged out, clearing auth state');
        setAuthState({
          isAuthenticated: false,
          isInitialized: true,
          user: null,
          tenants: [],
          currentTenant: null,
        });
      }
    };

    // Listen for logout required events (from token refresh failures or cross-tab logout)
    const handleLogoutRequired = () => {
      console.log('[useAuth] Logout required, navigating to login');
      setAuthState({
        isAuthenticated: false,
        isInitialized: true,
        user: null,
        tenants: [],
        currentTenant: null,
      });
      queryClient.clear();
      navigate(AppRoutes.LOGIN);
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    window.addEventListener('auth-logout-required', handleLogoutRequired);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
      window.removeEventListener('auth-logout-required', handleLogoutRequired);
    };
  }, [navigate, queryClient]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      console.log('[useAuth] Login successful, saving tokens');
      await AuthService.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id_token: data.id_token,
        expires_in: data.expires_in,
      });

      const decoded = AuthService.decodeToken(data.id_token);
      if (!decoded) {
        console.error('Failed to decode token');
        throw new Error('Invalid authentication token');
      }
      
      // Fetch user's tenants
      try {
        const tenants = await authApi.getTenants();
        
        // Get saved tenant preference or use first
        const savedTenantId = localStorage.getItem('selected_tenant_id');
        const currentTenant = tenants.find(t => t.id === Number(savedTenantId)) || tenants[0] || null;
        
        setAuthState({
          isAuthenticated: true,
          isInitialized: true,
          user: {
            id: decoded.sub,
            email: decoded.email || '',
            name: decoded.name || `${decoded.first_name || ''} ${decoded.last_name || ''}`.trim(),
            username: decoded.username || decoded.email?.split('@')[0] || decoded.name || '',
            firstName: decoded.first_name || '',
            lastName: decoded.last_name || '',
          },
          tenants,
          currentTenant,
        });
        
        if (currentTenant) {
          localStorage.setItem('selected_tenant_id', currentTenant.id.toString());
          localStorage.setItem('current_tenant_url_safe_name', currentTenant.urlSafeName);
          ApiService.setCurrentTenant(currentTenant.urlSafeName);
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        // Still log the user in but with no tenants
        setAuthState({
          isAuthenticated: true,
          isInitialized: true,
          user: {
            id: decoded.sub,
            email: decoded.email || '',
            name: decoded.name || `${decoded.first_name || ''} ${decoded.last_name || ''}`.trim(),
            username: decoded.username || decoded.email?.split('@')[0] || decoded.name || '',
            firstName: decoded.first_name || '',
            lastName: decoded.last_name || '',
          },
          tenants: [],
          currentTenant: null,
        });
      }

      setLoginError(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      console.log('[useAuth] Login complete, auth state updated');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.status === 422) {
          setLoginError('Invalid email or password. Please try again.');
        } else if (error.status === 0) {
          setLoginError('Unable to connect to server. Please check your connection.');
        } else {
          setLoginError(error.message || 'An error occurred during login.');
        }
      } else {
        setLoginError('An unexpected error occurred. Please try again.');
      }
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const user = await authApi.register(data);
      const tokens = await authApi.login({
        email: data.email,
        password: data.password,
      });
      return { user, tokens };
    },
    onSuccess: async ({ tokens }) => {
      await AuthService.saveTokens({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
        expires_in: tokens.expires_in,
      });

      const decoded = AuthService.decodeToken(tokens.id_token);
      if (!decoded) {
        console.error('Failed to decode token');
        throw new Error('Invalid authentication token');
      }
      
      // Fetch user's tenants
      try {
        const tenants = await authApi.getTenants();
        const currentTenant = tenants[0] || null;
        
        setAuthState({
          isAuthenticated: true,
          isInitialized: true,
          user: {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name || `${decoded.first_name || ''} ${decoded.last_name || ''}`.trim(),
            username: decoded.username || decoded.email.split('@')[0],
            firstName: decoded.first_name || '',
            lastName: decoded.last_name || '',
          },
          tenants,
          currentTenant,
        });
        
        if (currentTenant) {
          localStorage.setItem('selected_tenant_id', currentTenant.id.toString());
          localStorage.setItem('current_tenant_url_safe_name', currentTenant.urlSafeName);
          ApiService.setCurrentTenant(currentTenant.urlSafeName);
        }
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
        // Still log the user in but with no tenants
        setAuthState({
          isAuthenticated: true,
          isInitialized: true,
          user: {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name || `${decoded.first_name || ''} ${decoded.last_name || ''}`.trim(),
            username: decoded.username || decoded.email.split('@')[0],
            firstName: decoded.first_name || '',
            lastName: decoded.last_name || '',
          },
          tenants: [],
          currentTenant: null,
        });
      }

      setRegisterError(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setRegisterError('An account with this email or username already exists.');
        } else if (error.status === 422) {
          setRegisterError('Please check your information and try again.');
        } else if (error.status === 0) {
          setRegisterError('Unable to connect to server. Please check your connection.');
        } else {
          setRegisterError(error.message || 'An error occurred during registration.');
        }
      } else {
        setRegisterError('An unexpected error occurred. Please try again.');
      }
    },
  });

  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    setLoginError(null);
    await loginMutation.mutateAsync(credentials);
  }, [loginMutation]);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    setRegisterError(null);
    await registerMutation.mutateAsync(data);
  }, [registerMutation]);

  const logout = useCallback(async () => {
    console.log('[useAuth] Logging out');
    await AuthService.clearTokens();
    localStorage.removeItem('selected_tenant_id');
    localStorage.removeItem('current_tenant_url_safe_name');
    ApiService.setCurrentTenant(null);
    setAuthState({
      isAuthenticated: false,
      isInitialized: true,
      user: null,
      tenants: [],
      currentTenant: null,
    });
    queryClient.clear();
    navigate(AppRoutes.LOGIN);
    console.log('[useAuth] Logout complete');
  }, [navigate, queryClient]);

  const switchTenant = useCallback((tenant: Tenant) => {
    localStorage.setItem('selected_tenant_id', tenant.id.toString());
    localStorage.setItem('current_tenant_url_safe_name', tenant.urlSafeName);
    ApiService.setCurrentTenant(tenant.urlSafeName);
    setAuthState(prev => ({ ...prev, currentTenant: tenant }));
    // Clear cached data when switching tenants
    queryClient.clear();
  }, [queryClient]);


  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return AuthService.getAccessToken();
  }, []);

  const value: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    getAccessToken,
    switchTenant,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    loginError,
    registerError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}