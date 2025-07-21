import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { Model } from 'json-joy/lib/json-crdt/model';
import { Patch } from 'json-joy/lib/json-crdt-patch';
import { encode as encodeVerbose, decode as decodeVerbose } from 'json-joy/lib/json-crdt-patch/codec/verbose';
import { useAuth } from '@/hooks/useAuth';
import { useTransmitStream } from '@/providers/TransmitProvider';
import { patientListSchema } from '@/schemas/patientListCrdt';
import { ApiService, ApiError } from '@/services/api';

interface UseRealtimePatientListOptions {
  urlSafeName: string;
  tenantUrlSafeName: string;
}

interface UseRealtimePatientListReturn {
  model: Model<any> | null;
  view: any | null;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  applyLocalChange: (callback: (api: any) => void) => void;
}

export function useRealtimePatientList({
  urlSafeName,
  tenantUrlSafeName,
}: UseRealtimePatientListOptions): UseRealtimePatientListReturn {
  const { currentTenant } = useAuth();
  const [model, setModel] = useState<Model<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const modelRef = useRef<Model<any> | null>(null);
  const lastSyncedVersionRef = useRef<number>(0);
  const syncQueueRef = useRef<Patch[]>([]);
  const isSyncingRef = useRef(false);

  // WebSocket subscription for real-time updates
  const channelName = `org/${tenantUrlSafeName}/patient-lists/${urlSafeName}`;
  const { data: remotePatches, isSubscribed } = useTransmitStream<{ patches: any[] }>(channelName);

  // Subscribe to model changes using useSyncExternalStore
  // Subscribe to both local and remote changes for immediate UI updates
  const view = useSyncExternalStore(
    (callback) => {
      if (!modelRef.current) return () => {};
      
      // Subscribe to any patch application (local or remote)
      const unsubscribePatch = modelRef.current.api.onPatch.listen(() => {
        callback();
      });
      // Also subscribe to local changes for completeness
      const unsubscribeLocal = modelRef.current.api.onLocalChange.listen(() => {
        callback();
      });
      return () => {
        unsubscribePatch();
        unsubscribeLocal();
      };
    },
    () => {
      if (!modelRef.current) return null;
      const snapshot = modelRef.current.view();
      return snapshot;
    },
    () => modelRef.current ? modelRef.current.view() : null
  );

  // Load initial CRDT state from API
  useEffect(() => {
    if (!currentTenant || !urlSafeName) {
      return;
    }

    let unsubscribeFlush: (() => void) | null = null;

    const loadCRDT = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch CRDT binary data
        const response = await ApiService.get<{ crdt?: number[]; version?: number }>(`/patient-lists/${urlSafeName}/crdt`);
        
        if (response.crdt && response.crdt.length > 0) {
          // Create model from binary data
          const binaryData = new Uint8Array(response.crdt);
          const loadedModel = Model.fromBinary(binaryData);
          
          // Get the view to check for corruption
          const view = loadedModel.view();
          
          // Check for corrupted patient structure
          if (view.patients && view.patients.length > 0) {
            const firstPatient = view.patients[0];
            if (firstPatient && typeof firstPatient === 'object' && '0' in firstPatient) {
              console.error('[useRealtimePatientList] CRITICAL: Patient object contains patch operation data!', {
                patient: firstPatient,
                allKeys: Object.keys(firstPatient)
              });
              
              // This should never happen - the backend should prevent this
              // For now, create an empty model to avoid crashes
              const newModel = Model.create();
              newModel.api.root(patientListSchema);
              modelRef.current = newModel;
              setModel(newModel);
              lastSyncedVersionRef.current = 0;
              
              // Alert the user that their data is corrupted
              console.error('Patient list data is corrupted. Please contact support.');
              setError(new Error('Patient list data is corrupted'));
              return;
            }
          }
          
          modelRef.current = loadedModel;
          setModel(loadedModel);
          lastSyncedVersionRef.current = (loadedModel.clock as any).time || 0;
          
          // Enable auto-flush for immediate updates
          modelRef.current.api.autoFlush();
          
          // Listen to flush events and queue them for sync
          unsubscribeFlush = modelRef.current.api.onFlush.listen((patch) => {
            syncQueueRef.current.push(patch);
            // Process queue asynchronously
            setTimeout(() => processSyncQueue(), 0);
          });
        } else {
          // Create new empty model if no CRDT exists
          const newModel = Model.create();
          newModel.api.root(patientListSchema);
          modelRef.current = newModel;
          setModel(newModel);
          lastSyncedVersionRef.current = 0;
          
          // Enable auto-flush for immediate updates
          newModel.api.autoFlush();
          
          // Listen to flush events and queue them for sync
          unsubscribeFlush = newModel.api.onFlush.listen((patch) => {
            syncQueueRef.current.push(patch);
            // Process queue asynchronously
            setTimeout(() => processSyncQueue(), 0);
          });
        }
      } catch (err) {
        console.error('Failed to load CRDT:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCRDT();

    // Cleanup function to remove event listeners
    return () => {
      if (unsubscribeFlush) {
        unsubscribeFlush();
      }
    };
  }, [currentTenant, urlSafeName]);

  // Process sync queue
  const processSyncQueue = useCallback(async () => {
    if (!modelRef.current || !currentTenant || isSyncingRef.current) return;
    if (syncQueueRef.current.length === 0) return;

    isSyncingRef.current = true;
    const patchesToSync = [...syncQueueRef.current];
    syncQueueRef.current = [];

    try {
      // Encode patches to verbose format
      const encodedPatches = patchesToSync.map(patch => encodeVerbose(patch));
      const currentVersion = (modelRef.current.clock as any).time || 0;
      
      // Syncing patches
      
      await ApiService.post(`/patient-lists/${urlSafeName}/patches`, {
        patches: encodedPatches,
        version: currentVersion,
      });

      lastSyncedVersionRef.current = currentVersion;
    } catch (err) {
      console.error('Failed to sync patches:', err);
      
      // Check if it's an authentication error
      if (err instanceof ApiError && err.status === 401) {
        console.error('Authentication failed while syncing patches. User needs to re-authenticate.');
        // Don't put patches back in queue for auth failures - they'll accumulate
        // The auth system will handle logout via the auth-logout-required event
      } else {
        // Put patches back in queue to retry for other errors
        syncQueueRef.current = [...patchesToSync, ...syncQueueRef.current];
      }
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentTenant, urlSafeName]);

  // Apply local changes
  const applyLocalChange = useCallback((callback: (api: any) => void) => {
    if (!modelRef.current) return;

    try {
      // Apply the change locally
      // With autoFlush enabled, changes are immediately flushed and trigger onFlush
      callback(modelRef.current.api);
      
      // The useSyncExternalStore subscription will handle re-renders
    } catch (err) {
      console.error('[useRealtimePatientList] Failed to apply local change:', err);
      setError(err as Error);
    }
  }, []);

  // Apply remote patches
  useEffect(() => {
    if (!remotePatches || !modelRef.current) return;

    try {
      
      // Decode and apply patches from remote
      const patches = remotePatches.patches.map(patchData => decodeVerbose(patchData));
      
      for (const patch of patches) {
        modelRef.current.applyPatch(patch);
      }


      // Update last synced version to avoid re-syncing remote changes
      lastSyncedVersionRef.current = (modelRef.current.clock as any).time;
      
      // The useSyncExternalStore subscription should handle the re-render
    } catch (err) {
      console.error('Failed to apply remote patches:', err);
    }
  }, [remotePatches]);

  // No cleanup needed since we're not using debounce anymore

  return {
    model,
    view,
    isLoading,
    error,
    isConnected: isSubscribed,
    applyLocalChange,
  };
}