import { DisplayTemplate } from "./DisplayTemplate";
import { Todo } from "./Todo";

export interface AssessmentAndPlanItem {
  assessment: string;
  plan: string[];
  category?: string;
}

export interface Med {
  name: string;
  route: string;
  frequency: string;
  dose: string | number;
  unit: string;
}

export interface LabBase {
  display_name: string;
  units: string;
  display_value: string;
  effective_datetime: string;
  identifiers: {
    id: string;
    system: "powerchart-touch";
  }[];
}

export interface LabNumber extends LabBase {
  value_number: number;
  reference_range: {
    low: number;
    high: number;
  };
}

export interface LabString extends LabBase {
  value_string: string;
}

export type Lab = LabNumber | LabString;

export interface VitalBase {
  display_name: string;
  units: string;
  display_value: string;
  effective_datetime: string;
  identifiers: {
    id: string;
    system: "powerchart-touch";
  }[];
}

export interface VitalNumber extends VitalBase {
  value_number: number;
}

export interface VitalString extends VitalBase {
  value_string: string;
}

export type Vital = VitalNumber | VitalString;

export interface Patient {
  id: string;
  mrn?: string;
  first_name?: string;
  last_name?: string;
  dob?: string;
  location?: string;
  one_liner?: string;
  hpi?: string;
  todos?: Todo[];
  meds?: Partial<Med>[];
  assessment_and_plan?: AssessmentAndPlanItem[];
  display_template_overrides?: Partial<DisplayTemplate>[];
  labs?: Partial<Lab>[];
  vitals?: Partial<Vital>[];
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function createEmptyPatient(): Patient {
  return {
    id: generateUUID(),
    mrn: "",
    first_name: "",
    last_name: "",
    dob: "",
    location: "",
    one_liner: "",
    hpi: "",
    todos: [],
    assessment_and_plan: [],
    labs: [],
    vitals: [],
  };
}

export const PatientSchema = {
  type: "object",
  properties: {
    last_name: { type: "string" },
    first_name: { type: "string" },
    dob: { type: "string", format: "date" },
    location: { type: "string" },
    mrn: { type: "string" },
    one_liner: { type: "string" },
    hpi: { type: "string" },
    todos: {
      type: "array",
      items: { $ref: "#/definitions/Todo" },
    },
    assessment_and_plan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          assessment: { type: "string" },
          plan: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["assessment", "plan"],
      },
    },
    display_size: { type: "string", enum: ["1x", "2x"] },
  },
  definitions: {
    Todo: {
      type: "object",
      properties: {
        description: { type: "string" },
        due_date: { type: "string" },
        status: { type: "string", enum: ["OPEN", "CLOSED"] },
      },
      required: ["description", "status"],
    },
  },
  additionalProperties: false,
};
