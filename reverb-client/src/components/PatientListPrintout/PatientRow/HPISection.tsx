import { HPISectionProps } from "./PatientRow";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { useTemplates } from "@/providers/TemplatesProvider";

const patientRowStyles = StyleSheet.create({
  apText: {
    padding: "2px",
    fontWeight: 700,
  },
  hpiLineText: {
    padding: "10px",
    margin: "10px",
    fontStyle: "italic",

    fontWeight: 400,
  },
  gridBox2FullWidth: {
    width: "100%",
    minHeight: "16.67%",
    maxHeight: "50%",
  },
  gridBox3FullWidth: {
    width: "100%",
    minHeight: "25%",
    maxHeight: "50%",
  },
  hpiLabelText: {
    padding: "2px",
    fontWeight: 700,
    borderBottom: "0.5px dashed grey",
    width: "97.5%",
  },
  blankUnderline: {
    marginHorizontal: "auto",
    color: "#333",
    borderBottom: "0.5px dashed grey",
    width: "95%",
    height: "10px",
    marginBottom: "2px",
  },
});

export const HPISection: React.FC<HPISectionProps> = ({
  patient,
  templateId,
}) => {
  const { getTemplate } = useTemplates();
  const template =
    getTemplate(templateId) || getTemplate("3_pt_floor_template");
  if (!template) return null;

  const blankLines = template.hpi?.blankLines || 10;

  return (
    <>
      {template.hpi?.enabled && (
        <>
          {patient.hpi && patient.hpi.length > 0 ? (
            <>
              <Text style={patientRowStyles.apText}>
                HPI:{" "}
                <View>
                  {patient.hpi && (
                    <Text style={patientRowStyles.hpiLineText}>
                      {patient.hpi}
                    </Text>
                  )}
                </View>
              </Text>
            </>
          ) : (
            <View style={patientRowStyles.gridBox2FullWidth}>
              <Text style={patientRowStyles.hpiLabelText}>HPI:</Text>
              {Array.from({ length: blankLines }).map((_, i) => (
                <View
                  key={`blank-${i}`}
                  style={patientRowStyles.blankUnderline}
                ></View>
              ))}
            </View>
          )}
        </>
      )}
    </>
  );
};
