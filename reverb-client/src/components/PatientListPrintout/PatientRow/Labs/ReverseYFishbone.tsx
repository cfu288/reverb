import { Svg, Line, Text } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";

const reverseYFishboneStyles = StyleSheet.create({
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

function formatReverseYFishboneValues({
  ca,
  mg,
  po4,
}: {
  ca?: number;
  mg?: number;
  po4?: number;
}): {
  ca: string;
  mg: string;
  po4: string;
} {
  return {
    ca: ca !== undefined ? ca.toFixed(1) : " ",
    mg: mg !== undefined ? mg.toFixed(1) : " ",
    po4: po4 !== undefined ? po4.toFixed(1) : " ",
  };
}

export function ReverseYFishbone({
  ca,
  mg,
  po4,
  date,
}: {
  ca?: number;
  mg?: number;
  po4?: number;
  date?: string;
}) {
  const formattedValues = formatReverseYFishboneValues({ ca, mg, po4 });

  return (
    <Svg height="45" width="40" style={reverseYFishboneStyles.fishboneSvg}>
      <Line x1="10" y1="30" x2="20" y2="20" stroke="black" strokeWidth="1" />
      <Line x1="20" y1="20" x2="30" y2="30" stroke="black" strokeWidth="1" />
      <Line x1="20" y1="20" x2="20" y2="10" stroke="black" strokeWidth="1" />
      <Text
        x="19"
        y="20"
        textAnchor="end"
        style={reverseYFishboneStyles.fishboneLabelText}
      >
        Ca
      </Text>
      <Text
        x="18"
        y="15"
        textAnchor="end"
        style={reverseYFishboneStyles.fishboneValueText}
      >
        {formattedValues.ca}
      </Text>
      <Text
        x="21"
        y="20"
        textAnchor="start"
        style={reverseYFishboneStyles.fishboneLabelText}
      >
        Mg
      </Text>
      <Text
        x="22"
        y="15"
        textAnchor="start"
        style={reverseYFishboneStyles.fishboneValueText}
      >
        {formattedValues.mg}
      </Text>
      <Text
        x="20"
        y="27"
        textAnchor="middle"
        style={reverseYFishboneStyles.fishboneLabelText}
      >
        PO4
      </Text>
      <Text
        x="20"
        y="34"
        textAnchor="middle"
        style={reverseYFishboneStyles.fishboneValueText}
      >
        {formattedValues.po4}
      </Text>
      <Text
        x="20"
        y="42"
        textAnchor="middle"
        style={reverseYFishboneStyles.fishboneValueText}
      >
        {date || ""}
      </Text>
    </Svg>
  );
}
