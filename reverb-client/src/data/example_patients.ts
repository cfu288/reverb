import { Patient, createEmptyPatient } from "@/models/Patient";

// Feature toggle for showing the example patients list
export const SHOW_EXAMPLE_PATIENTS = true;

const vitals: Partial<Patient>[] = [];

const updates_to_patients: Patient[] = [];

export const example_patients_default: Patient[] = [];

// for patient in existing patients, find matching patient in updates, if exists, and update existing patients with properties if they exist
function applyUpdatesToPatients(
  existingPts: Patient[],
  updatesArrays: Partial<Patient>[][]
): Patient[] {
  let updatedPatients = [...existingPts];

  for (const updates of updatesArrays) {
    updatedPatients = updatedPatients.map((patient) => {
      const update = updates.find((u) => u.id === patient.id);
      return update ? { ...patient, ...update } : patient;
    });
  }

  return updatedPatients;
}

export const example_patients: Patient[] = applyUpdatesToPatients(
  example_patients_default,
  [vitals, updates_to_patients]
);
