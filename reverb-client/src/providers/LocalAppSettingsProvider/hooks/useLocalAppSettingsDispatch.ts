import { useContext } from "react";
import { LocalAppSettingsDispatchContext } from "../context/LocalAppSettingsDispatchContext";

export const useLocalAppSettingsDispatch = () => {
  const dispatch = useContext(LocalAppSettingsDispatchContext);
  if (!dispatch) {
    throw new Error(
      "useLocalAppSettingsDispatch must be used within a LocalAppSettingsProvider"
    );
  }
  return dispatch;
};
