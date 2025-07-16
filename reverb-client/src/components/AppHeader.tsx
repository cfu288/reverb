import { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";

interface AppHeaderProps {
  children?: ReactNode;
  rightContent?: ReactNode;
}

export function AppHeader({ children, rightContent }: AppHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>{children}</BreadcrumbList>
      </Breadcrumb>
      {rightContent && <div className="ml-auto flex gap-2">{rightContent}</div>}
    </header>
  );
}
