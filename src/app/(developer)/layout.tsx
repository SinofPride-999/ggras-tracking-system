"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { PortalHeader } from "@/components/layout/portal-header";
import { useSidebar } from "@/components/layout/sidebar-context";
import { developerNav } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar items={developerNav} portalLabel="Developer Portal" />
      <PortalHeader items={developerNav} portalLabel="Developer Portal" />
      <main
        className={cn(
          "pt-0 transition-[padding-left] duration-200 ease-in-out",
          collapsed ? "md:pl-[68px]" : "md:pl-64",
        )}
      >
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
