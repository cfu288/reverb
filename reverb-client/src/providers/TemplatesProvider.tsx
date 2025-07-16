import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { DisplayTemplate } from "@/models/DisplayTemplate";
import { display_templates } from "@/const";
import { getStorage } from "@/storage/StorageAPI";

export type TemplateState = "LOADING" | "ERROR" | "READY";

interface TemplatesContextType {
  defaultTemplates: DisplayTemplate[];
  customTemplates: DisplayTemplate[];
  allTemplates: DisplayTemplate[];
  getTemplate: (templateId: string) => DisplayTemplate | undefined;
  updateTemplate: (template: DisplayTemplate) => Promise<void>;
  addTemplate: (template: DisplayTemplate) => Promise<void>;
  deleteTemplate: (templateId: string) => Promise<void>;
  state: TemplateState;
  error: string | null;
}

const TemplatesContext = createContext<TemplatesContextType | null>(null);

const CUSTOM_TEMPLATES_KEY = "custom_templates";

export function TemplatesProvider({ children }: { children: React.ReactNode }) {
  const [customTemplates, setCustomTemplates] = useState<DisplayTemplate[]>([]);
  const [state, setState] = useState<TemplateState>("LOADING");
  const [error, setError] = useState<string | null>(null);

  const loadCustomTemplates = useCallback(async () => {
    try {
      setState("LOADING");
      const storage = await getStorage();
      const stored = await storage.read<DisplayTemplate[]>(
        CUSTOM_TEMPLATES_KEY
      );
      if (stored) {
        setCustomTemplates(stored);
      } else {
        await storage.write(CUSTOM_TEMPLATES_KEY, []);
        setCustomTemplates([]);
      }
      setState("READY");
    } catch (err) {
      setState("ERROR");
      const message =
        err instanceof Error ? err.message : "Failed to load templates";
      setError(message);
    }
  }, []);

  useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  const saveCustomTemplates = async (templates: DisplayTemplate[]) => {
    try {
      const storage = await getStorage();
      await storage.write(CUSTOM_TEMPLATES_KEY, templates);
      setCustomTemplates(templates);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save templates";
      setError(message);
      throw new Error(message);
    }
  };

  const updateTemplate = useCallback(
    async (template: DisplayTemplate) => {
      if (state !== "READY") {
        throw new Error("Templates not loaded");
      }
      const updatedTemplates = customTemplates.map((t) =>
        t.templateId === template.templateId ? template : t
      );
      await saveCustomTemplates(updatedTemplates);
    },
    [customTemplates, state]
  );

  const addTemplate = useCallback(
    async (template: DisplayTemplate) => {
      if (state !== "READY") {
        throw new Error("Templates not loaded");
      }
      const updatedTemplates = [...customTemplates, template];
      await saveCustomTemplates(updatedTemplates);
    },
    [customTemplates, state]
  );

  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (state !== "READY") {
        throw new Error("Templates not loaded");
      }
      const updatedTemplates = customTemplates.filter(
        (t) => t.templateId !== templateId
      );
      await saveCustomTemplates(updatedTemplates);
    },
    [customTemplates, state]
  );

  const getTemplate = useCallback(
    (templateId: string): DisplayTemplate | undefined => {
      if (state !== "READY") {
        return undefined;
      }
      const customTemplate = customTemplates.find(
        (t) => t.templateId === templateId
      );
      if (customTemplate) {
        return customTemplate;
      }
      return display_templates.find((t) => t.templateId === templateId);
    },
    [customTemplates, state]
  );

  const value = {
    defaultTemplates: display_templates,
    customTemplates,
    allTemplates: [...display_templates, ...customTemplates],
    getTemplate,
    updateTemplate,
    addTemplate,
    deleteTemplate,
    state,
    error,
  };

  return (
    <TemplatesContext.Provider value={value}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplatesContext);
  if (!context) {
    throw new Error("useTemplates must be used within a TemplatesProvider");
  }
  return context;
}
