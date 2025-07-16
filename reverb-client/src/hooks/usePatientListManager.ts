import { useState, useCallback, useEffect, useMemo } from "react";
import { Patient, createEmptyPatient, generateUUID } from "@/models/Patient";
import {
  example_patients,
  SHOW_EXAMPLE_PATIENTS,
} from "@/data/example_patients";
import { getStorage } from "@/storage/StorageAPI";

interface PatientListMap {
  [key: string]: Patient[];
}

type LoadingState = "LOADING" | "SUCCESS" | "ERROR";

interface PatientListState {
  lists: PatientListMap;
  listNames: string[];
  currentListName: string;
  state: LoadingState;
  error?: string;
}

// Store everything in a single file
const STORAGE_KEY = "patient-lists-state";
const EXAMPLE_LIST_NAME = "Example Patients";

export function usePatientListManager() {
  // Initialize state with empty data while loading
  const [state, setState] = useState<PatientListState>(() => {
    return {
      lists: {},
      listNames: [],
      currentListName: "",
      state: "LOADING" as const,
    };
  });

  const [isNewListModalOpen, setIsNewListModalOpen] = useState<boolean>(false);
  const [newListName, setNewListName] = useState<string>("");
  const [hasLoadedInitialData, setHasLoadedInitialData] =
    useState<boolean>(false);

  // Load initial data from storage
  useEffect(() => {
    async function loadFromStorage() {
      try {
        const storage = await getStorage();
        const savedState = await storage.read<PatientListState>(STORAGE_KEY);
        console.log("savedState", savedState);

        if (
          savedState &&
          savedState.lists &&
          Object.keys(savedState.lists).length > 0
        ) {
          // Ensure all existing patients have UUIDs
          const listsWithUUIDs = Object.entries(savedState.lists).reduce(
            (acc, [listName, patients]) => {
              acc[listName] = (patients as Patient[]).map((patient) =>
                patient.id ? patient : { ...patient, id: generateUUID() }
              );
              return acc;
            },
            {} as PatientListMap
          );

          setState({
            ...savedState,
            lists: listsWithUUIDs,
            state: "SUCCESS",
          });
        } else {
          // If no saved data, create default list with example patients
          const defaultListName = "New List " + new Date().toLocaleDateString();
          setState({
            lists: {
              [defaultListName]: example_patients.map((patient: Patient) => ({
                ...patient,
                id: patient.id || generateUUID(),
              })),
            },
            listNames: [defaultListName],
            currentListName: defaultListName,
            state: "SUCCESS",
          });
        }
        setHasLoadedInitialData(true);
      } catch (error) {
        console.error("Failed to load patient lists:", error);
        setState((prev) => ({
          ...prev,
          state: "ERROR",
          error: "Failed to load patient lists",
        }));
        setHasLoadedInitialData(true);
      }
    }

    loadFromStorage();
  }, []);

  // Memoize the current list's patients, including example list if enabled
  const patients = useMemo(() => {
    if (
      SHOW_EXAMPLE_PATIENTS &&
      state.currentListName === EXAMPLE_LIST_NAME &&
      example_patients.length > 0
    ) {
      return example_patients.map((patient) => ({
        ...patient,
        id: patient.id || generateUUID(),
      }));
    }
    return state.lists[state.currentListName] || [];
  }, [state.lists, state.currentListName]);

  // Sync state to storage whenever it changes
  useEffect(() => {
    async function saveToStorage() {
      try {
        const storage = await getStorage();
        // Save the entire state object, excluding the 'state' and 'error' properties
        const stateToSave = {
          lists: state.lists,
          listNames: state.listNames,
          currentListName: state.currentListName,
        };
        await storage.write(STORAGE_KEY, stateToSave);

        if (state.state === "ERROR") {
          setState((prev) => ({ ...prev, state: "SUCCESS", error: undefined }));
        }
      } catch (error) {
        console.error("Failed to save patient lists:", error);
        setState((prev) => ({
          ...prev,
          state: "ERROR",
          error: "Failed to save patient lists",
        }));
      }
    }

    if (state.state !== "LOADING" && hasLoadedInitialData) {
      saveToStorage();
    }
  }, [
    state.lists,
    state.listNames,
    state.currentListName,
    state.state,
    hasLoadedInitialData,
  ]);

  // Memoize all list names including the example list if enabled
  const allListNames = useMemo(() => {
    if (
      SHOW_EXAMPLE_PATIENTS &&
      example_patients.length > 0 &&
      !state.listNames.includes(EXAMPLE_LIST_NAME)
    ) {
      return [...state.listNames, EXAMPLE_LIST_NAME];
    }
    return state.listNames;
  }, [state.listNames]);

  const setCurrentListName = useCallback((name: string, oldName?: string) => {
    setState((prev) => {
      // Prevent renaming the example list if feature is enabled
      if (SHOW_EXAMPLE_PATIENTS && oldName === EXAMPLE_LIST_NAME) {
        console.warn("Cannot rename the Example Patients list");
        return prev;
      }

      // If oldName is provided, we're renaming a list
      if (oldName) {
        const patients = prev.lists[oldName];
        const newLists = { ...prev.lists };
        delete newLists[oldName];
        newLists[name] = patients;

        return {
          ...prev,
          lists: newLists,
          listNames: prev.listNames.map((n) => (n === oldName ? name : n)),
          currentListName: name,
          state: prev.state,
        };
      }

      // Otherwise, just switching to a different list
      return {
        ...prev,
        currentListName: name,
        state: prev.state,
      };
    });
  }, []);

  const setPatients = useCallback(
    (updater: Patient[] | ((prev: Patient[]) => Patient[])) => {
      setState((prev) => {
        // Prevent modifying the example list if feature is enabled
        if (
          SHOW_EXAMPLE_PATIENTS &&
          prev.currentListName === EXAMPLE_LIST_NAME
        ) {
          console.warn("Cannot modify the Example Patients list");
          return prev;
        }

        const currentPatients = prev.lists[prev.currentListName];
        const newPatients =
          typeof updater === "function" ? updater(currentPatients) : updater;

        // Ensure we're not setting undefined or null values and all patients have UUIDs
        const validPatients = newPatients.map((patient) => ({
          ...patient,
          id: patient.id || generateUUID(),
          mrn: patient.mrn || "",
          first_name: patient.first_name || "",
          last_name: patient.last_name || "",
          dob: patient.dob || "",
          location: patient.location || "",
          one_liner: patient.one_liner || "",
          hpi: patient.hpi || "",
          todos: patient.todos || [],
          assessment_and_plan: patient.assessment_and_plan || [],
        }));

        return {
          ...prev,
          lists: {
            ...prev.lists,
            [prev.currentListName]: validPatients,
          },
        };
      });
    },
    []
  );

  const handleNewListSubmit = useCallback(() => {
    if (SHOW_EXAMPLE_PATIENTS && newListName === EXAMPLE_LIST_NAME) {
      console.warn(
        "Cannot create a list with the reserved name 'Example Patients'"
      );
      return;
    }

    if (newListName && !state.listNames.includes(newListName)) {
      setState((prev) => ({
        lists: {
          ...prev.lists,
          [newListName]: Array(6)
            .fill(null)
            .map(() => createEmptyPatient()),
        },
        listNames: [...prev.listNames, newListName],
        currentListName: newListName,
        state: prev.state,
        error: prev.error,
      }));
      setNewListName("");
      setIsNewListModalOpen(false);
    }
  }, [newListName, state.listNames]);

  // Helper function to find a patient by ID
  const findPatientById = useCallback(
    (id: string): Patient | undefined => {
      return patients.find((p) => p.id === id);
    },
    [patients]
  );

  // Helper function to update a patient by ID
  const updatePatientById = useCallback(
    (id: string, updates: Partial<Patient>) => {
      if (
        SHOW_EXAMPLE_PATIENTS &&
        state.currentListName === EXAMPLE_LIST_NAME
      ) {
        console.warn("Cannot modify patients in the Example Patients list");
        return;
      }
      setPatients((prevPatients) =>
        prevPatients.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    [setPatients, state.currentListName]
  );

  return {
    currentListName: state.currentListName,
    setCurrentListName,
    patients,
    setPatients,
    allListNames,
    isNewListModalOpen,
    setIsNewListModalOpen,
    newListName,
    setNewListName,
    handleNewListSubmit,
    findPatientById,
    updatePatientById,
    state: state.state,
    error: state.error,
  };
}
