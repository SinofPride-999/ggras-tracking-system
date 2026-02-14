"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PortalSwitcher } from "./portal-switcher";
import { useSidebar } from "./sidebar-context";
import { ghanaColors } from "@/lib/constants/theme";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import type { NavItem } from "@/lib/constants/navigation";

interface SidebarProps {
  items: NavItem[];
  portalLabel: string;
}

/** Splits flat nav items into labelled groups for visual structure. */
function groupNavItems(
  items: NavItem[],
  portalLabel: string
): Array<{ heading: string; items: NavItem[] }> {
  if (portalLabel.toLowerCase().includes("admin")) {
    const oversight = items.filter((i) =>
      ["/overseer"].some((p) => i.href.startsWith(p))
    );
    const policy = items.filter((i) =>
      ["/rules"].some((p) => i.href.startsWith(p))
    );
    const people = items.filter((i) =>
      ["/users", "/audit"].some((p) => i.href.startsWith(p))
    );
    const system = items.filter((i) =>
      ["/settings"].some((p) => i.href.startsWith(p))
    );
    return [
      ...(oversight.length ? [{ heading: "Oversight", items: oversight }] : []),
      ...(policy.length ? [{ heading: "Policy & Tax", items: policy }] : []),
      ...(people.length ? [{ heading: "People & Audit", items: people }] : []),
      ...(system.length ? [{ heading: "System", items: system }] : []),
    ];
  }
  if (portalLabel.toLowerCase().includes("commission")) {
    const overview = items.filter((i) =>
      ["/dashboard", "/operators", "/revenue", "/tax"].some((p) =>
        i.href.startsWith(p)
      )
    );
    const health = items.filter((i) =>
      ["/feed-health", "/alerts", "/integrity", "/reports"].some((p) =>
        i.href.startsWith(p)
      )
    );
    return [
      ...(overview.length ? [{ heading: "Overview", items: overview }] : []),
      ...(health.length ? [{ heading: "Monitoring", items: health }] : []),
    ];
  }
  if (portalLabel.toLowerCase().includes("operator")) {
    const core = items.filter((i) =>
      ["/portal", "/api-keys", "/certificates"].some((p) =>
        i.href.startsWith(p)
      )
    );
    const dev = items.filter((i) =>
      ["/testing", "/status", "/feed"].some((p) => i.href.startsWith(p))
    );
    return [
      ...(core.length ? [{ heading: "Account", items: core }] : []),
      ...(dev.length ? [{ heading: "Integration", items: dev }] : []),
    ];
  }
  if (portalLabel.toLowerCase().includes("developer")) {
    return [{ heading: "My Work", items }];
  }
  return [{ heading: "Navigation", items }];
}

export function Sidebar({ items, portalLabel }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();
  const groups = groupNavItems(items, portalLabel);

  return (
    <div
      className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-50 transition-[width] duration-200 ease-in-out",
        collapsed ? "md:w-[68px]" : "md:w-64"
      )}
    >
      <div className="flex flex-col h-full border-r bg-card overflow-hidden">
        {/* Ghana flag bars */}
        <div className="flex w-full h-1.5 shrink-0">
          <div
            className="flex-1"
            style={{ backgroundColor: ghanaColors.red }}
          />
          <div
            className="flex-1"
            style={{ backgroundColor: ghanaColors.gold }}
          />
          <div
            className="flex-1"
            style={{ backgroundColor: ghanaColors.green }}
          />
        </div>

        {/* Logo & identity */}
        <div className="flex items-center gap-3 px-3 py-4 border-b min-h-[60px]">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <Image
              src="/ggras-logo.jpg"
              alt="GGRAS Logo"
              width={36}
              height={36}
              className="rounded-lg ring-2 ring-primary/10 transition-shadow group-hover:ring-primary/30 shrink-0"
            />
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-bold text-base tracking-tight block">
                  GGRAS
                </span>
                <span className="text-[11px] text-muted-foreground block leading-none truncate">
                  {portalLabel}
                </span>
              </div>
            )}
          </Link>
          {!collapsed && (
            <Badge
              variant="outline"
              className="ml-auto shrink-0 border-amber-300 bg-amber-50 text-amber-700 text-[10px] px-1.5 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700"
            >
              Demo
            </Badge>
          )}
        </div>

        {/* Portal Switcher */}
        {!collapsed && (
          <>
            <div className="px-3 py-3">
              <PortalSwitcher />
            </div>
            <Separator />
          </>
        )}

        {/* Grouped navigation */}
        <ScrollArea className="flex-1 py-1">
          <nav aria-label={`${portalLabel} navigation`}>
            {groups.map((group, gi) => (
              <div key={group.heading} className={cn(gi > 0 && "mt-4")}>
                {!collapsed && (
                  <p className="px-5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                    {group.heading}
                  </p>
                )}
                {collapsed && gi > 0 && (
                  <Separator className="mx-auto my-2 w-8" />
                )}
                <ul
                  className={cn(
                    "space-y-0.5",
                    collapsed ? "px-1.5" : "px-3"
                  )}
                >
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");

                    const linkContent = (
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "group/link relative flex items-center rounded-lg text-sm font-medium transition-all",
                          collapsed
                            ? "justify-center px-0 py-2.5"
                            : "gap-3 px-3 py-2",
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {isActive && !collapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary" />
                        )}
                        <item.icon
                          className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover/link:text-accent-foreground"
                          )}
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">
                              {item.label}
                            </span>
                            {item.badge && (
                              <Badge
                                variant={
                                  isActive ? "secondary" : "destructive"
                                }
                                className="h-5 min-w-[20px] justify-center px-1.5 text-[10px] font-bold"
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                        {collapsed && item.badge && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );

                    return (
                      <li key={item.href}>
                        {collapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="text-xs font-medium"
                            >
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          linkContent
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: ghanaColors.green }}
              />
              <p className="text-[11px] font-medium text-foreground/80">
                Ghana Gaming Commission
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">
              GGRAS v1.0 &middot; Regulatory Assurance System
            </p>
          </div>
        )}

        {/* Collapse toggle */}
        <div
          className={cn(
            "border-t py-2 flex",
            collapsed ? "justify-center px-1.5" : "px-3"
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="h-8 w-8"
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
