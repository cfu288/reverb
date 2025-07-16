import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DisplayTemplate, BaseSection } from "@/models/DisplayTemplate";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { useTemplates } from "@/providers/TemplatesProvider";
import { StepIndicator, Step } from "@/components/ui/step-indicator";
import { AppHeader } from "@/components/AppHeader";

const steps: Step[] = [
  {
    title: "Basic Info",
    description: "Template name and description",
  },
  {
    title: "Core Sections",
    description: "Configure primary sections",
  },
  {
    title: "Clinical Data",
    description: "Configure clinical sections",
  },
  {
    title: "Review",
    description: "Review and create template",
  },
];

const defaultTemplate: Partial<DisplayTemplate> = {
  templateName: "",
  description: "",
  imagePreview: "/images/custom.png",
  patientsPerPage: 1,
  displaySize: "1x",
  hpi: { enabled: true },
  events: { enabled: true, fullWidth: false },
  socialHistory: { enabled: true, height: "1/12" },
  familyHistory: { enabled: true, height: "1/12" },
  allergies: { enabled: true, height: "1/12" },
  surgicalHistory: { enabled: true, height: "1/12" },
  physicalExam: {
    enabled: true,
    sections: ["HEENT", "Skin", "CVS", "Pulm", "GI", "MSK", "Neuro", "Lines"],
  },
  vitals: {
    enabled: true,
    sections: ["Temp", "Sys", "Dias", "RR", "HR", "SpO2"],
  },
  labs: { enabled: true, fullWidth: false },
  meds: { enabled: true },
  consults: { enabled: true },
  imaging: { enabled: true },
  micro: { enabled: true },
  ap: {
    enabled: true,
    systemsBased: false,
    systems: [],
    enableMisc: false,
  },
  todo: { enabled: true },
  dailyTodoList: [{ description: "Note", status: "OPEN" }],
};

