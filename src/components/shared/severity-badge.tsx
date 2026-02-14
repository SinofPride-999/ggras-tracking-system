"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: "low" | "medium" | "high" | "critical";
  className?: string;
}

const config: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-blue-100 text-blue-700 border-blue-200" },
  medium: { label: "Medium", className: "bg-amber-100 text-amber-700 border-amber-200" },
  high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", className: "bg-red-100 text-red-700 border-red-200" },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const c = config[severity] || config.low;
  return (
    <Badge variant="outline" className={cn("font-medium", c.className, className)}>
      {c.label}
    </Badge>
  );
}
