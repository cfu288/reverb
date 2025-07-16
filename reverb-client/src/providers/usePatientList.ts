import { useContext } from "react";
import { PatientListContext } from "./PatientListProvider";

export function usePatientList() {
  const context = useContext(PatientListContext);
  if (!context) {
    throw new Error("usePatientList must be used within a PatientListProvider");
  }
  return {
    ...context,
    state: context.state,
    error: context.error,
  };
}
