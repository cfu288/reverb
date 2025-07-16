import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, ApiError } from '@/services/api';
import { AuthService } from '@/services/authService';
import { AppRoutes } from '@/routes';

interface AuthState {
  isAuthenticated: boolean;
  isInitialized: boolean;
  user: UserData | null;
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
  logout: () => void;
  getAccessToken: () => Promise<string | null>;
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
  });
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Initialize auth state from stored tokens
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const isAuthenticated = AuthService.isAuthenticated();
        
        if (isAuthenticated) {
          const idToken = AuthService.getIdToken();
          if (idToken) {
            const decoded = AuthService.decodeToken(idToken);
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
            });
          } else {
            setAuthState({
              isAuthenticated: false,
              isInitialized: true,
              user: null,
            });
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            isInitialized: true,
            user: null,
          });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthState({
          isAuthenticated: false,
          isInitialized: true,
          user: null,
        });
      }
    };

    initializeAuth();

    // Listen for auth state changes from other tabs
    const handleAuthStateChange = (event: CustomEvent<{ isAuthenticated: boolean }>) => {
      if (event.detail.isAuthenticated && !authState.isAuthenticated) {
        initializeAuth();
      } else if (!event.detail.isAuthenticated && authState.isAuthenticated) {
        setAuthState({
          isAuthenticated: false,
          isInitialized: true,
          user: null,
        });
      }
    };

    window.addEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChange as EventListener);
    };
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      await AuthService.saveTokens({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        id_token: data.id_token,
        expires_in: data.expires_in,
      });

      const decoded = AuthService.decodeToken(data.id_token);
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
      });

      setLoginError(null);
      queryClient.invalidateQueries({ queryKey: ['user'] });
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
      });

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

  const logout = useCallback(() => {
    AuthService.clearTokens();
    setAuthState({
      isAuthenticated: false,
      isInitialized: true,
      user: null,
    });
    queryClient.clear();
    navigate(AppRoutes.LOGIN);
  }, [navigate, queryClient]);


  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return AuthService.getAccessToken();
  }, []);

  const value: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    getAccessToken,
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