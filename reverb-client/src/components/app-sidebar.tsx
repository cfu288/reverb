import * as React from "react";
import { GalleryVerticalEnd, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/providers/TemplatesProvider";
import { ConfirmDialog } from "./ConfirmDialog";
import { NavUser } from "@/components/NavUser";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useParams, useLocation, Link } from "react-router-dom";
import { usePatientList } from "@/providers/usePatientList";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { templateId } = useParams();
  const location = useLocation();
  const {
    currentListName,
    setCurrentListName,
    allListNames,
    isNewListModalOpen,
    setIsNewListModalOpen,
    newListName,
    setNewListName,
    handleNewListSubmit,
    state: patientListState,
    error: patientListError,
  } = usePatientList();

  const {
    allTemplates,
    deleteTemplate,
    state: templateState,
    error: templateError,
  } = useTemplates();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [templateToDelete, setTemplateToDelete] = React.useState<string | null>(
    null
  );
  const [editingListName, setEditingListName] = React.useState<string | null>(
    null
  );
  const [newEditedName, setNewEditedName] = React.useState("");

  const handleDeleteClick = (templateId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTemplateToDelete(templateId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (templateToDelete) {
      await deleteTemplate(templateToDelete);
      setIsDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleStartEditingList = (name: string) => {
    setEditingListName(name);
    setNewEditedName(name);
  };

  const handleSaveListName = async () => {
    if (
      !editingListName ||
      !newEditedName.trim() ||
      newEditedName === editingListName
    ) {
      setEditingListName(null);
      return;
    }

    if (allListNames.includes(newEditedName)) {
      alert("A list with this name already exists");
      return;
    }

    try {
      // Update the list name
      setCurrentListName(newEditedName, editingListName);
      setEditingListName(null);
    } catch {
      alert("Failed to update list name");
    }
  };

  if (templateState === "LOADING" || patientListState === "LOADING") {
    return (
      <Sidebar variant="floating" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </SidebarHeader>
      </Sidebar>
    );
  }

  if (templateState === "ERROR" || patientListState === "ERROR") {
    return (
      <Sidebar variant="floating" {...props}>
        <SidebarHeader>
          <div className="flex items-center justify-center h-32">
            <div className="text-red-500 text-sm">
              Error loading: {templateError || patientListError}
            </div>
          </div>
        </SidebarHeader>
      </Sidebar>
    );
  }

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">ReverbMD</span>
                  <span className="">Scutsheets</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/">Home</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link
                  to={`/scutsheet/${allTemplates[0].templateId}`}
                  className="font-medium"
                >
                  Scutsheet
                </Link>
              </SidebarMenuButton>
              <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                {allTemplates.map((template) => (
                  <SidebarMenuSubItem key={template.templateId}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={template.templateId === templateId}
                      className="flex items-center justify-between"
                    >
                      <Link
                        to={`/scutsheet/${template.templateId}`}
                        className="font-medium w-full flex items-center justify-between"
                      >
                        <span>{template.templateName}</span>
                        {template.templateId.startsWith("custom_") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) =>
                              handleDeleteClick(template.templateId, e)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/scutsheet/generate-pdf" className="font-medium">
                  Patient Lists
                </Link>
              </SidebarMenuButton>
              <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                {allListNames.map((name) => (
                  <SidebarMenuSubItem
                    key={name}
                    className={
                      location.pathname === "/scutsheet/generate-pdf" &&
                      name === currentListName
                        ? "bg-accent"
                        : ""
                    }
                  >
                    <SidebarMenuSubButton
                      isActive={name === currentListName}
                      onClick={() => setCurrentListName(name)}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between w-full">
                        {editingListName === name ? (
                          <div className="flex items-center gap-2 w-full">
                            <Input
                              value={newEditedName}
                              onChange={(e) => setNewEditedName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveListName();
                                } else if (e.key === "Escape") {
                                  setEditingListName(null);
                                }
                              }}
                              className="h-6 text-sm"
                              autoFocus
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={handleSaveListName}
                            >
                              ✓
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingListName(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <Link
                              to={`/scutsheet/generate-pdf`}
                              className="flex items-center gap-2"
                            >
                              <span>{name}</span>
                              {name === "Example Patients" && (
                                <span className="text-xs text-muted-foreground">
                                  (Read-only)
                                </span>
                              )}
                            </Link>
                            {location.pathname === "/scutsheet/generate-pdf" &&
                              name === currentListName &&
                              name !== "Example Patients" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleStartEditingList(name);
                                  }}
                                >
                                  ✎
                                </Button>
                              )}
                          </div>
                        )}
                      </div>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton
                    onClick={() => setIsNewListModalOpen(true)}
                  >
                    + New List
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link to="/template-config" className="font-medium">
                  Template Configuration
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <Dialog open={isNewListModalOpen} onOpenChange={setIsNewListModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Enter a name for your new patient list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Enter list name"
            />
            <Button
              onClick={handleNewListSubmit}
              disabled={!newListName || allListNames.includes(newListName)}
            >
              Create List
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setTemplateToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
      />
    </Sidebar>
  );
}
