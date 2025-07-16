import React, { createContext } from "react";
import { usePatientListManager } from "@/hooks/usePatientListManager";

type PatientListContextType = ReturnType<typeof usePatientListManager>;

export const PatientListContext = createContext<PatientListContextType | null>(
  null
);

export function PatientListProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const patientListState = usePatientListManager();

  return (
    <PatientListContext.Provider value={patientListState}>
      {children}
    </PatientListContext.Provider>
  );
}
