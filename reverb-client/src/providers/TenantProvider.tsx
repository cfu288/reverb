import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Tenant } from '@/schemas/auth';

interface TenantContextValue {
  currentTenant: Tenant | null;
  switchTenant: (tenant: Tenant) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const { currentTenant, switchTenant, isInitialized } = useAuth();

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        switchTenant,
        isLoading: !isInitialized,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
}