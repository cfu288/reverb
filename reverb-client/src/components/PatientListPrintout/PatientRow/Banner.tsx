import { BannerProps } from "./PatientRow";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

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
  smallBannerText: {
    fontSize: 3,
    textAlign: "left",
  },
});

export const Banner: React.FC<BannerProps> = ({ patient }) => (
  <View style={patientRowStyles.bannerContainer}>
    <View style={patientRowStyles.bannerBoxShrinkable}>
      <Text style={!patient.location ? patientRowStyles.smallBannerText : {}}>
        {patient.location ? patient.location : "LOCATION"}
      </Text>
    </View>
    <View style={patientRowStyles.bannerBox}>
      <Text
        style={
          !patient.last_name && !patient.first_name
            ? patientRowStyles.smallBannerText
            : {}
        }
      >
        {patient.last_name || patient.first_name
          ? `${patient.last_name?.toUpperCase()}${
              patient.last_name && patient.first_name ? ", " : ""
            }${patient.first_name}`
          : "NAME"}
      </Text>
    </View>
    <View style={patientRowStyles.bannerBoxShrinkableLarge}>
      <Text style={!patient.dob ? patientRowStyles.smallBannerText : {}}>
        {patient.dob
          ? `DOB: ${patient.dob} (${
              new Date().getFullYear() - new Date(patient.dob).getFullYear()
            })`
          : "DOB"}
      </Text>
    </View>
    <View style={patientRowStyles.bannerBoxShrinkableLargeRightNoBorder}>
      <Text style={!patient.mrn ? patientRowStyles.smallBannerText : {}}>
        {patient.mrn ? `MRN: ${patient.mrn}` : "MRN"}
      </Text>
    </View>
  </View>
);
