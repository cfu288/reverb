import { View, Svg, Line, Text } from "@react-pdf/renderer";
import { StyleSheet } from "@react-pdf/renderer";

const fishboneStyles = StyleSheet.create({
  fishboneRow: {
    display: "flex",
    flexDirection: "row",
  },
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

function formatCMPValues({
  sodium,
  potassium,
  chloride,
  co2,
  bun,
  creatinine,
  glucose,
}: {
  sodium?: number;
  potassium?: number;
  chloride?: number;
  co2?: number;
  bun?: number;
  creatinine?: number;
  glucose?: number;
}): {
  sodium: string;
  potassium: string;
  chloride: string;
  co2: string;
  bun: string;
  creatinine: string;
  glucose: string;
} {
  return {
    sodium: sodium !== undefined ? sodium.toFixed(0) : " ",
    potassium: potassium !== undefined ? potassium.toFixed(1) : " ",
    chloride: chloride !== undefined ? chloride.toFixed(0) : " ",
    co2: co2 !== undefined ? co2.toFixed(0) : " ",
    bun: bun !== undefined ? bun.toFixed(0) : " ",
    creatinine:
      creatinine !== undefined
        ? creatinine % 1 === 0
          ? creatinine.toFixed(1)
          : creatinine.toFixed(2)
        : " ",
    glucose: glucose !== undefined ? glucose.toFixed(0) : " ",
  };
}

export function CMPFishbone({
  sodium,
  potassium,
  chloride,
  co2,
  bun,
  creatinine,
  glucose,
  date,
}: {
  sodium?: number;
  potassium?: number;
  chloride?: number;
  co2?: number;
  bun?: number;
  creatinine?: number;
  glucose?: number;
  date?: string;
}) {
  const formattedValues = formatCMPValues({
    sodium,
    potassium,
    chloride,
    co2,
    bun,
    creatinine,
    glucose,
  });

  return (
    <View style={fishboneStyles.fishboneRow}>
      <Svg height="45" width="110" style={fishboneStyles.fishboneSvg}>
        <Line x1="5" y1="20" x2="60" y2="20" stroke="black" strokeWidth="1" />
        <Text
          x="24"
          y="19"
          textAnchor="end"
          style={fishboneStyles.fishboneLabelText}
        >
          Na
        </Text>
        <Text
          x="24"
          y="15"
          textAnchor="end"
          style={fishboneStyles.fishboneValueText}
        >
          {formattedValues.sodium}
        </Text>
        <Line x1="25" y1="10" x2="25" y2="30" stroke="black" strokeWidth="1" />
        <Text
          x="24"
          y="23"
          textAnchor="end"
          style={fishboneStyles.fishboneLabelText}
        >
          K
        </Text>
        <Text
          x="24"
          y="30"
          textAnchor="end"
          style={fishboneStyles.fishboneValueText}
        >
          {formattedValues.potassium}
        </Text>
        <Line x1="45" y1="10" x2="45" y2="30" stroke="black" strokeWidth="1" />
        <Text
          x="44"
          y="19"
          textAnchor="end"
          style={fishboneStyles.fishboneLabelText}
        >
          Cl
        </Text>
        <Text
          x="44"
          y="15"
          textAnchor="end"
          style={fishboneStyles.fishboneValueText}
        >
          {formattedValues.chloride}
        </Text>
        <Text
          x="44"
          y="23"
          textAnchor="end"
          style={fishboneStyles.fishboneLabelText}
        >
          CO2
        </Text>
        <Text
          x="44"
          y="30"
          textAnchor="end"
          style={fishboneStyles.fishboneValueText}
        >
          {formattedValues.co2}
        </Text>
        <Text
          x="60"
          y="19"
          textAnchor="end"
          style={fishboneStyles.fishboneLabelText}
        >
          BUN
        </Text>
        <Text
          x="60"
          y="15"
          textAnchor="end"
          style={fishboneStyles.fishboneValueText}
        >
          {formattedValues.bun}
        </Text>
        <Text
          x="60"
          y="23"
          textAnchor="end"
          style={fishboneStyles.fishboneLabelText}
        >
          Cr
        </Text>
        <Text
          x="60"
          y="30"
          textAnchor="end"
          style={fishboneStyles.fishboneValueText}
        >
          {formattedValues.creatinine}
        </Text>
        <Text
          x="62"
          y="21"
          textAnchor="start"
          style={fishboneStyles.fishboneLabelText}
        >
          Glu
        </Text>
        <Text
          x="68"
          y="22.5"
          textAnchor="start"
          style={fishboneStyles.fishboneValueText}
        >
          {formattedValues.glucose}
        </Text>
        <Text
          x="35"
          y="42"
          textAnchor="middle"
          style={fishboneStyles.fishboneValueText}
        >
          {date || ""}
        </Text>
        <Line x1="60" y1="20" x2="70" y2="10" stroke="black" strokeWidth="1" />
        <Line x1="60" y1="20" x2="70" y2="30" stroke="black" strokeWidth="1" />
      </Svg>
    </View>
  );
}
