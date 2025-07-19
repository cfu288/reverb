import { Model } from 'json-joy/lib/json-crdt/model/Model';

// Define the complete Patient List CRDT schema structure
export const patientListSchema = {
  id: '',
  name: '',
  owner_id: 0,
  url_safe_name: '',
  created_at: '',
  updated_at: '',
  patients: [],
  display_template_id: '',
  settings: {
    sort_order: 'location',
    filters: {
      locations: [],
      tags: [],
    },
  },
};

// Helper function to create an empty patient list CRDT
export function createEmptyPatientListCRDT(metadata: {
  id: string;
  name: string;
  owner_id: number;
  url_safe_name: string;
}): any {
  return {
    id: metadata.id,
    name: metadata.name,
    owner_id: metadata.owner_id,
    url_safe_name: metadata.url_safe_name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    patients: [],
    display_template_id: '',
    settings: {
      sort_order: 'location',
      filters: {
        locations: [],
        tags: [],
      },
    },
  };
}

// Helper to create empty patient
export function createEmptyPatient(): any {
  return {
    id: crypto.randomUUID(),
    mrn: '',
    dob: '',
    first_name: '',
    last_name: '',
    location: '',
    one_liner: '',
    hpi: '',
    todos: [],
    labs: [],
    vitals: [],
    meds: [],
    assessment_and_plan: [],
  };
}

// Helper to create empty todo
export function createEmptyTodo(): any {
  return {
    id: crypto.randomUUID(),
    description: '',
    due_date: '',
    status: 'OPEN',
  };
}