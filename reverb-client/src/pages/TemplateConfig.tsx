import { Button } from "@/components/ui/button";
import { DisplayTemplate } from "@/models/DisplayTemplate";
import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useTemplates } from "@/providers/TemplatesProvider";
import { TemplateList } from "./TemplateConfig/components/TemplateList";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { Plus } from "lucide-react";

/**
 * Template configuration page component
 */
export const TemplateConfig = () => {
  const navigate = useNavigate();
  const { defaultTemplates, customTemplates, deleteTemplate, state, error } =
    useTemplates();

  const handleCreateTemplate = () => {
    navigate("/template-config/create");
  };

  const handleEditTemplate = (template: DisplayTemplate) => {
    navigate(`/template-config/edit/${template.templateId}`);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      try {
        await deleteTemplate(templateId);
      } catch {
        alert("Failed to delete template");
      }
    }
  };

  const handleCustomizeTemplate = (template: DisplayTemplate) => {
    navigate("/template-config/create", {
      state: { templateToCustomize: template },
    });
  };

  if (state === "LOADING") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (state === "ERROR") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-sm">
          Error loading templates: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <AppHeader
        rightContent={
          <Button onClick={handleCreateTemplate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create New Template
          </Button>
        }
      >
        <BreadcrumbItem>
          <BreadcrumbPage>Template Configuration</BreadcrumbPage>
        </BreadcrumbItem>
      </AppHeader>

      <div className="p-6">
        <div className="space-y-6">
          <TemplateList
            title="Default Templates"
            templates={defaultTemplates}
            onCustomize={handleCustomizeTemplate}
          />

          <TemplateList
            title="Custom Templates"
            templates={customTemplates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
          />
        </div>
      </div>
    </>
  );
};
