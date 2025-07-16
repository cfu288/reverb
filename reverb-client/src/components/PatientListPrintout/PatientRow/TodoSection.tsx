import { View, Text } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";
import { Patient } from "../../../models/Patient";
import { useTemplates } from "@/providers/TemplatesProvider";

const todoStyles = StyleSheet.create({
  tempSmallContainer: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
  },
  todoFlexContainer: {
    padding: "2px",
    flex: 1,
    width: "100%",
  },
  todoText: {
    fontWeight: 700,
    width: "100%",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    display: "flex",
    flexDirection: "row",
    borderTop: "0.5px solid black",
    width: "100%",
    padding: "2px",
  },
  todoDescription: {
    paddingHorizontal: "2px",
    paddingVertical: "2px",
  },
  todoBlank: {
    paddingHorizontal: "2px",
    paddingVertical: "2px",
    borderBottom: "0.5px dotted grey",
    width: "100%",
  },
  dailyTodoDescription: {
    paddingRight: "8px",
  },
  todoContainer: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    // height: "40%",
    maxHeight: "50%",
    minHeight: "30%",
  },
  smallTodoContainer: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    maxHeight: "50%",
    minHeight: "20%",
  },
});

interface TodoSectionProps {
  patient: Patient;
  templateId: string;
}

export const TodoSection: React.FC<TodoSectionProps> = ({
  patient,
  templateId,
}) => {
  // return null;
  const { getTemplate } = useTemplates();
  const template =
    getTemplate(templateId) || getTemplate("3_pt_floor_template");
  if (!template) return null;

  const todosCount = patient.todos?.length || 0;
  const todoEnabled = template.todo?.enabled;
  const patientsPerPage = template.patientsPerPage;
  const displaySize = template.displaySize;
  const blankLinesCount = Math.max(
    0,
    (patientsPerPage === 1 || displaySize === "2x" ? 10 : 5) - todosCount
  );

  if (!todoEnabled) return null;

  return (
    <View
      style={
        // todoStyles.tempSmallContainer
        patientsPerPage === 1
          ? todoStyles.smallTodoContainer
          : todoStyles.todoContainer
      }
    >
      {todoEnabled && (
        <View style={todoStyles.todoFlexContainer}>
          <Text style={todoStyles.todoText}>Todo:</Text>
          {patient.todos?.map((todo, i) => (
            <View key={i}>
              <Text style={todoStyles.todoDescription}>
                [{"  "}] {todo.description}
              </Text>
            </View>
          ))}
          {Array.from({ length: blankLinesCount }).map((_, i) => (
            <View key={i}>
              <Text style={todoStyles.todoBlank}>[{"  "}]</Text>
            </View>
          ))}
        </View>
      )}
      {template.dailyTodoList && (
        <View style={todoStyles.footer}>
          {template.dailyTodoList?.map((todo, i) => (
            <View key={i}>
              <Text style={todoStyles.dailyTodoDescription}>
                [{"  "}] {todo.description}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
