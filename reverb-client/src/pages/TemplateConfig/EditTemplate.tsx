import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DisplayTemplate } from "@/models/DisplayTemplate";
import {
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { TemplateForm } from "./components/TemplateForm";
import { StepIndicator, Step } from "@/components/ui/step-indicator";
import { AppHeader } from "@/components/AppHeader";
import { Trash2, Save } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTemplates } from "@/providers/TemplatesProvider";

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
    description: "Review and save changes",
  },
];

export function EditTemplate() {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const { getTemplate, updateTemplate, deleteTemplate, state } = useTemplates();
  const [currentStep, setCurrentStep] = useState(0);
  const [template, setTemplate] = useState<Partial<DisplayTemplate>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const loadTemplate = () => {
      if (state !== "READY") {
        return;
      }

      setIsLoading(true);
      const existingTemplate = getTemplate(templateId!);
      if (!existingTemplate) {
        alert("Template not found");
        navigate("/template-config");
        return;
      }
      setTemplate(existingTemplate);
      setIsLoading(false);
    };

    loadTemplate();
  }, [templateId, getTemplate, navigate, state]);

  if (isLoading || state === "LOADING") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

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
      const updatedTemplate = {
        ...template,
        templateId: templateId!,
      } as DisplayTemplate;

      await updateTemplate(updatedTemplate);
    } catch {
      alert("Failed to save template");
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      await deleteTemplate(templateId!);
      setIsDeleteDialogOpen(false);
    } catch {
      alert("Failed to delete template");
    }
  };

  const isCustomTemplate = templateId?.startsWith("custom_");

  return (
    <>
      <AppHeader
        rightContent={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            {isCustomTemplate && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </Button>
            )}
          </div>
        }
      >
        <BreadcrumbItem>
          <BreadcrumbLink href="/template-config">
            Template Configuration
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbPage>Edit Template</BreadcrumbPage>
        </BreadcrumbItem>
      </AppHeader>

      <div className="p-6">
        <div className="mb-8">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>

        <div className="space-y-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Basic Information</h2>
              <TemplateForm
                template={template}
                onTemplateChange={setTemplate}
                showBasicInfoOnly
              />
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Core Sections</h2>
              <TemplateForm
                template={template}
                onTemplateChange={setTemplate}
                showCoreSectionsOnly
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Clinical Data</h2>
              <TemplateForm
                template={template}
                onTemplateChange={setTemplate}
                showClinicalDataOnly
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Review Changes</h2>
              <TemplateForm
                template={template}
                onTemplateChange={setTemplate}
                readOnly
              />
            </div>
          )}

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
              <Button onClick={handleSave}>Save Changes</Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
      />
    </>
  );
}
