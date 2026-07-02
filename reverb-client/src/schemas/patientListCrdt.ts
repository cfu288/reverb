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

// Helper to create empty todo with enhanced schema
export function createEmptyTodo(): any {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    text: '',
    description: '',
    status: 'open',
    tags: [],
    dueTime: {
      type: 'once',
      dueDate: '',
      startDate: '',
      occurrences: 1,
      completedOccurrences: 0,
      intervalHours: 0,
      intervalDays: 0,
      nextDue: '',
    },
    createdAt: now,
    updatedAt: now,
    completedAt: '',
    createdBy: '',
    completedBy: '',
  };
}