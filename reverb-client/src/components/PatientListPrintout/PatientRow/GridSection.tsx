import { CMPFishbone } from "./Labs/CMPFishbone";
import { HHFishbone } from "./Labs/HHFishbone";
import { ReverseYFishbone } from "./Labs/ReverseYFishbone";
import { XFishbone } from "./Labs/XFishbone";
import { YFishbone } from "./Labs/YFishbone";
import { GridSectionProps } from "./PatientRow";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { useTemplates } from "@/providers/TemplatesProvider";
import { Lab, Vital } from "@/models/Patient";

const patientRowStyles = StyleSheet.create({
  bannerContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
  },
  bannerBox: {
    flex: 1,
    backgroundColor: "white",
    borderBottom: "0.5px solid black",
    borderRight: "0.5px solid black",
    whiteSpace: "nowrap",
    padding: "2px",
  },
  bannerBoxShrinkable: {
    backgroundColor: "white",
    borderBottom: "0.5px solid black",
    borderRight: "0.5px solid black",
    whiteSpace: "nowrap",
    padding: "2px",
    flexShrink: 1,
    minWidth: "30px",
    minHeight: "13px",
  },
  bannerBoxShrinkableLarge: {
    backgroundColor: "white",
    borderBottom: "0.5px solid black",
    borderRight: "0.5px solid black",
    whiteSpace: "nowrap",
    padding: "2px",
    flexShrink: 1,
    minWidth: "50px",
    minHeight: "13px",
  },
  bannerBoxShrinkableLargeRightNoBorder: {
    backgroundColor: "white",
    borderBottom: "0.5px solid black",
    whiteSpace: "nowrap",
    padding: "2px",
    flexShrink: 1,
    minWidth: "50px",
    minHeight: "13px",
  },
  eventsText: {
    padding: "2px",
    fontWeight: 700,
  },
  gridContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridBox1HalfWidth: {
    width: "50%",
    minHeight: "8.33%",
    maxHeight: "50%",
  },
  gridBox1FullWidth: {
    width: "100%",
    minHeight: "8.33%",
    maxHeight: "50%",
  },
  gridBox2HalfWidth: {
    width: "50%",
    minHeight: "16.67%",
    maxHeight: "50%",
  },
  gridBox2FullWidth: {
    width: "100%",
    minHeight: "16.67%",
    maxHeight: "50%",
  },
  gridBox3HalfWidth: {
    width: "50%",
    minHeight: "25%",
    maxHeight: "50%",
  },
  gridBox3FullWidth: {
    width: "100%",
    minHeight: "25%",
    maxHeight: "50%",
  },
  gridBox4HalfWidth: {
    width: "50%",
    minHeight: "33%",
    maxHeight: "50%",
  },
  gridBox4FullWidth: {
    width: "100%",
    minHeight: "33%",
    maxHeight: "50%",
  },
  labsGridBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-around",
  },
  gridBoxText: {
    padding: "2px",
    paddingBottom: "0.5px",
    paddingTop: "3px",
    fontWeight: 700,
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
  todoBlank: {
    paddingHorizontal: "2px",
    paddingVertical: "2px",
    borderBottom: "0.5px dotted grey",
    width: "100%",
  },
  todoContainer: {
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    height: "50%",
  },
  fishboneContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    justifyContent: "space-around",
  },
  fishboneSvg: {
    margin: "8px",
    marginVertical: "2px",
  },
  fishboneValueText: {
    fontSize: "6px",
  },
  peText: {
    paddingLeft: "2px",
  },
  medsText: {
    paddingLeft: "2px",
    fontSize: "6px",
    display: "flex",
    flexWrap: "wrap",
  },
  medsEmptyPlaceholder: {
    marginLeft: "2px",
    marginRight: "2px",
    borderBottom: "0.5px dotted grey",
    width: "100%",
  },
  smallBannerText: {
    fontSize: 3,
    textAlign: "left",
  },
  medsContainer: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  medsColumn: {
    width: "50%",
  },
});

