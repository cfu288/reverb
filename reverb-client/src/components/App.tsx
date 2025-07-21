import { Route, Routes } from "react-router-dom";

import { Home } from "@/pages/Home";
import { ShowPDF } from "@/pages/ShowPDF";
import { GeneratePDF } from "@/pages/GeneratePDF";
import { TemplateConfig } from "@/pages/TemplateConfig";
import { CreateTemplate } from "@/pages/TemplateConfig/CreateTemplate";
import { EditTemplate } from "@/pages/TemplateConfig/EditTemplate";
import BPLogApp from "./BPTable/BPLogApp";
import { LocalAppSettingsProvider } from "../providers/LocalAppSettingsProvider/LocalAppSettingsProvider";
import { RealtimePatientListProvider } from "@/providers/RealtimePatientListProvider";
import { TemplatesProvider } from "@/providers/TemplatesProvider";
import { AppLayout } from "@/components/AppLayout";
import LoginView from "@/pages/LoginView";
import RegisterView from "@/pages/RegisterView";
import { AppRoutes } from "@/routes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TransmitProvider } from "@/providers/TransmitProvider";
import { TenantProvider } from "@/providers/TenantProvider";

// Wrapper component that provides all the necessary providers for protected routes
const ProtectedProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <TenantProvider>
      <TransmitProvider>
        <RealtimePatientListProvider>
          <TemplatesProvider>
            {children}
          </TemplatesProvider>
        </RealtimePatientListProvider>
      </TransmitProvider>
    </TenantProvider>
  );
};

const App = () => {
  return (
    <LocalAppSettingsProvider>
      <Routes>
        {/* Public routes */}
        <Route path={AppRoutes.LOGIN} element={<LoginView />} />
        <Route path={AppRoutes.REGISTER} element={<RegisterView />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedProviders><AppLayout /></ProtectedProviders>}>
            <Route path="/scutsheet/generate-pdf" element={<GeneratePDF />} />
            <Route path="/scutsheet/:templateId" element={<ShowPDF />} />
            <Route path="/bp-log" element={<BPLogApp />} />
            <Route path="/template-config" element={<TemplateConfig />} />
            <Route
              path="/template-config/create"
              element={<CreateTemplate />}
            />
            <Route
              path="/template-config/edit/:templateId"
              element={<EditTemplate />}
            />
            <Route
              path="*"
              element={
                <section className="bg-white dark:bg-gray-900">
                  <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
                    <div className="mx-auto max-w-screen-sm text-center">
                      <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
                        404
                      </h1>
                      <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
                        Something's missing.
                      </p>
                      <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
                        Sorry, we can't find that page. You'll find lots to
                        explore on the home page.{" "}
                      </p>
                      <a
                        href="/"
                        className="inline-flex text-white bg-primary-600 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4"
                      >
                        Back to Homepage
                      </a>
                    </div>
                  </div>
                </section>
              }
            />
          </Route>
          {/* Home route outside AppLayout but inside ProtectedProviders */}
          <Route path="/" element={<ProtectedProviders><Home /></ProtectedProviders>} />
        </Route>
      </Routes>
    </LocalAppSettingsProvider>
  );
};

export default App;