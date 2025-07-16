import { Button } from "@/components/ui/button";
import { DisplayTemplate } from "@/models/DisplayTemplate";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@radix-ui/react-separator";
import { useTemplates } from "@/providers/TemplatesProvider";
import { TemplateList } from "./components/TemplateList";
import { useNavigate } from "react-router-dom";

/**
 * Template configuration page component
 */
export const TemplateConfig = () => {
  const navigate = useNavigate();
  const { defaultTemplates, customTemplates, deleteTemplate } = useTemplates();

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

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "19rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Template Configuration</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Template Configuration</h1>
            <Button onClick={handleCreateTemplate}>Create New Template</Button>
          </div>

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
      </SidebarInset>
    </SidebarProvider>
  );
};
