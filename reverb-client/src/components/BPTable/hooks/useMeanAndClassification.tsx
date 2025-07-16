import { useEffect, useState } from "react";
import { classifyHypertension } from "../calculators/classifyHypertension";
import { calculateMean } from "../calculators/calculateMean";
import { BPLog } from "../BPLog";

export const useMeanAndClassification = (data: BPLog[]) => {
  const [meanSystolic, setMeanSystolic] = useState<number>(0);
  const [meanDiastolic, setMeanDiastolic] = useState<number>(0);
  const [hypertensionClassification, setHypertensionClassification] =
    useState<string>("");

  useEffect(() => {
    const meanSystolic = calculateMean(
      data.map((entry) => parseInt(entry.systolic, 10))
    );
    const meanDiastolic = calculateMean(
      data.map((entry) => parseInt(entry.diastolic, 10))
    );

    const hypertensionClassification = classifyHypertension(
      meanSystolic,
      meanDiastolic
    );

    setMeanSystolic(meanSystolic);
    setMeanDiastolic(meanDiastolic);
    setHypertensionClassification(hypertensionClassification);
  }, [data]);

  return { meanSystolic, meanDiastolic, hypertensionClassification };
};
