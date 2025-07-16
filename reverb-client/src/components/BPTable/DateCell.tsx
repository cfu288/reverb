import { useEffect, useState } from "react";
import { CellContext } from "@tanstack/react-table";
import { BPLog } from "./BPLog";

export const DateCell = ({
  getValue,
  row,
  column,
  table,
}: CellContext<BPLog, string>) => {
  const initialValue = getValue();
  const [dateValue, setDateValue] = useState(
    new Date(initialValue).toLocaleDateString("en-CA")
  );
  const [timeValue, setTimeValue] = useState(
    new Date(initialValue)
      .toLocaleTimeString("en-US", { hour12: false })
      .slice(0, 5)
  );

  const onBlur = () => {
    const combinedDateTime = `${dateValue}T${timeValue}:00`;
    table.options.meta?.updateData(row.index, column.id, combinedDateTime);
  };

  useEffect(() => {
    setDateValue(new Date(initialValue).toLocaleDateString("en-CA"));
    setTimeValue(
      new Date(initialValue)
        .toLocaleTimeString("en-US", { hour12: false })
        .slice(0, 5)
    );
  }, [initialValue]);

  return (
    <div>
      <input
        type="date"
        value={dateValue}
        onChange={(e) => setDateValue(e.target.value)}
        onBlur={onBlur}
      />
      <input
        type="time"
        value={timeValue}
        onChange={(e) => setTimeValue(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
};