export function CreateTemplate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTemplate } = useTemplates();
  const [currentStep, setCurrentStep] = useState(0);
  const [template, setTemplate] = useState<Partial<DisplayTemplate>>(() => {
    const templateToCustomize = location.state?.templateToCustomize;
    if (templateToCustomize) {
      return {
        ...templateToCustomize,
        templateName: `Copy of ${templateToCustomize.templateName}`,
        templateId: undefined,
      };
    }
    return defaultTemplate;
  });

  const handleNext = () => {
    if (currentStep === 0 && !template.templateName) {
      alert("Template name is required");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    try {
      const templateId = generateTemplateId(template.templateName!);
      const newTemplate = {
        ...template,
        templateId,
      } as DisplayTemplate;

      await addTemplate(newTemplate);
      navigate("/template-config");
    } catch {
      alert("Failed to save template");
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Template Name</label>
        <Input
          value={template.templateName || ""}
          onChange={(e) =>
            setTemplate({ ...template, templateName: e.target.value })
          }
          placeholder="Enter template name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea
          value={template.description || ""}
          onChange={(e) =>
            setTemplate({ ...template, description: e.target.value })
          }
          placeholder="Enter template description"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Patients Per Page
        </label>
        <Input
          type="number"
          min={1}
          max={4}
          value={template.patientsPerPage || 1}
          onChange={(e) =>
            setTemplate({
              ...template,
              patientsPerPage: parseInt(e.target.value),
            })
          }
        />
      </div>
    </div>
  );

  const renderCoreSections = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.hpi?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  hpi: { ...template.hpi, enabled: !!checked },
                })
              }
            />
            <span>HPI</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            History of present illness - A detailed narrative of the patient's
            current medical issue.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.events?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  events: {
                    enabled: !!checked,
                    fullWidth: template.events?.fullWidth ?? false,
                  },
                })
              }
            />
            <span>Events</span>
            {template.events?.enabled && (
              <>
                <Checkbox
                  checked={template.events?.fullWidth}
                  onCheckedChange={(checked) =>
                    setTemplate({
                      ...template,
                      events: {
                        enabled: true,
                        fullWidth: !!checked,
                      },
                    })
                  }
                />
                <span>Full Width</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Track significant events during the patient's stay. Full width
            option allows for more detailed event descriptions.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.socialHistory?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  socialHistory: {
                    enabled: !!checked,
                    height: template.socialHistory?.height ?? "1/12",
                  },
                })
              }
            />
            <span>Social History</span>
            {template.socialHistory?.enabled && (
              <select
                value={template.socialHistory?.height ?? "1/12"}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    socialHistory: {
                      enabled: true,
                      height: e.target.value as "1/12" | "1/6" | "1/4" | "1/3",
                    },
                  })
                }
                className="ml-2 border rounded"
              >
                <option value="1/12">1/12</option>
                <option value="1/6">1/6</option>
                <option value="1/4">1/4</option>
                <option value="1/3">1/3</option>
              </select>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Document lifestyle factors, occupation, and habits. Adjust height
            based on detail needed.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.familyHistory?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  familyHistory: {
                    enabled: !!checked,
                    height: template.familyHistory?.height ?? "1/12",
                  },
                })
              }
            />
            <span>Family History</span>
            {template.familyHistory?.enabled && (
              <select
                value={template.familyHistory?.height ?? "1/12"}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    familyHistory: {
                      enabled: true,
                      height: e.target.value as "1/12" | "1/6" | "1/4" | "1/3",
                    },
                  })
                }
                className="ml-2 border rounded"
              >
                <option value="1/12">1/12</option>
                <option value="1/6">1/6</option>
                <option value="1/4">1/4</option>
                <option value="1/3">1/3</option>
              </select>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Record relevant family medical history. Adjust height based on
            complexity of family history.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.allergies?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  allergies: {
                    enabled: !!checked,
                    height: template.allergies?.height ?? "1/12",
                  },
                })
              }
            />
            <span>Allergies</span>
            {template.allergies?.enabled && (
              <select
                value={template.allergies?.height ?? "1/12"}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    allergies: {
                      enabled: true,
                      height: e.target.value as "1/12" | "1/6" | "1/4" | "1/3",
                    },
                  })
                }
                className="ml-2 border rounded"
              >
                <option value="1/12">1/12</option>
                <option value="1/6">1/6</option>
                <option value="1/4">1/4</option>
                <option value="1/3">1/3</option>
              </select>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-6">
            List patient allergies and reactions. Adjust height based on number
            of allergies.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.surgicalHistory?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  surgicalHistory: {
                    enabled: !!checked,
                    height: template.surgicalHistory?.height ?? "1/12",
                  },
                })
              }
            />
            <span>Surgical History</span>
            {template.surgicalHistory?.enabled && (
              <select
                value={template.surgicalHistory?.height ?? "1/12"}
                onChange={(e) =>
                  setTemplate({
                    ...template,
                    surgicalHistory: {
                      enabled: true,
                      height: e.target.value as "1/12" | "1/6" | "1/4" | "1/3",
                    },
                  })
                }
                className="ml-2 border rounded"
              >
                <option value="1/12">1/12</option>
                <option value="1/6">1/6</option>
                <option value="1/4">1/4</option>
                <option value="1/3">1/3</option>
              </select>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Document past surgeries and procedures. Adjust height based on
            surgical history complexity.
          </p>
        </div>
      </div>
    </div>
  );

  const renderClinicalData = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.physicalExam?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  physicalExam: {
                    enabled: !!checked,
                    sections: template.physicalExam?.sections ?? [
                      "HEENT",
                      "Skin",
                      "CVS",
                      "Pulm",
                      "GI",
                      "MSK",
                      "Neuro",
                      "Lines",
                    ],
                  },
                })
              }
            />
            <span>Physical Exam</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Customize physical exam sections to match your specialty and
            workflow.
          </p>
          {template.physicalExam?.enabled && (
            <div className="ml-6 mt-2 space-y-2">
              <label className="block text-sm font-medium">Sections</label>
              <div className="space-y-2">
                {template.physicalExam?.sections.map((section, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={section}
                      onChange={(e) => {
                        const newSections = [
                          ...template.physicalExam!.sections,
                        ];
                        newSections[index] = e.target.value;
                        setTemplate({
                          ...template,
                          physicalExam: {
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
                        const newSections =
                          template.physicalExam!.sections.filter(
                            (_, i) => i !== index
                          );
                        setTemplate({
                          ...template,
                          physicalExam: {
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
                    const newSections = [
                      ...template.physicalExam!.sections,
                      "",
                    ];
                    setTemplate({
                      ...template,
                      physicalExam: {
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
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.vitals?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  vitals: {
                    enabled: !!checked,
                    sections: template.vitals?.sections ?? [
                      "Temp",
                      "Sys",
                      "Dias",
                      "RR",
                      "HR",
                      "SpO2",
                    ],
                  },
                })
              }
            />
            <span>Vitals</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Track vital signs. Customize which vitals to display based on
            patient care setting.
          </p>
          {template.vitals?.enabled && (
            <div className="ml-6 mt-2 space-y-2">
              <label className="block text-sm font-medium">Sections</label>
              <div className="space-y-2">
                {template.vitals?.sections.map((section, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={section}
                      onChange={(e) => {
                        const newSections = [...template.vitals!.sections];
                        newSections[index] = e.target.value;
                        setTemplate({
                          ...template,
                          vitals: {
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
                        const newSections = template.vitals!.sections.filter(
                          (_, i) => i !== index
                        );
                        setTemplate({
                          ...template,
                          vitals: {
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
                    const newSections = [...template.vitals!.sections, ""];
                    setTemplate({
                      ...template,
                      vitals: {
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
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.labs?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  labs: {
                    enabled: !!checked,
                    fullWidth: template.labs?.fullWidth ?? false,
                  },
                })
              }
            />
            <span>Labs</span>
            {template.labs?.enabled && (
              <>
                <Checkbox
                  checked={template.labs?.fullWidth}
                  onCheckedChange={(checked) =>
                    setTemplate({
                      ...template,
                      labs: {
                        enabled: true,
                        fullWidth: !!checked,
                      },
                    })
                  }
                />
                <span>Full Width</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Display laboratory results. Full width option allows for more
            detailed lab values and trending.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.meds?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  meds: { enabled: !!checked },
                })
              }
            />
            <span>Medications</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            List current medications, including dosage and frequency.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.consults?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  consults: { enabled: !!checked },
                })
              }
            />
            <span>Consults</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Track specialty consultations and their recommendations.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.imaging?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  imaging: { enabled: !!checked },
                })
              }
            />
            <span>Imaging</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Document imaging studies and their results.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.micro?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  micro: { enabled: !!checked },
                })
              }
            />
            <span>Micro</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Track microbiology results and cultures.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.ap?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  ap: {
                    enabled: !!checked,
                    systemsBased: template.ap?.systemsBased ?? false,
                    systems: template.ap?.systems ?? [],
                    enableMisc: template.ap?.enableMisc ?? false,
                  },
                })
              }
            />
            <span>Assessment & Plan</span>
            {template.ap?.enabled && (
              <>
                <Checkbox
                  checked={template.ap?.systemsBased}
                  onCheckedChange={(checked) =>
                    setTemplate({
                      ...template,
                      ap: {
                        enabled: true,
                        systemsBased: !!checked,
                        systems: template.ap?.systems ?? [],
                        enableMisc: template.ap?.enableMisc ?? false,
                      },
                    })
                  }
                />
                <span>Systems Based</span>
                <Checkbox
                  checked={template.ap?.enableMisc}
                  onCheckedChange={(checked) =>
                    setTemplate({
                      ...template,
                      ap: {
                        enabled: true,
                        systemsBased: template.ap?.systemsBased ?? false,
                        systems: template.ap?.systems ?? [],
                        enableMisc: !!checked,
                      },
                    })
                  }
                />
                <span>Enable Misc</span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Organize assessments by problem or by system. Systems-based option
            helps organize complex patients by organ system.
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={template.todo?.enabled}
              onCheckedChange={(checked) =>
                setTemplate({
                  ...template,
                  todo: { enabled: !!checked },
                })
              }
            />
            <span>Daily Todo</span>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Create a default checklist of daily tasks. These tasks will appear
            for each new patient using this template.
          </p>
        </div>
      </div>
    </div>
  );

  const renderReview = () => {
    // Helper type guard
    const isTemplateSection = (value: unknown): value is BaseSection => {
      return typeof value === "object" && value !== null && "enabled" in value;
    };

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Basic Information</h3>
          <div className="mt-2 space-y-2">
            <p>
              <strong>Name:</strong> {template.templateName}
            </p>
            <p>
              <strong>Description:</strong> {template.description}
            </p>
            <p>
              <strong>Patients Per Page:</strong> {template.patientsPerPage}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">Enabled Sections</h3>
          <div className="mt-2 space-y-1">
            {Object.entries(template)
              .filter(([, value]) => isTemplateSection(value))
              .map(([sectionKey, value]) => {
                if (!isTemplateSection(value)) return null;
                return (
                  <div key={sectionKey} className="flex items-center gap-2">
                    <span className="text-sm">
                      {sectionKey.charAt(0).toUpperCase() +
                        sectionKey.slice(1).replace(/([A-Z])/g, " $1")}
                      :
                    </span>
                    <span className="text-sm text-gray-600">
                      {value.enabled ? "✓" : "✗"}
                      {"height" in value && value.height
                        ? ` (${value.height})`
                        : ""}
                      {"fullWidth" in value && value.fullWidth
                        ? " (Full Width)"
                        : ""}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <AppHeader>
        <BreadcrumbItem>
          <BreadcrumbLink href="/template-config">
            Template Configuration
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Create Template</BreadcrumbPage>
        </BreadcrumbItem>
      </AppHeader>

      <div className="p-6">
        <div className="mb-8">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        <div className="space-y-6">
          {currentStep === 0 && renderBasicInfo()}
          {currentStep === 1 && renderCoreSections()}
          {currentStep === 2 && renderClinicalData()}
          {currentStep === 3 && renderReview()}

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext}>Next</Button>
            ) : (
              <Button onClick={handleSave}>Create Template</Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function generateTemplateId(templateName: string): string {
  const baseId = templateName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const randomChars = Math.random().toString(36).substring(2, 8);
  return `custom_${baseId}_${randomChars}`;
}
