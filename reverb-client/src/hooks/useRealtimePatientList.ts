import { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { Model } from 'json-joy/lib/json-crdt/model';
import { Patch } from 'json-joy/lib/json-crdt-patch';
import { encode as encodeVerbose, decode as decodeVerbose } from 'json-joy/lib/json-crdt-patch/codec/verbose';
import { useAuth } from '@/hooks/useAuth';
import { useTransmitStream } from '@/providers/TransmitProvider';
import { patientListSchema } from '@/schemas/patientListCrdt';
import { ApiService } from '@/services/api';

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
  // For immediate updates (like text inputs), we need to subscribe to onLocalChange
  const view = useSyncExternalStore(
    model ? (callback) => {
      console.log('[useRealtimePatientList] Setting up subscription with onLocalChange');
      // Subscribe to local changes for immediate UI updates
      const unsubscribe = model.api.onLocalChange.listen(() => {
        console.log('[useRealtimePatientList] onLocalChange fired, calling callback');
        callback();
      });
      return unsubscribe;
    } : () => () => {},
    model ? () => {
      const snapshot = model.view();
      const firstPatient = snapshot?.patients?.[0];
      console.log('[useRealtimePatientList] Getting snapshot:', {
        hasSnapshot: !!snapshot,
        patientsCount: snapshot?.patients?.length,
        firstPatient: firstPatient ? {
          id: firstPatient.id,
          one_liner: firstPatient.one_liner,
          one_liner_length: firstPatient.one_liner?.length,
          one_liner_type: typeof firstPatient.one_liner,
          first_name: firstPatient.first_name,
          last_name: firstPatient.last_name
        } : null,
        modelClock: model ? (model.clock as any).time : null
      });
      return snapshot;
    } : () => null,
    model ? () => model.view() : () => null
  );

  // Load initial CRDT state from API
  useEffect(() => {
    if (!currentTenant || !urlSafeName) {
      return;
    }

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
          
          // Log the structure for debugging
          const view = loadedModel.view();
          console.log('[useRealtimePatientList] Loaded CRDT structure:', JSON.stringify(view, null, 2));
          
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
          modelRef.current.api.onFlush.listen((patch) => {
            console.log('[useRealtimePatientList] onFlush fired, patch ops:', patch.ops.length);
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
          newModel.api.onFlush.listen((patch) => {
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
      
      await ApiService.post(`/patient-lists/${urlSafeName}/patches`, {
        patches: encodedPatches,
        version: currentVersion,
      });

      lastSyncedVersionRef.current = currentVersion;
    } catch (err) {
      console.error('Failed to sync patches:', err);
      // Put patches back in queue to retry
      syncQueueRef.current = [...patchesToSync, ...syncQueueRef.current];
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentTenant, urlSafeName]);

  // Apply local changes
  const applyLocalChange = useCallback((callback: (api: any) => void) => {
    console.log('[useRealtimePatientList] applyLocalChange called, hasModel:', !!modelRef.current, 'stateModel:', !!model);
    if (!modelRef.current) return;

    try {
      // Apply the change locally
      // With autoFlush enabled, changes are immediately flushed and trigger onFlush
      console.log('[useRealtimePatientList] Calling callback with api');
      callback(modelRef.current.api);
      console.log('[useRealtimePatientList] Callback completed');
      
      // Force a re-render by updating state
      setModel(modelRef.current);
    } catch (err) {
      console.error('[useRealtimePatientList] Failed to apply local change:', err);
      setError(err as Error);
    }
  }, [model]);

  // Apply remote patches
  useEffect(() => {
    if (!remotePatches || !modelRef.current) return;

    try {
      // Decode and apply patches from remote
      const patches = remotePatches.patches.map(patchData => decodeVerbose(patchData));
      
      for (const patch of patches) {
        modelRef.current.applyPatch(patch);
      }

      // React will automatically re-render via useSyncExternalStore subscription
      
      // Update last synced version to avoid re-syncing remote changes
      lastSyncedVersionRef.current = modelRef.current.clock.tick;
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