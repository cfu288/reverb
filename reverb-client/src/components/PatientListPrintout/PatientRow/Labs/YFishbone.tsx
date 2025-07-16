import { Svg, Line, Text } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";

const yFishboneStyles = StyleSheet.create({
  fishboneSvg: {
    margin: "8px",
    // marginVertical: "2px",
  },
  fishboneLabelText: {
    fontSize: "3px",
    color: "rgba(243, 244, 246, 0.1)",
  },
  fishboneValueText: {
    fontSize: "6px",
  },
});

function formatYFishboneValues({
  inr,
  pt,
  ptt,
}: {
  inr?: number;
  pt?: number;
  ptt?: number;
}): {
  inr: string;
  pt: string;
  ptt: string;
} {
  return {
    inr: inr !== undefined ? inr.toFixed(2) : " ",
    pt: pt !== undefined ? pt.toFixed(1) : " ",
    ptt: ptt !== undefined ? ptt.toFixed(1) : " ",
  };
}

export function YFishbone({
  inr,
  pt,
  ptt,
  date,
}: {
  inr?: number;
  pt?: number;
  ptt?: number;
  date?: string;
}) {
  const formattedValues = formatYFishboneValues({ inr, pt, ptt });

  return (
    <Svg height="45" width="40" style={yFishboneStyles.fishboneSvg}>
      <Line x1="10" y1="10" x2="20" y2="20" stroke="black" strokeWidth="1" />
      <Line x1="20" y1="20" x2="30" y2="10" stroke="black" strokeWidth="1" />
      <Line x1="20" y1="20" x2="20" y2="30" stroke="black" strokeWidth="1" />
      <Text
        x="20"
        y="16"
        textAnchor="middle"
        style={yFishboneStyles.fishboneLabelText}
      >
        INR
      </Text>
      <Text
        x="20"
        y="12"
        textAnchor="middle"
        style={yFishboneStyles.fishboneValueText}
      >
        {formattedValues.inr}
      </Text>
      <Text
        x="19"
        y="22"
        textAnchor="end"
        style={yFishboneStyles.fishboneLabelText}
      >
        PT
      </Text>
      <Text
        x="18"
        y="30"
        textAnchor="end"
        style={yFishboneStyles.fishboneValueText}
      >
        {formattedValues.pt}
      </Text>
      <Text
        x="21"
        y="22"
        textAnchor="start"
        style={yFishboneStyles.fishboneLabelText}
      >
        PTT
      </Text>
      <Text
        x="22"
        y="30"
        textAnchor="start"
        style={yFishboneStyles.fishboneValueText}
      >
        {formattedValues.ptt}
      </Text>
      <Text
        x="20"
        y="42"
        textAnchor="middle"
        style={yFishboneStyles.fishboneValueText}
      >
        {date || ""}
      </Text>
    </Svg>
  );
}
