import React from 'react';
import { RealtimePatientListProvider } from './RealtimePatientListProvider';

// This wrapper is no longer needed since we've fully migrated to CRDT
// Keeping it temporarily for easy rollback if needed
export function PatientListProviderWrapper({ children }: { children: React.ReactNode }) {
  return <RealtimePatientListProvider>{children}</RealtimePatientListProvider>;
}