"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "live" | "delayed" | "offline" | "active" | "inactive" | "suspended";
  className?: string;
}

const config: Record<string, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-green-100 text-green-700 border-green-200" },
  active: { label: "Active", className: "bg-green-100 text-green-700 border-green-200" },
  delayed: { label: "Delayed", className: "bg-amber-100 text-amber-700 border-amber-200" },
  offline: { label: "Offline", className: "bg-red-100 text-red-700 border-red-200" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-700 border-gray-200" },
  suspended: { label: "Suspended", className: "bg-red-100 text-red-700 border-red-200" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const c = config[status] || config.inactive;
  return (
    <Badge variant="outline" className={cn("font-medium", c.className, className)}>
      {(status === "live" || status === "active") && (
        <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse" />
      )}
      {status === "delayed" && (
        <span className="mr-1.5 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      )}
      {status === "offline" && (
        <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500" />
      )}
      {c.label}
    </Badge>
  );
}
