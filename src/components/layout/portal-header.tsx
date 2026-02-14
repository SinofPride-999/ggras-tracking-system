"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { PortalSwitcher } from "./portal-switcher";
import { useSidebar } from "./sidebar-context";
import { ghanaColors } from "@/lib/constants/theme";
import type { NavItem } from "@/lib/constants/navigation";

interface PortalHeaderProps {
  items: NavItem[];
  portalLabel: string;
}

function usePageTitle(pathname: string, items: NavItem[], portalLabel: string) {
  return useMemo(() => {
    const match = items.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
    );
    return match?.label || portalLabel;
  }, [pathname, items, portalLabel]);
}

export function PortalHeader({ items, portalLabel }: PortalHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { collapsed } = useSidebar();
  const pageTitle = usePageTitle(pathname, items, portalLabel);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-[padding-left] duration-200 ease-in-out",
        collapsed ? "md:pl-[68px]" : "md:pl-64",
      )}
    >
      <div className="flex h-14 items-center gap-4 px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex w-full h-1.5 shrink-0">
              <div className="flex-1" style={{ backgroundColor: ghanaColors.red }} />
              <div className="flex-1" style={{ backgroundColor: ghanaColors.gold }} />
              <div className="flex-1" style={{ backgroundColor: ghanaColors.green }} />
            </div>
            <div className="flex items-center gap-3 px-4 py-4 border-b">
              <Image
                src="/ggras-logo.jpg"
                alt="GGRAS Logo"
                width={36}
                height={36}
                className="rounded-lg ring-2 ring-primary/10"
              />
              <div className="min-w-0">
                <span className="font-bold text-base block">GGRAS Tracker</span>
                <span className="text-[11px] text-muted-foreground block leading-none truncate">
                  {portalLabel}
                </span>
              </div>
              <Badge
                variant="outline"
                className="ml-auto shrink-0 border-blue-300 bg-blue-50 text-blue-700 text-[10px] px-1.5"
              >
                Live
              </Badge>
            </div>
            <div className="px-3 py-3">
              <PortalSwitcher />
            </div>
            <nav className="space-y-0.5 px-3 py-2" aria-label="Mobile navigation">
              {items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <span className="shrink-0 font-medium text-foreground/60">{portalLabel}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
          <span className="font-semibold text-foreground truncate">{pageTitle}</span>
        </div>

        <div className="md:hidden flex items-center min-w-0">
          <span className="font-semibold text-sm truncate">{pageTitle}</span>
        </div>

        <div className="flex-1" />

        <Separator orientation="vertical" className="hidden sm:block h-6" />

        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => toast.success("Signed out successfully")}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}

