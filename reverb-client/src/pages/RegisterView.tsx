import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppRoutes } from "@/routes";
import { RegisterForm } from "@/components/register-form";

export default function RegisterView() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(AppRoutes.HOME);
    }
  }, [navigate, isAuthenticated]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <img
            alt="ReverbMD"
            src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
            className="mx-auto h-12 w-auto"
          />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            ReverbMD
          </h1>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}