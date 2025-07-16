export type SettingsState = {
  settings: LocalAppSettings;
  password: string | null;
};

export type SettingsAction =
  | { type: "SET"; payload: LocalAppSettings }
  | { type: "UPSERT"; payload: Partial<LocalAppSettings> }
  | { type: "CLEAR" }
  | { type: "SET_PASSWORD"; payload: string | null };

export const ENCRYPTED_FIELDS = ["openAIConfig.apiKey"];

export type SettingResult<K extends keyof LocalAppSettings> =
  | { status: "LOADING" }
  | {
      status: "ERROR";
      error: (typeof KnownErrors)[KnownErrorCodes];
      errorCode: KnownErrorCodes;
    }
  | UnknownError
  | { status: "SUCCESS"; value: LocalAppSettings[K] };

export type KnownErrorCodes =
  | "PASSWORD_NOT_PROVIDED"
  | "PASSWORD_NOT_INITIALIZED"
  | "SETTING_NOT_VALID";

export type UnknownError = {
  status: "ERROR";
  error: string;
  errorCode: "Unknown";
};

export type KnownErrors = Record<KnownErrorCodes, string>;

export const KnownErrors: KnownErrors = {
  PASSWORD_NOT_PROVIDED: "Password not provided - please enter a password.",
  PASSWORD_NOT_INITIALIZED:
    "No password has been set. Please create a password.",
  SETTING_NOT_VALID: "A setting was attemted to be accessed that is not valid.",
} as const;

export type LocalAppSettings = {
  "openAIConfig.apiKey"?: string;
  "openAIConfig.model": string;
};

export const DEFAULT_SETTINGS: LocalAppSettings = {
  "openAIConfig.apiKey": "",
  "openAIConfig.model": "gpt-4o-mini",
};
