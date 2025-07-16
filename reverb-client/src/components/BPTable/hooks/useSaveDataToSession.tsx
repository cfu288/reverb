import { useEffect } from "react";
import { BPLog } from "../BPLog";

export const useSaveDataToSession = (
  data: BPLog[],
  saveDataToSession: (data: BPLog[]) => void
) => {
  useEffect(() => {
    saveDataToSession(data);
  }, [data, saveDataToSession]);
};
