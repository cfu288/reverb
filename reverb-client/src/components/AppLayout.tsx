import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { TenantSwitcherProvider, useTenantSwitcher } from "@/contexts/TenantSwitcherContext";
import { TenantSwitcherModal } from "@/components/TenantSwitcherModal";
import { WebSocketStatus } from "@/components/WebSocketStatus";

interface AppLayoutProps {
  children?: ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const { isOpen, closeTenantSwitcher } = useTenantSwitcher();

  return (
    <>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "19rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>{children || <Outlet />}</SidebarInset>
      </SidebarProvider>
      <TenantSwitcherModal
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) closeTenantSwitcher();
        }}
      />
      <WebSocketStatus />
    </>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TenantSwitcherProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </TenantSwitcherProvider>
  );
}
