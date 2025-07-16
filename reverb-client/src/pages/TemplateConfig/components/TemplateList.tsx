import { Button } from "@/components/ui/button";
import { DisplayTemplate } from "@/models/DisplayTemplate";

interface TemplateListProps {
  templates: DisplayTemplate[];
  title: string;
  onEdit?: (template: DisplayTemplate) => void;
  onDelete?: (templateId: string) => void;
  onCustomize?: (template: DisplayTemplate) => void;
}

/**
 * Displays a list of templates with actions
 */
export const TemplateList: React.FC<TemplateListProps> = ({
  templates,
  title,
  onEdit,
  onDelete,
  onCustomize,
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.templateId}
            className="border rounded-lg p-4 bg-white dark:bg-gray-800"
          >
            <h3 className="font-medium">{template.templateName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {template.description}
            </p>
            <div className="mt-2 text-sm">
              <p>Patients per page: {template.patientsPerPage}</p>
            </div>
            <div className="mt-4 flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(template)}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(template.templateId)}
                >
                  Delete
                </Button>
              )}
              {onCustomize && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCustomize(template)}
                  className="w-full"
                >
                  Customize This Template
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
