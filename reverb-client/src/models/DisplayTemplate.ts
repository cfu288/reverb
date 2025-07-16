import { Todo } from "./Todo";

/**
 * Base interface for section height configuration
 */
export interface SectionHeight {
  height?: "1/12" | "1/6" | "1/4" | "1/3";
}

/**
 * Base interface for all template sections
 */
export interface BaseSection {
  enabled: boolean;
}

/**
 * Interface for sections that can be displayed in full width
 */
export interface FullWidthSection extends BaseSection {
  fullWidth?: boolean;
}

/**
 * Represents a display template for patient rounding sheets
 * @property templateName - The name of the template
 * @property templateId - Unique identifier for the template
 * @property description - Description of the template's purpose
 * @property imagePreview - URL or path to template preview image
 * @property displaySize - Size configuration for the template display
 * @property patientsPerPage - Number of patients to display per page
 */
export interface DisplayTemplate {
  // Core properties
  templateName: string;
  templateId: string;
  description: string;
  imagePreview: string;
  displaySize: "1x" | "2x";
  patientsPerPage: number;

  // Sections with height configuration
  socialHistory?: BaseSection & SectionHeight;
  familyHistory?: BaseSection & SectionHeight;
  allergies?: BaseSection & SectionHeight;
  surgicalHistory?: BaseSection & SectionHeight;

  // Sections with full width option
  events?: FullWidthSection & SectionHeight;
  labs?: FullWidthSection;

  // Sections with custom fields
  hpi?: BaseSection & { blankLines?: number };
  physicalExam?: BaseSection & { sections: string[] };
  vitals?: BaseSection & { sections: string[] };
  ap?: BaseSection & {
    systemsBased: boolean;
    systems: string[];
    enableMisc?: boolean;
  };

  // Simple sections
  meds?: BaseSection & {
    compactView?: boolean;
  };
  consults?: BaseSection;
  imaging?: BaseSection;
  micro?: BaseSection;
  todo?: BaseSection;

  // Lists
  dailyTodoList?: Todo[];
}
