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

function formatXFishboneValues({
  alt,
  bili,
  ast,
  alkPhos,
}: {
  alt?: number;
  bili?: number;
  ast?: number;
  alkPhos?: number;
}): {
  alt: string;
  bili: string;
  ast: string;
  alkPhos: string;
} {
  return {
    alt: alt !== undefined ? alt.toFixed(0) : " ",
    bili: bili !== undefined ? bili.toFixed(1) : " ",
    ast: ast !== undefined ? ast.toFixed(0) : " ",
    alkPhos: alkPhos !== undefined ? alkPhos.toFixed(0) : " ",
  };
}

export function XFishbone({
  alt,
  bili,
  ast,
  alkPhos,
  date,
}: {
  alt?: number;
  bili?: number;
  ast?: number;
  alkPhos?: number;
  date?: string;
}) {
  const formattedValues = formatXFishboneValues({ alt, bili, ast, alkPhos });

  return (
    <Svg height="45" width="60" style={fishboneStyles.fishboneSvg}>
      <Line x1="20" y1="10" x2="40" y2="30" stroke="black" strokeWidth="1" />
      <Line x1="20" y1="30" x2="40" y2="10" stroke="black" strokeWidth="1" />
      <Text
        x="27"
        y="21"
        textAnchor="end"
        style={fishboneStyles.fishboneLabelText}
      >
        ALT
      </Text>
      <Text
        x="19"
        y="23"
        textAnchor="end"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.alt}
      </Text>
      <Text
        x="30"
        y="15"
        textAnchor="middle"
        style={fishboneStyles.fishboneLabelText}
      >
        Bili
      </Text>
      <Text
        x="30"
        y="11"
        textAnchor="middle"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.bili}
      </Text>
      <Text
        x="33"
        y="21"
        textAnchor="start"
        style={fishboneStyles.fishboneLabelText}
      >
        AST
      </Text>
      <Text
        x="39"
        y="23"
        textAnchor="start"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.ast}
      </Text>
      <Text
        x="30"
        y="27"
        textAnchor="middle"
        style={fishboneStyles.fishboneLabelText}
      >
        Alk P
      </Text>
      <Text
        x="30"
        y="34"
        textAnchor="middle"
        style={fishboneStyles.fishboneValueText}
      >
        {formattedValues.alkPhos}
      </Text>
      <Text
        x="30"
        y="42"
        textAnchor="middle"
        style={fishboneStyles.fishboneValueText}
      >
        {date || ""}
      </Text>
    </Svg>
  );
}
