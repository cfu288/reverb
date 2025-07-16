import React, { useEffect } from "react";
import { generateDefaultDatetime } from "../helpers/generateDefaultDatetime";
import { BPLog } from "../BPLog";

export const useFutureEntryDate = (
  data: BPLog[],
  setFutureEntry: React.Dispatch<React.SetStateAction<BPLog>>
) => {
  useEffect(() => {
    if (data.length > 0) {
      const lastDate = new Date(data[data.length - 1].dateTime);
      const newDate = new Date(lastDate);
      newDate.setDate(newDate.getDate() + 1);
      setFutureEntry((prevEntry) => {
        const updatedEntry = {
          ...prevEntry,
          dateTime: newDate.toLocaleString("en-US", { hour12: true }),
        };
        return updatedEntry;
      });
    } else {
      setFutureEntry((prevEntry) => {
        const updatedEntry = {
          ...prevEntry,
          dateTime: generateDefaultDatetime(),
        };
        return updatedEntry;
      });
    }
  }, [data, setFutureEntry]);
};
