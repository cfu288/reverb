import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DisplayTemplate,
  BaseSection,
  SectionHeight,
  FullWidthSection,
} from "@/models/DisplayTemplate";
import { cn } from "@/lib/utils";

type SectionKey = keyof Pick<
  DisplayTemplate,
  | "socialHistory"
  | "familyHistory"
  | "allergies"
  | "surgicalHistory"
  | "physicalExam"
  | "vitals"
  | "meds"
  | "consults"
  | "imaging"
  | "micro"
  | "hpi"
  | "events"
  | "labs"
  | "ap"
  | "todo"
>;

interface SectionConfigProps {
  template: Partial<DisplayTemplate>;
  onTemplateChange: (template: Partial<DisplayTemplate>) => void;
  readOnly?: boolean;
  showCoreSectionsOnly?: boolean;
  showClinicalDataOnly?: boolean;
}

/**
 * Component for configuring template sections
 */
export const SectionConfig: React.FC<SectionConfigProps> = ({
  template,
  onTemplateChange,
  readOnly,
  showCoreSectionsOnly,
  showClinicalDataOnly,
}) => {
  const handleHeightChange = (
    sectionKey: keyof DisplayTemplate,
    height: SectionHeight["height"]
  ) => {
    if (readOnly) return;
    onTemplateChange({
      ...template,
      [sectionKey]: {
        ...(template[sectionKey] as BaseSection & SectionHeight),
        height,
      },
    });
  };

  const handleSectionToggle = (
    sectionKey: keyof DisplayTemplate,
    enabled: boolean
  ) => {
    if (readOnly) return;
    onTemplateChange({
      ...template,
      [sectionKey]: {
        ...(template[sectionKey] as BaseSection),
        enabled,
      },
    });
  };

  const renderHeightSelect = (
    sectionKey: keyof DisplayTemplate,
    section?: BaseSection & SectionHeight
  ) => {
    if (!section?.enabled) return null;

    return (
      <select
        value={section.height ?? "1/12"}
        onChange={(e) =>
          handleHeightChange(
            sectionKey,
            e.target.value as SectionHeight["height"]
          )
        }
        className="ml-2 border rounded"
      >
        <option value="1/12">1/12</option>
        <option value="1/6">1/6</option>
        <option value="1/4">1/4</option>
        <option value="1/3">1/3</option>
      </select>
    );
  };

  const renderSectionsList = (
    sectionKey: "physicalExam" | "vitals",
    section?: BaseSection & { sections: string[] }
  ) => {
    if (!section?.enabled) return null;

    return (
      <div className="ml-6 mt-2 space-y-2">
        <label className="block text-sm font-medium">Sections</label>
        <div className="space-y-2">
          {(section.sections || []).map((sectionName, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={sectionName}
                onChange={(e) => {
                  const newSections = [...section.sections];
                  newSections[index] = e.target.value;
                  onTemplateChange({
                    ...template,
                    [sectionKey]: {
                      enabled: true,
                      sections: newSections,
                    },
                  });
                }}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSections = section.sections.filter(
                    (_, i) => i !== index
                  );
                  onTemplateChange({
                    ...template,
                    [sectionKey]: {
                      enabled: true,
                      sections: newSections,
                    },
                  });
                }}
              >
                🗑️
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newSections = [...(section.sections || []), ""];
              onTemplateChange({
                ...template,
                [sectionKey]: {
                  enabled: true,
                  sections: newSections,
                },
              });
            }}
          >
            Add Section
          </Button>
        </div>
      </div>
    );
  };

  const coreSections: SectionKey[] = [
    "hpi",
    "events",
    "socialHistory",
    "familyHistory",
    "allergies",
    "surgicalHistory",
  ];

  const clinicalSections: SectionKey[] = [
    "physicalExam",
    "vitals",
    "labs",
    "meds",
    "consults",
    "imaging",
    "micro",
    "ap",
    "todo",
  ];

  const renderSection = (key: SectionKey) => {
    const section = template[key] as BaseSection;
    if (!section) return null;

    const isFullWidthSection = (
      section: BaseSection
    ): section is FullWidthSection => {
      return "fullWidth" in section;
    };

    return (
      <div key={key} className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={section.enabled}
            onCheckedChange={(checked) => handleSectionToggle(key, !!checked)}
            disabled={readOnly}
          />
          <span>{key}</span>
          {renderHeightSelect(
            key,
            template[key] as BaseSection & SectionHeight
          )}
          {isFullWidthSection(section) && section.enabled && (
            <>
              <Checkbox
                checked={section.fullWidth}
                onCheckedChange={(checked) =>
                  onTemplateChange({
                    ...template,
                    [key]: {
                      ...section,
                      fullWidth: !!checked,
                    },
                  })
                }
                disabled={readOnly}
              />
              <span>Full Width</span>
            </>
          )}
        </div>
        {key === "physicalExam" &&
          renderSectionsList("physicalExam", template.physicalExam)}
        {key === "vitals" && renderSectionsList("vitals", template.vitals)}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", { "opacity-75": readOnly })}>
      {showCoreSectionsOnly && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Core Sections</h3>
          <div className="space-y-2">
            {coreSections.map((key) => renderSection(key))}
          </div>
        </div>
      )}

      {showClinicalDataOnly && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Clinical Data</h3>
          <div className="space-y-2">
            {clinicalSections.map((key) => renderSection(key))}
          </div>
        </div>
      )}

      {!showCoreSectionsOnly && !showClinicalDataOnly && (
        <div className="space-y-4">
          <div className="space-y-2">
            {[...coreSections, ...clinicalSections].map((key) =>
              renderSection(key)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
