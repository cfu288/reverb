import { createContext } from "react";
import { SettingsState } from "../types";

export const LocalAppSettingsContext = createContext<SettingsState | null>(
  null
);
