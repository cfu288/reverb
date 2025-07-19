import { useTransmitConnection } from '@/providers/TransmitProvider';
import { useAuth } from '@/hooks/useAuth';
import { Wifi, Loader2, AlertCircle } from 'lucide-react';

export function WebSocketStatus() {
  const { connectionState, transmit } = useTransmitConnection();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || !transmit) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-white p-2 shadow-lg border z-50">
      {connectionState === 'connected' && (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-700">Real-time Connected</span>
        </>
      )}
      {connectionState === 'disconnected' && (
        <>
          <Wifi className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-700">Real-time Ready</span>
        </>
      )}
      {connectionState === 'reconnecting' && (
        <>
          <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />
          <span className="text-sm text-yellow-700">Reconnecting...</span>
        </>
      )}
      {connectionState === 'failed' && (
        <>
          <AlertCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-700">Connection Failed</span>
        </>
      )}
    </div>
  );
}