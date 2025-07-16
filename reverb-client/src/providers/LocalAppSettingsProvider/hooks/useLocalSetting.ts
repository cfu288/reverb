import { useContext } from "react";
import { LocalAppSettingsContext } from "../context/LocalAppSettingsContext";
import { LocalAppSettings, SettingResult } from "../types";
import { useLocalAppSettingsHelper } from "../helpers";
import React from "react";

export const useLocalSetting = <K extends keyof LocalAppSettings>(
  key: K
): { result: SettingResult<K>; refresh: () => Promise<void> } => {
  const state = useContext(LocalAppSettingsContext);
  if (!state) {
    throw new Error(
      "useLocalSetting must be used within a LocalAppSettingsProvider"
    );
  }

  const { getSetting } = useLocalAppSettingsHelper(state);
  const [localState, setLocalState] = React.useState<SettingResult<K>>({
    status: "LOADING",
  });

  const fetchSetting = React.useCallback(async () => {
    try {
      const result = await getSetting(key);
      setLocalState(result);
    } catch (error) {
      setLocalState({
        status: "ERROR",
        error: (error as Error).message,
        errorCode: "Unknown",
      });
    }
  }, [getSetting, key]);

  const keyValues = React.useMemo(() => {
    return state.settings[key];
  }, [key, state.settings]);

  React.useEffect(() => {
    fetchSetting()
      .then(() => {})
      .catch(() => {});
  }, [fetchSetting, keyValues, state.password]);

  return { result: localState, refresh: fetchSetting };
};
