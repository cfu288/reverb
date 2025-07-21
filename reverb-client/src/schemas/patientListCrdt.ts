// Define the complete Patient List CRDT schema structure
// IMPORTANT: This should only contain collaborative data that users can edit
// Metadata like id, owner_id, timestamps etc. are stored in the database only
export const patientListSchema = {
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
export function createEmptyPatientListCRDT(): any {
  return {
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