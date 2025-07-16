import { LineChart } from "@/components/LineChart/LineChart";
import { BPLog } from "../BPLog";
import { calculateMAP } from "../calculators/calculateMAP";

export const GraphView = ({ data }: { data: BPLog[] }) => (
  <LineChart
    className="h-80 mt-8"
    data={data.map((entry) => ({
      date: entry.dateTime,
      Systolic: parseInt(entry.systolic, 0),
      Diastolic: parseInt(entry.diastolic, 0),
      MAP: calculateMAP(parseInt(entry.systolic), parseInt(entry.diastolic)),
    }))}
    index="date"
    categories={["Systolic", "Diastolic", "MAP"]}
    valueFormatter={(number: number) => `${number} mmHg`}
    onValueChange={(v) => console.log(v)}
  />
);
