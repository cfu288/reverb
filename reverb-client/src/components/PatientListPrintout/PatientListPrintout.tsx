import { Page, View, Text } from "@react-pdf/renderer";
import { PatientRow } from "./PatientRow/PatientRow";
import { Document, StyleSheet } from "@react-pdf/renderer";
import { Patient } from "../../models/Patient";
import { useMemo } from "react";
import { useTemplates } from "@/providers/TemplatesProvider";

const documentStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    width: "8in",
    height: "11.5in",
    fontSize: "8px",
    padding: "0.13in",
    fontFamily: "Atkinson",
    fontWeight: "normal",
    display: "flex",
  },
});

export const PatientListPrintout = ({
  patients,
  templateId,
}: {
  patients: Patient[];
  templateId: string;
}) => {
  const { getTemplate } = useTemplates();

  const ACTUAL_PATIENTS_PER_PAGE = useMemo(() => {
    const result: Patient[][] = [];
    let currentPage: Patient[] = [];
    const baseTemplate =
      getTemplate(templateId) || getTemplate("3_pt_floor_template");
    if (!baseTemplate) return [];
    let remainingSpace: number = baseTemplate.patientsPerPage;

    for (const patient of patients) {
      const patientTemplate = patient.display_template_overrides
        ? getTemplate(templateId) || getTemplate("3_pt_floor_template")
        : baseTemplate;
      if (!patientTemplate) continue;
      const size: number = patientTemplate.displaySize === "2x" ? 2 : 1;

      if (remainingSpace >= size) {
        currentPage.push(patient);
        remainingSpace -= size;
      } else {
        result.push(currentPage);
        currentPage = [patient];
        remainingSpace = baseTemplate.patientsPerPage - size;
      }
    }

    if (currentPage.length > 0) {
      result.push(currentPage);
    }

    return result;
  }, [templateId, patients, getTemplate]);

  const totalPatients = patients.length;
  const patientsPerPage =
    ACTUAL_PATIENTS_PER_PAGE.length > 0
      ? ACTUAL_PATIENTS_PER_PAGE[0].length
      : 0;
  const totalPages = Math.ceil(totalPatients / patientsPerPage);

  const instanceToReturn = useMemo(() => {
    const template =
      getTemplate(templateId) || getTemplate("3_pt_floor_template");
    const documentTitle = template?.templateName || "ScutSheet";

    return (
      <Document title={documentTitle}>
        {ACTUAL_PATIENTS_PER_PAGE.map((patients, pageIndex) => (
          <Page key={pageIndex} size={"LETTER"} style={documentStyles.page}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
              }}
            >
              {patients.map((patient, index) => (
                <PatientRow
                  key={`${pageIndex}-${index}`}
                  patient={patient}
                  pageIndex={pageIndex}
                  index={index}
                  templateId={templateId}
                />
              ))}
            </View>
            <View
              style={{
                flex: 1,
                minHeight: "12px",
                display: "flex",
                flexDirection: "row",
              }}
            >
              <Text style={{ textAlign: "left", flex: 1 }}></Text>
              <Text style={{ textAlign: "center", flex: 1 }}>
                Page {pageIndex + 1}/{totalPages}
              </Text>
              <Text style={{ textAlign: "right", flex: 1 }}>
                {new Date().toLocaleString()}
              </Text>
            </View>
          </Page>
        ))}
      </Document>
    );
  }, [templateId, ACTUAL_PATIENTS_PER_PAGE, totalPages, getTemplate]);

  return instanceToReturn;
};
