import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useRealtimePatientList } from '@/hooks/useRealtimePatientList';
import { CRDTHelpers } from '@/utils/crdtHelpers';
import { Patient } from '@/models/Patient';
import { useTenant } from '@/providers/TenantProvider';
import { ApiService } from '@/services/api';

interface RealtimePatientListContextType {
  // State
  patients: Patient[];
  currentListName: string;
  state: 'LOADING' | 'SUCCESS' | 'ERROR';
  error?: string;
  
  // Operations
  setPatients: (patients: Patient[]) => void;
  updatePatientById: (id: string, updates: Partial<Patient>) => void;
  findPatientById: (id: string) => Patient | undefined;
  addPatient: (patient: Patient) => void;
  removePatient: (id: string) => void;
  
  // List management (simplified for now)
  allListNames: string[];
  setCurrentListName: (name: string) => void;
  isNewListModalOpen: boolean;
  setIsNewListModalOpen: (open: boolean) => void;
  newListName: string;
  setNewListName: (name: string) => void;
  handleNewListSubmit: () => void;
}

export const RealtimePatientListContext = createContext<RealtimePatientListContextType | null>(null);

export function RealtimePatientListProvider({ children }: { children: React.ReactNode }) {
  const { currentTenant } = useTenant();
  const [currentListName, setCurrentListNameState] = React.useState('default');
  
  const {
    model,
    view,
    isLoading,
    error,
    applyLocalChange
  } = useRealtimePatientList({
    urlSafeName: currentListName,
    tenantUrlSafeName: currentTenant?.urlSafeName || ''
  });

  // Extract patients from the view
  const patients = useMemo(() => {
    if (!view) {
      return [];
    }
    return view.patients || [];
  }, [view]);

  // Operations
  const setPatients = useCallback((newPatients: Patient[] | ((prev: Patient[]) => Patient[])) => {
    if (!model) return;
    
    // Handle function updater pattern
    const updatedPatients = typeof newPatients === 'function' 
      ? newPatients(patients)
      : newPatients;
    
    applyLocalChange((api) => {
      // Clear existing patients
      const currentPatients = CRDTHelpers.getPatients(model);
      for (let i = currentPatients.length - 1; i >= 0; i--) {
        CRDTHelpers.removePatient(api, i);
      }
      
      // Add new patients
      updatedPatients.forEach(patient => {
        CRDTHelpers.addPatient(api, {
          id: patient.id || crypto.randomUUID(),
          mrn: patient.mrn || '',
          dob: patient.dob || '',
          first_name: patient.first_name || '',
          last_name: patient.last_name || '',
          location: patient.location || '',
          one_liner: patient.one_liner || '',
          hpi: patient.hpi || '',
          todos: patient.todos || [],
          labs: patient.labs || [],
          vitals: patient.vitals || [],
          meds: patient.meds || [],
          assessment_and_plan: patient.assessment_and_plan || []
        });
      });
    });
  }, [model, patients, applyLocalChange]);

  const updatePatientById = useCallback((id: string, updates: Partial<Patient>) => {
    if (!model) return;
    
    // Logging removed
    
    applyLocalChange((api) => {
      const patientIndex = CRDTHelpers.findPatientIndex(model, id);
      if (patientIndex === -1) {
        console.error('[RealtimePatientListProvider] Patient not found!');
        return;
      }
      
      // Update each field that's provided
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          CRDTHelpers.updatePatientField(api, patientIndex, key, value);
        }
      });
    });
  }, [model, applyLocalChange]);

  const findPatientById = useCallback((id: string): Patient | undefined => {
    return patients.find(p => p.id === id);
  }, [patients]);

  const addPatient = useCallback((patient: Patient) => {
    if (!model) return;
    
    applyLocalChange((api) => {
      CRDTHelpers.addPatient(api, {
        id: patient.id || crypto.randomUUID(),
        mrn: patient.mrn,
        dob: patient.dob,
        first_name: patient.first_name,
        last_name: patient.last_name,
        location: patient.location,
        one_liner: patient.one_liner,
        hpi: patient.hpi,
        todos: patient.todos || [],
        labs: patient.labs || [],
        vitals: patient.vitals || [],
        meds: patient.meds || [],
        assessment_and_plan: patient.assessment_and_plan || []
      });
    });
  }, [model, applyLocalChange]);

  const removePatient = useCallback((id: string) => {
    if (!model) return;
    
    applyLocalChange((api) => {
      const patientIndex = CRDTHelpers.findPatientIndex(model, id);
      if (patientIndex === -1) return;
      
      CRDTHelpers.removePatient(api, patientIndex);
    });
  }, [model, applyLocalChange]);

  // List management with actual switching
  const [allListNames, setAllListNames] = React.useState<string[]>(['default']);
  
  // Load available lists on mount
  React.useEffect(() => {
    const loadLists = async () => {
      try {
        const response = await ApiService.get<{ lists: Array<{ urlSafeName: string; displayName: string }> }>('/patient-lists');
        if (response.lists) {
          setAllListNames(response.lists.map(l => l.urlSafeName));
        }
      } catch (error) {
        console.error('Failed to load patient lists:', error);
      }
    };
    
    if (currentTenant) {
      loadLists();
    }
  }, [currentTenant]);
  
  const setCurrentListName = useCallback((name: string) => {
    if (name !== currentListName && allListNames.includes(name)) {
      setCurrentListNameState(name);
    }
  }, [currentListName, allListNames]);

  // Modal state (kept for compatibility)
  const [isNewListModalOpen, setIsNewListModalOpen] = React.useState(false);
  const [newListName, setNewListName] = React.useState('');
  
  const handleNewListSubmit = useCallback(async () => {
    if (!newListName.trim()) return;
    
    try {
      const urlSafeName = newListName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      await ApiService.post('/patient-lists', {
        displayName: newListName,
        urlSafeName,
        isPublic: false
      });
      
      // Reload lists and switch to the new one
      const response = await ApiService.get<{ lists: Array<{ urlSafeName: string; displayName: string }> }>('/patient-lists');
      if (response.lists) {
        setAllListNames(response.lists.map(l => l.urlSafeName));
        setCurrentListNameState(urlSafeName);
      }
      
      setNewListName('');
      setIsNewListModalOpen(false);
    } catch (error) {
      console.error('Failed to create new list:', error);
      alert('Failed to create new list');
    }
  }, [newListName]);

  const contextValue: RealtimePatientListContextType = useMemo(() => ({
    patients,
    currentListName,
    state: isLoading ? 'LOADING' : error ? 'ERROR' : 'SUCCESS',
    error: error?.message,
    setPatients,
    updatePatientById,
    findPatientById,
    addPatient,
    removePatient,
    allListNames,
    setCurrentListName,
    isNewListModalOpen,
    setIsNewListModalOpen,
    newListName,
    setNewListName,
    handleNewListSubmit,
  }), [
    patients,
    currentListName,
    isLoading,
    error,
    setPatients,
    updatePatientById,
    findPatientById,
    addPatient,
    removePatient,
    allListNames,
    setCurrentListName,
    isNewListModalOpen,
    newListName,
    handleNewListSubmit,
  ]);

  return (
    <RealtimePatientListContext.Provider value={contextValue}>
      {children}
    </RealtimePatientListContext.Provider>
  );
}

export function useRealtimePatientListContext() {
  const context = useContext(RealtimePatientListContext);
  if (!context) {
    throw new Error('useRealtimePatientListContext must be used within RealtimePatientListProvider');
  }
  return context;
}