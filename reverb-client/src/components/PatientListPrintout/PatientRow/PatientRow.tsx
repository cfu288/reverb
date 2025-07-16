import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Patient } from "@/models/Patient";
import { GridSection } from "./GridSection";
import { AssessmentAndPlan } from "./AssessmentAndPlan";
import { HPISection } from "./HPISection";
import { TodoSection } from "./TodoSection";
import { Banner } from "./Banner";
import { useTemplates } from "@/providers/TemplatesProvider";

export interface BannerProps {
  patient: Patient;
}

export interface HPISectionProps {
  patient: Patient;
  templateId: string;
}

export interface GridSectionProps {
  patient: Patient;
  templateId: string;
}

export interface AssessmentAndPlanProps {
  patient: Patient;
  templateId: string;
}

export interface TodoSectionProps {
  patient: Patient;
  templateId: string;
}

const patientRowStyles = StyleSheet.create({
  bannerBox: {
    flex: 1,
    backgroundColor: "white",
    borderBottom: "0.5px solid black",
    borderRight: "0.5px solid black",
    whiteSpace: "nowrap",
    padding: "2px",
  },
  splitBoxContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  },
  apText: {
    fontWeight: 700,
  },
  oneLinerText: {
    fontStyle: "italic",
    fontWeight: 400,
  },
  gridBoxText: {
    padding: "2px",
    paddingBottom: "0.5px",
    paddingTop: "3px",
    fontWeight: 700,
  },
  medsText: {
    paddingLeft: "2px",
    fontSize: "6px",
  },
  medsEmptyPlaceholder: {
    marginLeft: "2px",
    marginRight: "2px",
    borderBottom: "0.5px dotted grey",
    width: "100%",
  },
  leftBulletText: {
    paddingLeft: "2px",
    color: "#333",
    fontSize: "8px",
    listStyleType: "disc",
  },
  leftBulletTextUnderline: {
    paddingLeft: "2px",
    marginRight: "2px",
    marginLeft: "8px",
    color: "#333",
    fontSize: "8px",
    listStyleType: "disc",
    borderBottom: "0.5px dotted grey",
    width: "90%",
    height: "12px",
  },
  assessmentBlankUnderline: {
    borderBottom: "0.5px dotted grey",
    width: "95%",
  },
  smallBannerText: {
    fontSize: 3,
    textAlign: "left",
  },
});

interface PatientRowProps {
  patient: Patient;
  pageIndex: number;
  index: number;
  templateId: string;
}

export const PatientRow: React.FC<PatientRowProps> = ({
  patient,
  pageIndex,
  index,
  templateId,
}) => {
  const { getTemplate } = useTemplates();
  const template =
    getTemplate(templateId) || getTemplate("3_pt_floor_template");
  if (!template) return null;

  const isDoubleSize = template.displaySize === "2x";
  const heightPercentage = isDoubleSize
    ? (100 / template.patientsPerPage) * 2
    : 100 / template.patientsPerPage;

  return (
    <>
      <View
        key={`${pageIndex}-${index}-1`}
        style={{
          width: "50%",
          height: `${heightPercentage}%`,
          borderTop: "0.5px solid black",
          borderBottom: "0.5px solid black",
          borderLeft: "0.5px solid black",
          display: "flex",
          position: "relative",
          flexDirection: "column",
        }}
      >
        <Banner patient={patient} />
        <HPISection patient={patient} templateId={templateId} />
        <GridSection patient={patient} templateId={templateId} />
      </View>
      <View
        key={`${pageIndex}-${index}-2`}
        style={{
          width: "50%",
          height: `${heightPercentage}%`,
          borderTop: "0.5px solid black",
          borderBottom: "0.5px solid black",
          borderLeft: "0.5px solid black",
          borderRight: "0.5px solid black",
          display: "flex",
          position: "relative",
          flexDirection: "column",
        }}
      >
        <View style={patientRowStyles.splitBoxContainer}>
          <View
            style={{
              display: "flex",
            }}
          >
            <View
              style={{
                padding: "2px",
              }}
            >
              <Text>
                <Text style={patientRowStyles.apText}>A/P: </Text>
                <Text style={patientRowStyles.oneLinerText}>
                  {patient.one_liner && <>{patient.one_liner}</>}
                </Text>
              </Text>
            </View>
          </View>
          <AssessmentAndPlan patient={patient} templateId={templateId} />
          <TodoSection patient={patient} templateId={templateId} />
        </View>
      </View>
    </>
  );
};