export const GridSection: React.FC<GridSectionProps> = ({
  patient,
  templateId,
}) => {
  const { getTemplate } = useTemplates();
  const template =
    getTemplate(templateId) || getTemplate("3_pt_floor_template");
  if (!template) return null;

  // Extract lab values
  interface LabValueWithDate {
    value?: number;
    date?: string;
  }

  const findLabValue = (id: string): LabValueWithDate => {
    const matchingLabs = patient.labs?.filter((l) =>
      l.identifiers?.some((i) => i.id === id && i.system === "powerchart-touch")
    ) as Lab[] | undefined;

    if (!matchingLabs?.length) return {};

    // Sort by date descending and get the most recent
    const mostRecent = matchingLabs.sort(
      (a, b) =>
        new Date(b.effective_datetime).getTime() -
        new Date(a.effective_datetime).getTime()
    )[0];

    if (!("value_number" in mostRecent)) return {};

    return {
      value: mostRecent.value_number,
      date: new Date(mostRecent.effective_datetime).toLocaleDateString(
        "en-US",
        {
          month: "2-digit",
          day: "2-digit",
        }
      ),
    };
  };

  // Add this function after the findLabValue function
  const findVitalValue = (
    id: string,
    vitals?: Partial<Vital>[],
    type?: "systolic" | "diastolic"
  ): { value?: string; date?: string } => {
    const matchingVitals = vitals?.filter((v) =>
      v.identifiers?.some(
        (i: { id: string; system: string }) =>
          i.id === id && i.system === "powerchart-touch"
      )
    );

    if (!matchingVitals?.length) return {};

    // For blood pressure, we need to handle systolic and diastolic separately
    if (id === "BLOOD_PRESSURE_ALL" && type) {
      const bpVitals = matchingVitals.filter((v) =>
        type === "systolic"
          ? v.display_name?.includes("Systolic")
          : v.display_name?.includes("Diastolic")
      );

      if (!bpVitals.length) return {};

      // Sort by date descending and get the most recent
      const mostRecent = bpVitals.sort(
        (a, b) =>
          new Date(b.effective_datetime || "").getTime() -
          new Date(a.effective_datetime || "").getTime()
      )[0];

      return {
        value: mostRecent.display_value,
        date: mostRecent.effective_datetime
          ? new Date(mostRecent.effective_datetime).toLocaleDateString(
              "en-US",
              {
                month: "2-digit",
                day: "2-digit",
              }
            )
          : undefined,
      };
    }

    // For non-blood pressure vitals, just get the most recent
    const mostRecent = matchingVitals.sort(
      (a, b) =>
        new Date(b.effective_datetime || "").getTime() -
        new Date(a.effective_datetime || "").getTime()
    )[0];

    return {
      value: mostRecent.display_value,
      date: mostRecent.effective_datetime
        ? new Date(mostRecent.effective_datetime).toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
          })
        : undefined,
    };
  };

  // HH Fishbone values
  const { value: hgb, date: hgbDate } = findLabValue("3995021");
  const { value: hct, date: hctDate } = findLabValue("3995022");
  const { value: wbc, date: wbcDate } = findLabValue("3995018");
  const { value: plt, date: pltDate } = findLabValue("2570637035");

  // CMP Fishbone values
  const { value: sodium, date: sodiumDate } = findLabValue("2570625249");
  const { value: potassium, date: potassiumDate } = findLabValue("2570625243");
  const { value: chloride, date: chlorideDate } = findLabValue("3995151");
  const { value: co2, date: co2Date } = findLabValue("2570625237");
  const { value: bun, date: bunDate } = findLabValue("3995154");
  const { value: creatinine, date: creatinineDate } = findLabValue("3995155");
  const { value: glucose, date: glucoseDate } = findLabValue("2570637877");

  // X Fishbone values
  const { value: alt, date: altDate } = findLabValue("2570624901");
  const { value: bili, date: biliDate } = findLabValue("2570625573");
  const { value: ast, date: astDate } = findLabValue("2570625213");
  const { value: alkPhos, date: alkPhosDate } = findLabValue("2570636921");

  // Y Fishbone values
  const { value: inr, date: inrDate } = findLabValue("3995078");
  const { value: pt, date: ptDate } = findLabValue("3995077");
  const { value: ptt, date: pttDate } = findLabValue("2570625189");

  // Reverse Y Fishbone values
  const { value: ca, date: caDate } = findLabValue("2570625231");
  const { value: mg, date: mgDate } = findLabValue("3995206");
  const { value: po4, date: po4Date } = findLabValue("2570627835");

  // Get the most recent date from each fishbone group
  const getLatestDate = (
    ...dates: (string | undefined)[]
  ): string | undefined => {
    const validDates = dates.filter((d): d is string => !!d);
    if (!validDates.length) return undefined;
    return validDates.sort().reverse()[0];
  };

  const hhDate = getLatestDate(hgbDate, hctDate, wbcDate, pltDate);
  const cmpDate = getLatestDate(
    sodiumDate,
    potassiumDate,
    chlorideDate,
    co2Date,
    bunDate,
    creatinineDate,
    glucoseDate
  );
  const xDate = getLatestDate(altDate, biliDate, astDate, alkPhosDate);
  const yDate = getLatestDate(inrDate, ptDate, pttDate);
  const reverseYDate = getLatestDate(caDate, mgDate, po4Date);

  const vitals = template.vitals?.sections || [];
  const vitalsEnabled = template.vitals?.enabled || false;
  const physicalExamEnabled = template.physicalExam?.enabled || false;
  const eventsEnabled = template.events?.enabled || false;
  const medsEnabled = template.meds?.enabled || false;
  const eventsFullWidth =
    template.events?.fullWidth === undefined
      ? false
      : template.events?.fullWidth;
  // 1/6 is gridBox2, 1/4 is gridBox3, 1/3 is gridBox4
  const eventsHeight = template.events?.height || "1/6";
  const physicalExams = template.physicalExam?.sections || [];
  const labsEnabled = template.labs?.enabled || false;
  const labsFullWidth = template.labs?.fullWidth || false;
  const consultsEnabled = template.consults?.enabled || false;
  const imagingEnabled = template.imaging?.enabled || false;
  const socialHistoryEnabled = template.socialHistory?.enabled || false;
  const socialHistoryHeight = template.socialHistory?.height || "1/6";

  const familyHistoryEnabled = template.familyHistory?.enabled || false;
  const familyHistoryHeight = template.familyHistory?.height || "1/6";

  const allergiesEnabled = template.allergies?.enabled || false;
  const allergiesHeight = template.allergies?.height || "1/6";

  const surgicalHistoryEnabled = template.surgicalHistory?.enabled || false;
  const surgicalHistoryHeight = template.surgicalHistory?.height || "1/6";

  const microEnabled = template.micro?.enabled || false;

  const getStyle = (
    height: "1/12" | "1/6" | "1/4" | "1/3",
    fullWidth: boolean
  ) => {
    const styleMap: Record<"1/12" | "1/6" | "1/4" | "1/3", unknown> = {
      "1/12": fullWidth
        ? patientRowStyles.gridBox1FullWidth
        : patientRowStyles.gridBox1HalfWidth,
      "1/6": fullWidth
        ? patientRowStyles.gridBox2FullWidth
        : patientRowStyles.gridBox2HalfWidth,
      "1/4": fullWidth
        ? patientRowStyles.gridBox3FullWidth
        : patientRowStyles.gridBox3HalfWidth,
      "1/3": fullWidth
        ? patientRowStyles.gridBox4FullWidth
        : patientRowStyles.gridBox4HalfWidth,
    };

    return (
      styleMap[height] ||
      (fullWidth
        ? patientRowStyles.gridBox2FullWidth
        : patientRowStyles.gridBox2HalfWidth)
    );
  };

  const getEventStyle = () => getStyle(eventsHeight, eventsFullWidth);

  return (
    <View style={patientRowStyles.gridContainer}>
      {eventsEnabled && (
        <View style={getEventStyle()}>
          <Text style={patientRowStyles.eventsText}>Events:</Text>
        </View>
      )}
      {surgicalHistoryEnabled && (
        <View style={getStyle(surgicalHistoryHeight, false)}>
          <Text style={patientRowStyles.gridBoxText}>SurgHx:</Text>
          <Text style={patientRowStyles.gridBoxText}></Text>
        </View>
      )}
      {socialHistoryEnabled && (
        <View style={getStyle(socialHistoryHeight, false)}>
          <Text style={patientRowStyles.gridBoxText}>SHx:</Text>
          <Text style={patientRowStyles.peText}>Tobacco (pack years):</Text>
          <Text style={patientRowStyles.peText}>Alcohol:</Text>
          <Text style={patientRowStyles.peText}>Rec Drugs:</Text>
          <Text style={patientRowStyles.peText}>Home/Occupation:</Text>
          <Text style={patientRowStyles.peText}>Sexual Activity:</Text>
        </View>
      )}
      {familyHistoryEnabled && (
        <View style={getStyle(familyHistoryHeight, false)}>
          <Text style={patientRowStyles.gridBoxText}>FHx:</Text>
          <Text style={patientRowStyles.gridBoxText}></Text>
        </View>
      )}
      {allergiesEnabled && (
        <View style={getStyle(allergiesHeight, false)}>
          <Text style={patientRowStyles.gridBoxText}>Allergies:</Text>
          <Text style={patientRowStyles.peText}>Drugs:</Text>
          <Text style={patientRowStyles.peText}>Food:</Text>
          <Text style={patientRowStyles.peText}>Env:</Text>
        </View>
      )}
      {vitalsEnabled && (
        <View style={patientRowStyles.gridBox3HalfWidth}>
          <Text style={patientRowStyles.gridBoxText}>Vitals:</Text>
          {vitals.map((vital: string, i: number) => {
            let vitalId = "";
            let displayValue = "";
            let vitalValue: { value?: string; date?: string } = {};
            let o2Type: { value?: string; date?: string } = {};
            let systolic: { value?: string; date?: string } = {};
            let diastolic: { value?: string; date?: string } = {};

            // Map vital section names to their corresponding IDs
            switch (vital.toLowerCase()) {
              case "temp":
                vitalId = "TEMPERATURE";
                vitalValue = findVitalValue(vitalId, patient.vitals);
                displayValue = vitalValue.value ? `${vitalValue.value}°C` : "";
                break;
              case "sys":
                vitalId = "BLOOD_PRESSURE_ALL";
                vitalValue = findVitalValue(
                  vitalId,
                  patient.vitals,
                  "systolic"
                );
                displayValue = vitalValue.value || "";
                break;
              case "dias":
                vitalId = "BLOOD_PRESSURE_ALL";
                vitalValue = findVitalValue(
                  vitalId,
                  patient.vitals,
                  "diastolic"
                );
                displayValue = vitalValue.value || "";
                break;
              case "bp (map)":
                vitalId = "BLOOD_PRESSURE_ALL";
                systolic = findVitalValue(vitalId, patient.vitals, "systolic");
                diastolic = findVitalValue(
                  vitalId,
                  patient.vitals,
                  "diastolic"
                );
                if (systolic.value && diastolic.value) {
                  const map =
                    (1 / 3) * parseFloat(systolic.value) +
                    (2 / 3) * parseFloat(diastolic.value);
                  displayValue = `${systolic.value}/${
                    diastolic.value
                  } (${map.toFixed(0)})`;
                }
                break;
              case "rr":
                vitalId = "RESPIRATORY_RATE";
                vitalValue = findVitalValue(vitalId, patient.vitals);
                displayValue = vitalValue.value || "";
                break;
              case "hr":
                vitalId = "HEART_RATE_ALL";
                vitalValue = findVitalValue(vitalId, patient.vitals);
                displayValue = vitalValue.value || "";
                break;
              case "spo2":
                vitalId = "OXYGEN_SATURATION";
                vitalValue = findVitalValue(vitalId, patient.vitals);
                displayValue = vitalValue.value ? `${vitalValue.value}%` : "";
                o2Type = findVitalValue("OXYGEN_THERAPY_TYPE", patient.vitals);
                if (o2Type.value) {
                  displayValue += ` on ${o2Type.value}`;
                }
                break;
              default:
                break;
            }

            return (
              <View
                key={i}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Text style={patientRowStyles.peText}>{vital}: </Text>
                <Text style={patientRowStyles.peText}>{displayValue}</Text>
              </View>
            );
          })}
        </View>
      )}
      {physicalExamEnabled && (
        <View style={patientRowStyles.gridBox3HalfWidth}>
          <Text style={patientRowStyles.gridBoxText}>PE:</Text>
          {physicalExams.map((exam, i) => (
            <Text key={i} style={patientRowStyles.peText}>
              {exam}:
            </Text>
          ))}
        </View>
      )}
      {labsEnabled && (
        <View
          style={
            labsFullWidth
              ? patientRowStyles.gridBox3FullWidth
              : patientRowStyles.gridBox3HalfWidth
          }
        >
          <Text style={patientRowStyles.gridBoxText}>Labs:</Text>
          <View style={patientRowStyles.labsGridBox}>
            <View style={patientRowStyles.fishboneContainer}>
              <HHFishbone
                hgb={hgb}
                hct={hct}
                wbc={wbc}
                plt={plt}
                date={hhDate}
              />
              <CMPFishbone
                sodium={sodium}
                potassium={potassium}
                chloride={chloride}
                co2={co2}
                bun={bun}
                creatinine={creatinine}
                glucose={glucose}
                date={cmpDate}
              />
            </View>
            <View style={patientRowStyles.fishboneContainer}>
              <XFishbone
                alt={alt}
                bili={bili}
                ast={ast}
                alkPhos={alkPhos}
                date={xDate}
              />
              <YFishbone inr={inr} pt={pt} ptt={ptt} date={yDate} />
              <ReverseYFishbone ca={ca} mg={mg} po4={po4} date={reverseYDate} />
            </View>
          </View>
        </View>
      )}
      {imagingEnabled && (
        <View style={patientRowStyles.gridBox3HalfWidth}>
          <Text style={patientRowStyles.gridBoxText}>Imaging:</Text>
          <Text style={patientRowStyles.gridBoxText}></Text>
        </View>
      )}
      {medsEnabled && (
        <View style={patientRowStyles.gridBox3HalfWidth}>
          <Text style={patientRowStyles.gridBoxText}>Meds:</Text>
          <View style={patientRowStyles.medsContainer}>
            {patient.meds && patient.meds.length > 0 ? (
              template.meds?.compactView ? (
                <Text style={patientRowStyles.medsText}>
                  {patient.meds
                    .filter(
                      (med) => !med.name?.toUpperCase().startsWith("HOME")
                    )
                    .sort((a, b) => {
                      const nameA = a.name?.toLowerCase() || "";
                      const nameB = b.name?.toLowerCase() || "";
                      const isDripA = nameA.includes("drip");
                      const isDripB = nameB.includes("drip");

                      // Sort drips first
                      if (isDripA && !isDripB) return -1;
                      if (!isDripA && isDripB) return 1;

                      // Then sort by PRN status
                      const frequencyA = a.frequency?.toLowerCase() || "";
                      const frequencyB = b.frequency?.toLowerCase() || "";
                      const isPRNA = frequencyA.includes("prn");
                      const isPRNB = frequencyB.includes("prn");
                      if (isPRNA && !isPRNB) return 1;
                      if (!isPRNA && isPRNB) return -1;

                      // Finally sort alphabetically
                      return (a.name || "").localeCompare(b.name || "");
                    })
                    .map((med) =>
                      [med.name, med.dose, med.unit, med.route, med.frequency]
                        .filter(Boolean)
                        .join(" ")
                    )
                    .join(" • ")}
                </Text>
              ) : (
                patient.meds
                  .filter((med) => !med.name?.toUpperCase().startsWith("HOME"))
                  .sort((a, b) => {
                    const nameA = a.name?.toLowerCase() || "";
                    const nameB = b.name?.toLowerCase() || "";
                    const isDripA = nameA.includes("drip");
                    const isDripB = nameB.includes("drip");

                    // Sort drips first
                    if (isDripA && !isDripB) return -1;
                    if (!isDripA && isDripB) return 1;

                    // Then sort by PRN status
                    const frequencyA = a.frequency?.toLowerCase() || "";
                    const frequencyB = b.frequency?.toLowerCase() || "";
                    const isPRNA = frequencyA.includes("prn");
                    const isPRNB = frequencyB.includes("prn");
                    if (isPRNA && !isPRNB) return 1;
                    if (!isPRNA && isPRNB) return -1;

                    // Finally sort alphabetically
                    return (a.name || "").localeCompare(b.name || "");
                  })
                  .map((med, i) => (
                    <Text key={i} style={patientRowStyles.medsText}>
                      {[med.name, med.dose, med.unit, med.route, med.frequency]
                        .filter(Boolean)
                        .join(" ") || ""}{" "}
                    </Text>
                  ))
              )
            ) : (
              Array.from({ length: 10 }).map((_, i) => (
                <Text key={i} style={patientRowStyles.medsEmptyPlaceholder}>
                  {" "}
                </Text>
              ))
            )}
          </View>
        </View>
      )}
      {consultsEnabled && (
        <View style={patientRowStyles.gridBox2HalfWidth}>
          <Text style={patientRowStyles.gridBoxText}>Consults:</Text>
          <Text style={patientRowStyles.gridBoxText}></Text>
        </View>
      )}
      {microEnabled && (
        <View style={patientRowStyles.gridBox2HalfWidth}>
          <Text style={patientRowStyles.gridBoxText}>Micro:</Text>
          <Text style={patientRowStyles.gridBoxText}></Text>
        </View>
      )}
    </View>
  );
};
