import { DisplayTemplate } from "./DisplayTemplate";
import { Todo } from "./Todo";

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
  reference_range: string;
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
  reference_range: {
    low: number;
    high: number;
  };
}

export interface VitalString extends VitalBase {
  value_string: string;
  reference_range: string;
}

export type Vital = VitalNumber | VitalString;

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

export interface Patient {
  id: string;
  mrn: string;
  dob: string;
  vitals?: Partial<Vital>[];
  labs?: Partial<Lab>[];
  meds?: Partial<Med>[];
  todos?: Todo[];
  one_liner?: string;
  hpi?: string;
  assessment_and_plan?: AssessmentAndPlanItem[];
  display_template_overrides?: Partial<DisplayTemplate>[];
  first_name?: string;
  last_name?: string;
  location?: string;
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
    dob: "",
    vitals: [],
    labs: [],
    meds: [],
    todos: [],
    one_liner: "",
    hpi: "",
    assessment_and_plan: [],
    first_name: "",
    last_name: "",
    location: "",
  };
}
