import { createContext } from "react";
import { SettingsAction } from "../types";

export const LocalAppSettingsDispatchContext =
  createContext<React.Dispatch<SettingsAction> | null>(null);
