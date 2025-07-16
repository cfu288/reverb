import { useEffect, useState } from "react";
import { CellContext } from "@tanstack/react-table";
import { BPLog } from "./BPLog";

export const SystolicCell = ({
  getValue,
  row: { index },
  column: { id },
  table,
}: CellContext<BPLog, string>) => {
  const initialValue = getValue();
  const [value, setValue] = useState<number>(Number(initialValue));

  const onBlur = () => {
    table.options.meta?.updateData(index, id, value.toString());
  };

  useEffect(() => {
    setValue(Number(initialValue));
  }, [initialValue]);

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
      onBlur={onBlur}
    />
  );
};
