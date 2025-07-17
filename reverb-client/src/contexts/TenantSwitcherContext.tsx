import { createContext, useContext, useState, ReactNode } from 'react';

interface TenantSwitcherContextValue {
  isOpen: boolean;
  openTenantSwitcher: () => void;
  closeTenantSwitcher: () => void;
}

const TenantSwitcherContext = createContext<TenantSwitcherContextValue | null>(null);

export function TenantSwitcherProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openTenantSwitcher = () => setIsOpen(true);
  const closeTenantSwitcher = () => setIsOpen(false);

  return (
    <TenantSwitcherContext.Provider value={{ isOpen, openTenantSwitcher, closeTenantSwitcher }}>
      {children}
    </TenantSwitcherContext.Provider>
  );
}

export function useTenantSwitcher() {
  const context = useContext(TenantSwitcherContext);
  if (!context) {
    throw new Error('useTenantSwitcher must be used within TenantSwitcherProvider');
  }
  return context;
}