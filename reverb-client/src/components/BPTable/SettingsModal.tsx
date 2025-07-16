import { useLocalAppSettingsDispatch } from "@/providers/LocalAppSettingsProvider/hooks/useLocalAppSettingsDispatch";
import { useLocalSetting } from "@/providers/LocalAppSettingsProvider/hooks/useLocalSetting";
import { Modal } from "../Modal";
import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export const SettingsModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { result: oaiKeyResult, refresh } = useLocalSetting(
    "openAIConfig.apiKey"
  );

  const [passwordInput, setPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const dispatch = useLocalAppSettingsDispatch();

  const handleSave = (apiKeyInput: string, passwordInput: string) => {
    dispatch({
      type: "SET_PASSWORD",
      payload: passwordInput,
    });
    dispatch({
      type: "UPSERT",
      payload: { "openAIConfig.apiKey": apiKeyInput },
    });
    refresh().then(() => {
      if (oaiKeyResult.status !== "ERROR") {
        onClose();
      }
    });
  };

  useEffect(() => {
    if (oaiKeyResult.status === "SUCCESS") {
      setApiKeyInput(oaiKeyResult.value || "");
    }
  }, [oaiKeyResult]);

  const validatePassword = () => {
    let error = "";
    if (passwordInput.length < 15) {
      error = "Password should be at least 15 characters long.";
    } else if (passwordInput.length > 64) {
      error = "Password must not exceed 64 characters.";
    } else if (
      oaiKeyResult.status === "ERROR" &&
      oaiKeyResult.errorCode === "PASSWORD_NOT_INITIALIZED" &&
      passwordInput !== confirmPasswordInput
    ) {
      error = "Passwords do not match.";
    }

    setPasswordError(error);
    return error === "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePassword()) {
      handleSave(apiKeyInput, passwordInput);
    }
  };

  const modalTitle = (() => {
    if (oaiKeyResult.status === "ERROR") {
      if (oaiKeyResult.errorCode === "PASSWORD_NOT_INITIALIZED") {
        return "Provide a new password";
      } else if (oaiKeyResult.errorCode === "PASSWORD_NOT_PROVIDED") {
        return "Login with your password";
      } else {
        return "Error";
      }
    }
    return "Settings";
  })();

  const errorMessage = (() => {
    if (oaiKeyResult.status === "ERROR") {
      if (oaiKeyResult.errorCode === "PASSWORD_NOT_INITIALIZED") {
        return "Please enter a new password to initialize access.";
      } else if (oaiKeyResult.errorCode === "PASSWORD_NOT_PROVIDED") {
        return "Please provide your password to access settings.";
      } else {
        return "An unexpected error occurred. Please try again.";
      }
    } else {
      return "";
    }
  })();

  const passwordLengthValid = passwordInput.length >= 8;
  const passwordsMatch =
    passwordInput === confirmPasswordInput &&
    passwordInput !== "" &&
    confirmPasswordInput !== "";

  return (
    <Modal
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      footerItems={
        <Button
          type="submit"
          form="settings-form"
          disabled={
            !passwordLengthValid ||
            (oaiKeyResult.status === "ERROR" &&
              oaiKeyResult.errorCode === "PASSWORD_NOT_INITIALIZED" &&
              !passwordsMatch)
          }
        >
          Save
        </Button>
      }
    >
      <form id="settings-form" onSubmit={handleSubmit}>
        {oaiKeyResult.status === "ERROR" ? (
          <>
            <p className="text-sm text-gray-600">{errorMessage}</p>

            {oaiKeyResult.errorCode === "PASSWORD_NOT_INITIALIZED" && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Your password must meet the following requirements:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  <li
                    className={`list-none ${
                      passwordLengthValid ? "text-green-600" : ""
                    }`}
                  >
                    {passwordLengthValid ? "✔" : "✖"} At least 8 characters
                  </li>
                  <li
                    className={`list-none ${
                      passwordsMatch ? "text-green-600" : ""
                    }`}
                  >
                    {passwordsMatch ? "✔" : "✖"} Passwords must match
                  </li>
                </ul>
              </div>
            )}

            {oaiKeyResult.errorCode === "Unknown" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Error: {oaiKeyResult.error}
                </label>
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>
            {oaiKeyResult.errorCode === "PASSWORD_NOT_INITIALIZED" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                />
              </div>
            )}
            {passwordError && (
              <p className="text-sm text-red-600 mt-2">{passwordError}</p>
            )}
          </>
        ) : (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              OpenAI API Key
            </label>
            <Input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
          </div>
        )}
      </form>
    </Modal>
  );
};
