import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AssessmentAndPlanItem, Patient } from "../models/Patient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Todo } from "@/models/Todo";
import { ModalContent } from "./ShowPDF";
import { DisplayTemplate } from "@/models/DisplayTemplate";
import { useNavigate } from "react-router-dom";
import { useTemplates } from "@/providers/TemplatesProvider";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { BreadcrumbItem, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { usePatientList } from "@/providers/usePatientList";
import { AppHeader } from "@/components/AppHeader";

type PatientValue =
  | string
  | string[]
  | AssessmentAndPlanItem[]
  | Todo[]
  | Partial<DisplayTemplate>[];

export const GeneratePDF = () => {
  const {
    currentListName,
    patients,
    setPatients,
    findPatientById,
    updatePatientById,
    state: patientListState,
    error: patientListError,
  } = usePatientList();

  const {
    allTemplates,
    state: templateState,
    error: templateError,
  } = useTemplates();

  const [modalContent, setModalContent] = useState<ModalContent>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] =
    useState<boolean>(false);
  const [currentPatientId, setCurrentPatientId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    allTemplates[0]?.templateId || ""
  );
  const navigate = useNavigate();

  if (templateState === "LOADING" || patientListState === "LOADING") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (templateState === "ERROR" || patientListState === "ERROR") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500 text-sm">
          Error loading: {templateError || patientListError}
        </div>
      </div>
    );
  }

  const openModal = (id: string, content: ModalContent) => {
    setCurrentPatientId(id);
    setModalContent(content);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const handleGeneratePDFClick = () => {
    if (!selectedTemplateId) {
      console.error("Invalid template selected");
      return;
    }
    navigate(`/scutsheet/${selectedTemplateId}`);
  };

  const addItem = (key: keyof Patient) => {
    const currentPatient = findPatientById(currentPatientId);
    if (currentPatient) {
      let newItem: string | AssessmentAndPlanItem;
      let updatedValue: string[] | AssessmentAndPlanItem[];

      if (key === "assessment_and_plan") {
        const template = allTemplates.find(
          (t) => t.templateId === selectedTemplateId
        );
        if (template?.ap?.systemsBased) {
          return;
        }
        newItem = { assessment: "", plan: [""] } as AssessmentAndPlanItem;
        updatedValue = [
          ...((currentPatient[key] as AssessmentAndPlanItem[]) || []),
          newItem,
        ];
      } else {
        newItem = "";
        updatedValue = [...((currentPatient[key] as string[]) || []), newItem];
      }

      updatePatientById(currentPatientId, { [key]: updatedValue });
    }
  };

  const removeItem = (key: keyof Patient, itemIndex: number) => {
    const currentPatient = findPatientById(currentPatientId);
    if (currentPatient) {
      const updatedValue = (
        (currentPatient[key] as (
          | string
          | AssessmentAndPlanItem
          | Todo
          | Partial<DisplayTemplate>
        )[]) || []
      ).filter((_, i) => i !== itemIndex);
      updatePatientById(currentPatientId, { [key]: updatedValue });
    }
  };

  const openAddPatientModal = () => {
    setIsAddPatientModalOpen(true);
  };

  const closeAddPatientModal = () => {
    setIsAddPatientModalOpen(false);
  };

  const handleAddPatient = (data: Patient) => {
    setPatients((prevPatients) => [...prevPatients, data]);
    closeAddPatientModal();
  };

  return (
    <>
      <AppHeader>
        <BreadcrumbItem>
          <BreadcrumbPage>Patient Lists</BreadcrumbPage>
        </BreadcrumbItem>
      </AppHeader>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              Patient List: {currentListName}
            </h1>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="border rounded p-2"
            >
              <optgroup label="Default Templates">
                {allTemplates
                  .filter(
                    (t: DisplayTemplate) => !t.templateId.startsWith("custom_")
                  )
                  .map((template) => (
                    <option
                      key={template.templateId}
                      value={template.templateId}
                    >
                      {template.templateName}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Custom Templates">
                {allTemplates
                  .filter((t: DisplayTemplate) =>
                    t.templateId.startsWith("custom_")
                  )
                  .map((template) => (
                    <option
                      key={template.templateId}
                      value={template.templateId}
                    >
                      {template.templateName}
                    </option>
                  ))}
              </optgroup>
            </select>
            <Button onClick={handleGeneratePDFClick}>Generate PDF</Button>
          </div>
          <Button onClick={openAddPatientModal}>Add Patient</Button>
        </div>
        <div className="border rounded-b-md border-gray-400">
          <table className="min-w-full">
            <thead>
              <tr>
                {[
                  "Patient Identifiers",
                  "Location",
                  "One Liner",
                  "HPI",
                  "Todos",
                  "Assessment and Plan",
                ].map((header, index) => (
                  <th key={`header-${index}`} className="px-4 py-2">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patients.map((patient: Patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  openModal={openModal}
                  updatePatient={(key: keyof Patient, value: PatientValue) => {
                    updatePatientById(patient.id, { [key]: value });
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {modalContent === "todos"
                ? "Edit Todos"
                : modalContent === "assessment_and_plan"
                ? "Edit Assessment and Plan"
                : modalContent === "hpi"
                ? "Edit HPI"
                : "Edit Details"}
            </DialogTitle>
          </DialogHeader>
          <ModalContentComponent
            modalContent={modalContent}
            patients={patients}
            currentPatientId={currentPatientId}
            updatePatient={(key, value) =>
              updatePatientById(currentPatientId, { [key]: value })
            }
            addItem={addItem}
            removeItem={removeItem}
            selectedTemplateId={selectedTemplateId}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isAddPatientModalOpen} onOpenChange={setIsAddPatientModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <AddPatientForm onSubmit={handleAddPatient} />
        </DialogContent>
      </Dialog>
    </>
  );
};

const PatientRow = ({
  patient,
  openModal,
  updatePatient,
}: {
  patient: Patient;
  openModal: (id: string, content: ModalContent) => void;
  updatePatient: (key: keyof Patient, value: PatientValue) => void;
}) => {
  const handleChange = (key: keyof Patient, value: PatientValue) => {
    updatePatient(key, value);
  };

  return (
    <tr>
      <td className="border px-2 py-2">
        <div className="flex flex-col">
          <Input
            type="text"
            value={patient.last_name || ""}
            onChange={(e) => handleChange("last_name", e.target.value)}
            className="w-full mb-2 h-min px-3 py-0 uppercase"
            placeholder="Last Name"
          />
          <Input
            type="text"
            value={patient.first_name || ""}
            onChange={(e) => handleChange("first_name", e.target.value)}
            className="w-full mb-2 h-min px-3 py-0"
            placeholder="First Name"
          />
          <Input
            type="text"
            value={patient.dob || ""}
            onChange={(e) => handleChange("dob", e.target.value)}
            className="w-full mb-2 h-min px-3 py-0"
            placeholder="Date of Birth"
          />
          <Input
            type="text"
            value={patient.mrn || ""}
            onChange={(e) => handleChange("mrn", e.target.value)}
            className="w-full mb-2 h-min px-3 py-0"
            placeholder="MRN"
          />
        </div>
      </td>
      <td className="border px-2 py-2">
        <Input
          type="text"
          value={patient.location || ""}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="Location"
        />
      </td>
      <td className="border p-2 min-w-96">
        <Textarea
          value={patient.one_liner || ""}
          onChange={(e) => handleChange("one_liner", e.target.value)}
          className="w-full"
          placeholder="One Liner"
          rows={4}
        />
      </td>
      <td className="border px-2 relative">
        <div
          className="flex flex-col max-h-48 overflow-hidden hover:overflow-y-auto transition-height duration-300 ease-in-out text-ellipsis cursor-pointer text-sm"
          onClick={() => openModal(patient.id, "hpi")}
        >
          <div dangerouslySetInnerHTML={{ __html: patient.hpi || "" }} />
          <span className="absolute top-0 right-0 m-2">✏️</span>
        </div>
      </td>
      <td className="border px-4 py-2 relative">
        <ul className="flex flex-col max-h-48 overflow-hidden hover:overflow-y-auto transition-height duration-300 ease-in-out text-ellipsis cursor-pointer">
          {patient.todos?.map((todo, index) => (
            <li
              key={index}
              className={`${todo.status === "CLOSED" ? "line-through" : ""}`}
            >
              <div
                className="flex items-center cursor-pointer"
                onClick={() => {
                  const updatedTodos = patient.todos
                    ? patient.todos.map((t) =>
                        t.description === todo.description
                          ? {
                              ...t,
                              status:
                                todo.status === "CLOSED" ? "OPEN" : "CLOSED",
                            }
                          : t
                      )
                    : [];
                  handleChange("todos", updatedTodos);
                }}
              >
                <Checkbox
                  checked={todo.status === "CLOSED" || false}
                  onCheckedChange={(checked) => {
                    const updatedTodos = patient.todos
                      ? patient.todos.map((t) =>
                          t.description === todo.description
                            ? {
                                ...t,
                                status: checked ? "CLOSED" : "OPEN",
                              }
                            : t
                        )
                      : [];
                    handleChange("todos", updatedTodos);
                  }}
                  className="mr-2 pointer-events-none"
                />
                <span className="flex-grow">{todo.description}</span>
              </div>
            </li>
          ))}
        </ul>
        <span
          className="absolute top-0 right-0 m-2 cursor-pointer"
          onClick={() => openModal(patient.id, "todos")}
        >
          ✏️
        </span>
      </td>
      <td className="border px-4 py-2 relative">
        <ol className="list-decimal pl-5">
          {patient.assessment_and_plan?.map((ap, index) => (
            <li key={index} className="list-decimal">
              {ap.assessment}
            </li>
          ))}
        </ol>
        <span
          className="absolute top-0 right-0 m-2 cursor-pointer"
          onClick={() => openModal(patient.id, "assessment_and_plan")}
        >
          ✏️
        </span>
      </td>
    </tr>
  );
};

const ModalContentComponent = ({
  modalContent,
  patients,
  currentPatientId,
  updatePatient,
  addItem,
  removeItem,
  selectedTemplateId,
}: {
  modalContent: ModalContent;
  patients: Patient[];
  currentPatientId: string;
  updatePatient: (key: keyof Patient, value: PatientValue) => void;
  addItem: (key: keyof Patient) => void;
  removeItem: (key: keyof Patient, itemIndex: number) => void;
  selectedTemplateId: string;
}) => {
  const { allTemplates } = useTemplates();
  const currentPatient = patients.find((p) => p.id === currentPatientId);
  const template = allTemplates.find(
    (t: DisplayTemplate) => t.templateId === selectedTemplateId
  );
  const isSystemsBased = template?.ap?.systemsBased || false;
  const systems = template?.ap?.systems || [];

  if (!currentPatient) return null;

  const handleHpiChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updatePatient("hpi", e.target.value);
  };

  switch (modalContent) {
    case "hpi":
      return (
        <Textarea
          value={currentPatient.hpi || ""}
          onChange={handleHpiChange}
          className="w-full mb-2"
          rows={6}
        />
      );
    case "todos":
      return (
        <div>
          <ul>
            {(currentPatient.todos || []).map(
              (todo: { description: string }, i: number) => (
                <li key={`todo-${i}`} className="flex items-center mb-2">
                  <Input
                    type="text"
                    value={todo.description}
                    onChange={(e) =>
                      updatePatient(
                        "todos",
                        (currentPatient.todos?.map(
                          (t: { description: string }, j: number) =>
                            j === i
                              ? ({ description: e.target.value } as Todo)
                              : t
                        ) as Todo[]) || ([] as Todo[])
                      )
                    }
                    className="w-full mr-2"
                  />
                  <Button onClick={() => removeItem("todos", i)}>🗑️</Button>
                </li>
              )
            )}
          </ul>
          <Button onClick={() => addItem("todos")}>Add Todo</Button>
        </div>
      );
    case "assessment_and_plan":
      return (
        <div>
          {isSystemsBased ? (
            <div>
              {systems.map((system) => {
                const systemItems = (
                  currentPatient.assessment_and_plan || []
                ).filter((ap) => ap.category === system);

                return (
                  <div key={system} className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{system}</h3>
                      <Button
                        onClick={() => {
                          const newItem: AssessmentAndPlanItem = {
                            assessment: "",
                            plan: [""],
                            category: system,
                          };
                          const existingAP =
                            currentPatient.assessment_and_plan || [];
                          updatePatient("assessment_and_plan", [
                            ...existingAP,
                            newItem,
                          ]);
                        }}
                      >
                        Add {system} Item
                      </Button>
                    </div>
                    <ul>
                      {systemItems.map((ap, i) => (
                        <li
                          key={`${system}-${i}`}
                          className="flex flex-col mb-4"
                        >
                          <div className="flex items-center">
                            <Input
                              type="text"
                              value={ap.assessment}
                              onChange={(e) => {
                                const updatedAP =
                                  currentPatient.assessment_and_plan?.map(
                                    (item) =>
                                      item === ap
                                        ? {
                                            ...item,
                                            assessment: e.target.value,
                                          }
                                        : item
                                  ) || [];
                                updatePatient("assessment_and_plan", updatedAP);
                              }}
                              className="w-full mr-2"
                              placeholder={`${system} Assessment`}
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const updatedAP = (
                                  currentPatient.assessment_and_plan || []
                                ).filter((item) => item !== ap);
                                updatePatient("assessment_and_plan", updatedAP);
                              }}
                            >
                              🗑️
                            </Button>
                          </div>
                          <ul className="ml-4 mt-2">
                            {ap.plan.map((planItem, j) => (
                              <li
                                key={`plan-${i}-${j}`}
                                className="flex items-center mb-2"
                              >
                                <span className="mx-2">•</span>
                                <Input
                                  type="text"
                                  value={planItem}
                                  onChange={(e) => {
                                    const updatedAP =
                                      currentPatient.assessment_and_plan?.map(
                                        (item) =>
                                          item === ap
                                            ? {
                                                ...item,
                                                plan: item.plan.map((p, idx) =>
                                                  idx === j ? e.target.value : p
                                                ),
                                              }
                                            : item
                                      ) || [];
                                    updatePatient(
                                      "assessment_and_plan",
                                      updatedAP
                                    );
                                  }}
                                  className="w-full mr-2"
                                  placeholder="Plan item"
                                />
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    const updatedAP =
                                      currentPatient.assessment_and_plan?.map(
                                        (item) =>
                                          item === ap
                                            ? {
                                                ...item,
                                                plan: item.plan.filter(
                                                  (_, idx) => idx !== j
                                                ),
                                              }
                                            : item
                                      ) || [];
                                    updatePatient(
                                      "assessment_and_plan",
                                      updatedAP
                                    );
                                  }}
                                >
                                  🗑️
                                </Button>
                              </li>
                            ))}
                            <li className="flex items-center">
                              <span className="mx-2">•</span>
                              <Button
                                className="flex-grow"
                                variant="outline"
                                onClick={() => {
                                  const updatedAP =
                                    currentPatient.assessment_and_plan?.map(
                                      (item) =>
                                        item === ap
                                          ? {
                                              ...item,
                                              plan: [...item.plan, ""],
                                            }
                                          : item
                                    ) || [];
                                  updatePatient(
                                    "assessment_and_plan",
                                    updatedAP
                                  );
                                }}
                              >
                                Add Plan Item
                              </Button>
                            </li>
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <ul>
                {(currentPatient.assessment_and_plan || []).map(
                  (ap: { assessment: string; plan: string[] }, i: number) => (
                    <li
                      key={`assessment-and-plan-${i}`}
                      className={`flex flex-col mb-2 ${i !== 0 ? "mt-6" : ""}`}
                    >
                      <div className="flex items-center">
                        <span className="mr-2 font-bold">{i + 1}</span>
                        <Input
                          type="text"
                          value={ap.assessment}
                          onChange={(e) =>
                            updatePatient(
                              "assessment_and_plan",
                              (currentPatient.assessment_and_plan?.map(
                                (item, j) =>
                                  j === i
                                    ? { ...item, assessment: e.target.value }
                                    : item
                              ) as AssessmentAndPlanItem[]) || []
                            )
                          }
                          className="w-full mr-2"
                        />
                        <Button
                          onClick={() => removeItem("assessment_and_plan", i)}
                        >
                          🗑️
                        </Button>
                      </div>
                      <ul className="flex flex-col mt-2">
                        {ap.plan.map((planItem: string, j: number) => (
                          <li
                            key={`plan-${i}-${j}`}
                            className="flex items-center mb-2"
                          >
                            <span className="mx-2">•</span>
                            <Input
                              type="text"
                              value={planItem}
                              onChange={(e) =>
                                updatePatient(
                                  "assessment_and_plan",
                                  (currentPatient.assessment_and_plan?.map(
                                    (item, k) =>
                                      k === i
                                        ? {
                                            ...item,
                                            plan: item.plan.map((p, l) =>
                                              l === j ? e.target.value : p
                                            ),
                                          }
                                        : item
                                  ) as AssessmentAndPlanItem[]) || []
                                )
                              }
                              className="w-full mr-2"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                const newPlan = ap.plan.filter(
                                  (_: string, l: number) => l !== j
                                );
                                updatePatient(
                                  "assessment_and_plan",
                                  (currentPatient.assessment_and_plan?.map(
                                    (item, k) =>
                                      k === i
                                        ? { ...item, plan: newPlan }
                                        : item
                                  ) as AssessmentAndPlanItem[]) || []
                                );
                              }}
                            >
                              🗑️
                            </Button>
                          </li>
                        ))}
                        <li
                          key={`new-bullet-${i}`}
                          className="flex items-center"
                        >
                          <span className="mx-2">•</span>
                          <Button
                            className="flex-grow"
                            variant="outline"
                            onClick={() => {
                              const newPlan = [...ap.plan, ""];
                              updatePatient(
                                "assessment_and_plan",
                                (currentPatient.assessment_and_plan?.map(
                                  (item, k) =>
                                    k === i
                                      ? {
                                          ...item,
                                          plan: newPlan,
                                        }
                                      : item
                                ) as AssessmentAndPlanItem[]) || []
                              );
                            }}
                          >
                            Add Plan Item
                          </Button>
                        </li>
                      </ul>
                    </li>
                  )
                )}
              </ul>
              <Button onClick={() => addItem("assessment_and_plan")}>
                Add Assessment
              </Button>
            </div>
          )}
        </div>
      );
    default:
      return null;
  }
};

const AddPatientForm = ({
  onSubmit,
}: {
  onSubmit: (data: Patient) => void;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Patient>();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col mb-4">
        <Input
          {...register("first_name", { required: true })}
          placeholder="First Name"
          className="mb-2"
        />
        {errors.first_name && (
          <span className="text-red-500">First name is required</span>
        )}
        <Input
          {...register("last_name", { required: true })}
          placeholder="Last Name"
          className="mb-2"
        />
        {errors.last_name && (
          <span className="text-red-500">Last name is required</span>
        )}
        <Input
          {...register("dob", { required: true })}
          placeholder="Date of Birth"
          className="mb-2"
        />
        {errors.dob && (
          <span className="text-red-500">Date of birth is required</span>
        )}
        <Input
          {...register("mrn", { required: true })}
          placeholder="MRN"
          className="mb-2"
        />
        {errors.mrn && <span className="text-red-500">MRN is required</span>}
        <Input
          {...register("location")}
          placeholder="Location"
          className="mb-2"
        />
        <Input
          {...register("one_liner")}
          placeholder="One Liner"
          className="mb-2"
        />
      </div>
      <Button type="submit">Add Patient</Button>
    </form>
  );
};
