import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DisplayTemplate } from "@/models/DisplayTemplate";
import { SectionConfig } from "./SectionConfig";

interface TemplateFormProps {
  template: Partial<DisplayTemplate>;
  onTemplateChange: (template: Partial<DisplayTemplate>) => void;
  onSave?: () => void;
  onCancel?: () => void;
  mode?: "create" | "edit";
  showBasicInfoOnly?: boolean;
  showCoreSectionsOnly?: boolean;
  showClinicalDataOnly?: boolean;
  readOnly?: boolean;
}

/**
 * Form component for creating or editing templates
 */
export const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onTemplateChange,
  onSave,
  onCancel,
  mode,
  showBasicInfoOnly,
  showCoreSectionsOnly,
  showClinicalDataOnly,
  readOnly,
}) => {
  const handleInputChange = (
    field: keyof DisplayTemplate,
    value: string | number
  ) => {
    if (readOnly) return;
    onTemplateChange({
      ...template,
      [field]: value,
    });
  };

  const renderBasicInfo = () => (
    <>
      <div className="col-span-1">
        <label className="block text-sm font-medium mb-1">Template Name</label>
        <Input
          value={template.templateName || ""}
          onChange={(e) => handleInputChange("templateName", e.target.value)}
          placeholder="Enter template name"
          readOnly={readOnly}
        />
      </div>

      {template.templateId && (
        <div className="col-span-1 text-sm text-gray-500 mt-2">
          Template ID: {template.templateId}
        </div>
      )}

      <div className="col-span-1">
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={template.description || ""}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Enter template description"
          readOnly={readOnly}
        />
      </div>

      <div className="col-span-1">
        <label className="block text-sm font-medium mb-1">
          Patients Per Page
        </label>
        <Input
          type="number"
          min={1}
          max={4}
          value={template.patientsPerPage || 1}
          onChange={(e) =>
            handleInputChange("patientsPerPage", parseInt(e.target.value))
          }
          readOnly={readOnly}
        />
      </div>
    </>
  );

  const renderCoreSections = () => (
    <div className="col-span-full">
      <SectionConfig
        template={template}
        onTemplateChange={onTemplateChange}
        readOnly={readOnly}
        showCoreSectionsOnly
      />
    </div>
  );

  const renderClinicalData = () => (
    <div className="col-span-full">
      <SectionConfig
        template={template}
        onTemplateChange={onTemplateChange}
        readOnly={readOnly}
        showClinicalDataOnly
      />
    </div>
  );

  const renderActions = () => (
    <>
      {(onSave || onCancel) && (
        <div className="col-span-full flex justify-end gap-2 mt-6">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave}>
              {mode === "create" ? "Create Template" : "Save Changes"}
            </Button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {showBasicInfoOnly && renderBasicInfo()}
      {showCoreSectionsOnly && renderCoreSections()}
      {showClinicalDataOnly && renderClinicalData()}
      {readOnly && (
        <>
          {renderBasicInfo()}
          {renderCoreSections()}
          {renderClinicalData()}
        </>
      )}
      {!readOnly && renderActions()}
    </div>
  );
};
