import React, { useReducer, useEffect } from "react";
import { DEFAULT_SETTINGS, SettingsState, SettingsAction } from "./types";
import { useLocalAppSettingsHelper } from "./helpers";
import { LocalAppSettingsDispatchContext } from "./context/LocalAppSettingsDispatchContext";
import { LocalAppSettingsContext } from "./context/LocalAppSettingsContext";

const settingsReducer = (
  state: SettingsState,
  action: SettingsAction
): SettingsState => {
  switch (action.type) {
    case "SET":
      return { ...state, settings: action.payload };
    case "UPSERT":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    case "CLEAR":
      return { ...state, settings: DEFAULT_SETTINGS };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    default:
      return state;
  }
};

export const LocalAppSettingsProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(settingsReducer, {
    settings: DEFAULT_SETTINGS,
    password: null,
  });

  const { storeSettings, getChangedSettings } =
    useLocalAppSettingsHelper(state);

  useEffect(() => {
    const changedSettings = getChangedSettings(state.settings);
    storeSettings(changedSettings).catch(console.error);
  }, [state.settings, state.password, storeSettings, getChangedSettings]);

  return (
    <LocalAppSettingsDispatchContext.Provider value={dispatch}>
      <LocalAppSettingsContext.Provider value={state}>
        {children}
      </LocalAppSettingsContext.Provider>
    </LocalAppSettingsDispatchContext.Provider>
  );
};
