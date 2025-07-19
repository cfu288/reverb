import { useContext } from "react";
import { RealtimePatientListContext } from "./RealtimePatientListProvider";

export function usePatientList() {
  const context = useContext(RealtimePatientListContext);
  if (!context) {
    throw new Error("usePatientList must be used within a PatientListProvider");
  }
  return context;
}