import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transmit } from '@adonisjs/transmit-client';
import { useAuth } from '@/hooks/useAuth';

interface TransmitContextValue {
  transmit: Transmit | null;
  connectionState: 'disconnected' | 'connected' | 'reconnecting' | 'failed';
}

const TransmitContext = createContext<TransmitContextValue | null>(null);

interface TransmitProviderProps {
  children: React.ReactNode;
}

export function TransmitProvider({ children }: TransmitProviderProps) {
  const { getAccessToken, isAuthenticated } = useAuth();
  const [transmit, setTransmit] = useState<Transmit | null>(null);
  const [connectionState, setConnectionState] = useState<TransmitContextValue['connectionState']>('disconnected');

  useEffect(() => {
    // Clean up previous instance when auth state changes
    if (!isAuthenticated) {
      setTransmit(null);
      setConnectionState('disconnected');
      return;
    }

    // Create new Transmit instance when user is authenticated
    console.log('[TransmitProvider] Creating new Transmit instance');
    const transmitInstance = new Transmit({
      baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3333',
      maxReconnectAttempts: 5,
      // Always fetch fresh token for each subscription
      beforeSubscribe: async (request: RequestInit) => {
        try {
          console.log('[TransmitProvider] Getting access token for subscription');
          const token = await getAccessToken();
          if (token) {
            console.log('[TransmitProvider] Access token obtained, length:', token.length);
            // Create new headers object since Request headers might be read-only
            const headers = new Headers(request.headers as HeadersInit);
            headers.set('Authorization', `Bearer ${token}`);
            return { ...request, headers };
          } else {
            console.error('[TransmitProvider] No access token available for subscription');
          }
        } catch (error) {
          console.error('[TransmitProvider] Failed to get access token for subscription:', error);
        }
        return request;
      },
      beforeUnsubscribe: async (request: RequestInit) => {
        try {
          const token = await getAccessToken();
          if (token) {
            // Create new headers object since Request headers might be read-only
            const headers = new Headers(request.headers as HeadersInit);
            headers.set('Authorization', `Bearer ${token}`);
            return { ...request, headers };
          }
        } catch (error) {
          console.error('Failed to get access token for unsubscription:', error);
        }
        return request;
      },
      onReconnectAttempt: (attempt: number) => {
        console.log(`WebSocket reconnection attempt ${attempt}`);
        setConnectionState('reconnecting');
      },
      onReconnectFailed: () => {
        console.error('WebSocket failed to reconnect after maximum attempts');
        setConnectionState('failed');
      },
      onSubscribeFailed: (error: any) => {
        console.error('[TransmitProvider] Failed to subscribe:', error);
        if (error.response) {
          console.error('[TransmitProvider] Response status:', error.response.status);
          console.error('[TransmitProvider] Response data:', error.response.data);
        }
      },
      onSubscription: (response: any) => {
        console.log('[TransmitProvider] onSubscription called with:', response);
        if (typeof response === 'string') {
          console.log(`Successfully subscribed to channel: ${response}`);
        }
        setConnectionState('connected');
      },
    });

    setTransmit(transmitInstance);
    // Initially we're ready but not connected until a subscription is made
    setConnectionState('disconnected');

    // Cleanup on unmount or auth change
    return () => {
      setTransmit(null);
    };
  }, [isAuthenticated, getAccessToken]);

  const value: TransmitContextValue = {
    transmit,
    connectionState,
  };

  return (
    <TransmitContext.Provider value={value}>
      {children}
    </TransmitContext.Provider>
  );
}

export function useTransmit() {
  const context = useContext(TransmitContext);
  if (!context) {
    throw new Error('useTransmit must be used within TransmitProvider');
  }
  return context.transmit;
}

export function useTransmitConnection() {
  const context = useContext(TransmitContext);
  if (!context) {
    throw new Error('useTransmitConnection must be used within TransmitProvider');
  }
  return context;
}

// Hook for subscribing to a Transmit stream
export function useTransmitStream<T = unknown>(streamName: string) {
  const transmit = useTransmit();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Handle case where transmit is not available (user not authenticated)
    if (!transmit) {
      setIsSubscribed(false);
      setError(null);
      setData(null);
      return;
    }

    let isMounted = true;
    console.log(`[useTransmitStream] Getting subscription object for: ${streamName}`);
    const subscription = transmit.subscription(streamName);
    console.log(`[useTransmitStream] Subscription object:`, subscription);
    
    // Debug: Track subscription timing
    const subscriptionStartTime = Date.now();
    
    const subscribe = async () => {
      try {
        console.log(`[useTransmitStream] Attempting to subscribe to: ${streamName}`);
        console.log(`[useTransmitStream] Calling subscription.create()`);
        
        // Add timeout warning
        const timeoutId = setTimeout(() => {
          console.warn(`[useTransmitStream] ⚠️ Subscription to ${streamName} is taking longer than 5 seconds...`);
        }, 5000);
        
        await subscription.create();
        clearTimeout(timeoutId);
        
        const subscriptionTime = Date.now() - subscriptionStartTime;
        console.log(`[useTransmitStream] subscription.create() completed in ${subscriptionTime}ms`);
        
        if (isMounted) {
          console.log(`[useTransmitStream] Successfully subscribed to: ${streamName}`);
          setIsSubscribed(true);
          setError(null);
          
          subscription.onMessage((message: T) => {
            if (isMounted) {
              setData(message);
            }
          });
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(`[useTransmitStream] Failed to subscribe to ${streamName}:`, err);
          console.error(`[useTransmitStream] Error details:`, {
            message: err?.message,
            status: err?.response?.status,
            statusText: err?.response?.statusText,
            data: err?.response?.data,
            stack: err?.stack
          });
          setError(err as Error);
          setIsSubscribed(false);
        }
      }
    };

    subscribe();

    return () => {
      isMounted = false;
      subscription.delete().catch(console.error);
    };
  }, [transmit, streamName]);

  return { data, error, isSubscribed };
}