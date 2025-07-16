import { PatientListPrintout } from "@/components/PatientListPrintout/PatientListPrintout";
import { getDefaultTemplate } from "@/const";
import { Font, usePDF } from "@react-pdf/renderer";
import { useParams, useNavigate } from "react-router";
import source1 from "../assets/Atkinson-Hyperlegible-Regular.ttf";
import source2 from "../assets/Atkinson-Hyperlegible-Italic.ttf";
import source3 from "../assets/Atkinson-Hyperlegible-BoldItalic.ttf";
import source4 from "../assets/Atkinson-Hyperlegible-Bold.ttf";
import { usePatientList } from "@/providers/usePatientList";
import { TemplatesProvider } from "@/providers/TemplatesProvider";
import {
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Copy } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useTemplates } from "@/providers/TemplatesProvider";
import { AppHeader } from "@/components/AppHeader";

Font.register({
  family: "Atkinson",
  fonts: [
    { src: source1, fontWeight: "normal" },
    { src: source2, fontStyle: "italic" },
    { src: source3, fontStyle: "italic", fontWeight: 700 },
    { src: source4, fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => {
  return [word];
});

export const ShowPDF = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { deleteTemplate, getTemplate } = useTemplates();
  const template =
    getTemplate(templateId || "3_pt_floor_template") ||
    getDefaultTemplate({ template_id: "3_pt_floor_template" });
  const { state, patients, error } = usePatientList();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const document = useMemo(
    () =>
      state === "SUCCESS" ? (
        <TemplatesProvider>
          <PatientListPrintout
            patients={patients || []}
            templateId={templateId || "3_pt_floor_template"}
          />
        </TemplatesProvider>
      ) : (
        <></>
      ),
    [patients, state, templateId]
  );
  const [instance, update] = usePDF({
    document,
  });

  // Update PDF when template changes
  useEffect(() => {
    if (update && document) {
      update(document);
    }
  }, [templateId, update, document]);

  const handleDeleteTemplate = async () => {
    if (templateId) {
      await deleteTemplate(templateId);
      setIsDeleteDialogOpen(false);
      navigate("/scutsheet/3_pt_floor_template"); // Navigate to default template
    }
  };

  const handleCustomizeTemplate = () => {
    navigate("/template-config", {
      state: { templateToCustomize: template },
    });
  };

  // Handle loading and error states
  if (state === "LOADING") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (state === "ERROR") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error loading patient list: {error}</div>
      </div>
    );
  }

  return (
    <>
      <AppHeader
        rightContent={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCustomizeTemplate}
            >
              <Copy className="h-4 w-4 mr-2" />
              Customize Template
            </Button>
            {templateId?.startsWith("custom_") && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Template
              </Button>
            )}
          </>
        }
      >
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="#">Scutsheet</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{template.templateName}</BreadcrumbPage>
        </BreadcrumbItem>
      </AppHeader>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="w-full flex-grow bg-slate-100/50 rounded-xl">
          <iframe
            src={instance.url || ""}
            style={{
              width: "100%",
              height: "100%",
              margin: 0,
              border: "none",
            }}
            className="rounded-xl"
          />
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
};

export type ModalContent = "hpi" | "todos" | "assessment_and_plan" | null;
