import { s } from 'json-joy/lib/json-crdt-patch/schema.js'

// Define the Todo schema
const todoSchema = s.obj({
  id: s.str(''),
  description: s.str(''),
  due_date: s.str(''), // optional in frontend
  status: s.str(''), // optional in frontend, "OPEN" | "CLOSED"
})

// Define the Lab schema
const labSchema = s.obj({
  id: s.str(''),
  display_name: s.str(''),
  units: s.str(''),
  display_value: s.str(''),
  effective_datetime: s.str(''),
  value_number: s.con(0), // optional in frontend
  value_string: s.str(''), // optional in frontend
  reference_range: s.con(null), // optional in frontend, can be object or string
  identifiers: s.arr([
    s.obj({
      id: s.str(''),
      system: s.str(''),
    }),
  ]),
})

// Define the Vital schema
const vitalSchema = s.obj({
  id: s.str(''),
  display_name: s.str(''),
  units: s.str(''),
  display_value: s.str(''),
  effective_datetime: s.str(''),
  value_number: s.con(0), // optional in frontend
  value_string: s.str(''), // optional in frontend
  reference_range: s.con(null), // optional in frontend, can be object or string
  identifiers: s.arr([
    s.obj({
      id: s.str(''),
      system: s.str(''),
    }),
  ]),
})

// Define the Med schema
const medSchema = s.obj({
  id: s.str(''),
  name: s.str(''),
  route: s.str(''),
  frequency: s.str(''),
  dose: s.con(null), // Can be string or number
  unit: s.str(''),
})

// Define the Assessment and Plan Item schema
const assessmentPlanSchema = s.obj({
  id: s.str(''),
  assessment: s.str(''),
  plan: s.arr([s.str('')]),
  category: s.str(''), // optional in frontend
})

// Define the Patient schema
const patientSchema = s.obj({
  id: s.str(''),
  mrn: s.str(''),
  dob: s.str(''),
  first_name: s.str(''), // optional in frontend
  last_name: s.str(''), // optional in frontend
  location: s.str(''), // optional in frontend
  one_liner: s.str(''), // optional in frontend
  hpi: s.str(''), // optional in frontend
  todos: s.arr([todoSchema]),
  labs: s.arr([labSchema]),
  vitals: s.arr([vitalSchema]),
  meds: s.arr([medSchema]),
  assessment_and_plan: s.arr([assessmentPlanSchema]),
  // Display template overrides could be added if needed
})

// Define the complete Patient List CRDT schema
// IMPORTANT: This schema should only contain collaborative data that users can edit
// Metadata like id, owner_id, timestamps, etc. should be stored in the database only
export const patientListSchema = s.obj({
  // Patient data - the main collaborative content
  patients: s.arr([patientSchema]),

  // List configuration - user-editable settings
  display_template_id: s.str(''), // optional in frontend
  settings: s.obj({
    sort_order: s.str(''), // optional in frontend, "location" | "name" | "mrn"
    filters: s.obj({
      locations: s.arr([s.str('')]), // optional in frontend
      tags: s.arr([s.str('')]), // optional in frontend
    }), // optional in frontend
  }), // optional in frontend
})

// Helper function to create an empty patient list CRDT
export function createEmptyPatientListCRDT(): any {
  return {
    patients: [],
    display_template_id: null, // Match frontend's null default
    settings: {
      sort_order: null, // Match frontend's null default
      filters: {
        locations: [],
        tags: [],
      },
    },
  }
}
