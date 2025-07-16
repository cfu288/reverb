import { useCallback } from "react";
import {
  encryptData,
  decryptData,
  generateEncryptionKey,
  unwrapKeyWithPassword,
  wrapKeyWithPassword,
  base64ToBytes,
  bytesToBase64,
} from "../../utils/stringEncryptionUtils";
import {
  LocalAppSettings,
  SettingResult,
  ENCRYPTED_FIELDS,
  KnownErrors,
  DEFAULT_SETTINGS,
  SettingsState,
} from "./types";

export const LOCAL_STORAGE_KEYS = {
  ENCRYPTION_DATA: "encryptionData",
};

export const useLocalAppSettingsHelper = (state: SettingsState) => {
  const storeSettings = useCallback(
    async (changedSettings: Partial<LocalAppSettings>) => {
      let encryptionKey: CryptoKey | null = null;
      const encryptionData = localStorage.getItem(
        LOCAL_STORAGE_KEYS.ENCRYPTION_DATA
      );

      if (!encryptionData && state.password) {
        encryptionKey = await generateEncryptionKey();
        const { wrappedKey, salt } = await wrapKeyWithPassword(
          encryptionKey,
          state.password
        );
        localStorage.setItem(
          LOCAL_STORAGE_KEYS.ENCRYPTION_DATA,
          JSON.stringify({
            key: bytesToBase64(wrappedKey),
            salt: bytesToBase64(salt),
          })
        );
      } else if (encryptionData && state.password) {
        const { key, salt } = JSON.parse(encryptionData);
        const wrappedKey = base64ToBytes(key);
        const saltBytes = base64ToBytes(salt);
        encryptionKey = await unwrapKeyWithPassword(
          wrappedKey,
          state.password,
          saltBytes
        );
      }

      for (const [key, value] of Object.entries(changedSettings)) {
        if (ENCRYPTED_FIELDS.includes(key)) {
          if (!state.password || !encryptionKey) {
            throw new Error("Password not set. Cannot store encrypted fields.");
          }
          const encryptedValue = await encryptData(
            value as string,
            encryptionKey
          );
          localStorage.setItem(key, encryptedValue);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
    },
    [state.password]
  );

  const getChangedSettings = useCallback(
    (newSettings: LocalAppSettings): Partial<LocalAppSettings> => {
      const changedSettings: Partial<LocalAppSettings> = {};
      for (const [key, value] of Object.entries(newSettings)) {
        const storedValue = localStorage.getItem(key);
        if (
          storedValue === null &&
          value === DEFAULT_SETTINGS[key as keyof LocalAppSettings]
        ) {
          continue;
        }
        if (storedValue !== JSON.stringify(value)) {
          changedSettings[key as keyof LocalAppSettings] = value;
        }
      }
      return changedSettings;
    },
    []
  );

  const getSetting = useCallback(
    async <K extends keyof LocalAppSettings>(
      key: K
    ): Promise<SettingResult<K>> => {
      try {
        if (!(key in DEFAULT_SETTINGS)) {
          return {
            status: "ERROR",
            errorCode: "SETTING_NOT_VALID",
            error: KnownErrors.SETTING_NOT_VALID,
          };
        }

        const settingValueToGet = localStorage.getItem(key);
        const encryptionData = localStorage.getItem(
          LOCAL_STORAGE_KEYS.ENCRYPTION_DATA
        );

        if (ENCRYPTED_FIELDS.includes(key)) {
          if (!encryptionData) {
            return {
              status: "ERROR",
              errorCode: "PASSWORD_NOT_INITIALIZED",
              error: KnownErrors.PASSWORD_NOT_INITIALIZED,
            };
          }
          if (!state.password) {
            return {
              status: "ERROR",
              errorCode: "PASSWORD_NOT_PROVIDED",
              error: KnownErrors.PASSWORD_NOT_PROVIDED,
            };
          }
          if (settingValueToGet !== null) {
            const { key: wrappedKeyBase64, salt: saltBase64 } =
              JSON.parse(encryptionData);
            const wrappedKey = base64ToBytes(wrappedKeyBase64);
            const salt = base64ToBytes(saltBase64);
            const unwrappedKey = await unwrapKeyWithPassword(
              wrappedKey,
              state.password,
              salt
            );
            const decryptedValue = await decryptData(
              settingValueToGet,
              unwrappedKey
            );
            return {
              status: "SUCCESS",
              value: decryptedValue as LocalAppSettings[K],
            };
          }
        }

        if (settingValueToGet === null) {
          const defaultValue = DEFAULT_SETTINGS[key];
          return {
            status: "SUCCESS",
            value: defaultValue as LocalAppSettings[K],
          };
        }

        return {
          status: "SUCCESS",
          value: JSON.parse(settingValueToGet) as LocalAppSettings[K],
        };
      } catch (error) {
        console.error(error);
        return {
          status: "ERROR",
          error: (error as Error).message,
          errorCode: "Unknown",
        };
      }
    },
    [state.password]
  );

  return { storeSettings, getChangedSettings, getSetting };
};
