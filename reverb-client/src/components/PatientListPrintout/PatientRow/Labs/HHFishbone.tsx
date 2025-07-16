import { Svg, Line, Text } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";

const fishboneStyles = StyleSheet.create({
  fishboneSvg: {
    // margin: "8px",
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

function formatHHFishboneValues({
  hgb,
  hct,
  wbc,
  plt,
}: {
  hgb?: number;
  hct?: number;
  wbc?: number;
  plt?: number;
}): {
  hgb: string;
  hct: string;
  wbc: string;
  plt: string;
} {
  return {
    hgb: hgb !== undefined ? hgb.toFixed(1) : " ",
    hct: hct !== undefined ? hct.toFixed(0) : " ",
    wbc: wbc !== undefined ? wbc.toFixed(1) : " ",
    plt: plt !== undefined ? plt.toFixed(0) : " ",
  };
}

export function HHFishbone({
  hgb,
  hct,
  wbc,
  plt,
  date,
}: {
  hgb?: number;
  hct?: number;
  wbc?: number;
  plt?: number;
  date?: string;
}) {
  const formattedValues = formatHHFishboneValues({ hgb, hct, wbc, plt });

  return (
    <Svg height="45" width="80" style={fishboneStyles.fishboneSvg}>
      {/* top diagonal and up to left */}
      <Line x1="30" y1="20" x2="20" y2="10" stroke="black" strokeWidth="1" />
      {/* top diagonal and up to right */}
      <Line x1="50" y1="10" x2="40" y2="20" stroke="black" strokeWidth="1" />
      {/* center horizontal */}
      <Line x1="30" y1="20" x2="40" y2="20" stroke="black" strokeWidth="1" />
      {/* bottom diagonal and down to left */}
      <Line x1="30" y1="20" x2="20" y2="30" stroke="black" strokeWidth="1" />
      {/* bottom diagonal and down to right */}
      <Line x1="50" y1="30" x2="40" y2="20" stroke="black" strokeWidth="1" />
      <Text
        x="27"
        y="21"
        textAnchor="end"
        style={fishboneStyles.fishboneLabelText}
      >
        WBC
      </Text>
      <Text
        x="19"
        y="23"
        textAnchor="end"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.wbc}
      </Text>
      <Text
        x="35"
        y="18"
        textAnchor="middle"
        style={fishboneStyles.fishboneLabelText}
      >
        HGB
      </Text>
      <Text
        x="35"
        y="13"
        textAnchor="middle"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.hgb}
      </Text>
      <Text
        x="35"
        y="24"
        textAnchor="middle"
        style={fishboneStyles.fishboneLabelText}
      >
        HCT
      </Text>
      <Text
        x="35"
        y="31"
        textAnchor="middle"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.hct}
      </Text>
      <Text
        x="43"
        y="21"
        textAnchor="start"
        style={fishboneStyles.fishboneLabelText}
      >
        PLT
      </Text>
      <Text
        x="49"
        y="23"
        textAnchor="start"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.plt}
      </Text>
      <Text
        x="35"
        y="42"
        textAnchor="middle"
        style={fishboneStyles.fishboneValueText}
      >
        {date || ""}
      </Text>
    </Svg>
  );
}
