"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  label?: string;
  className?: string;
}

export function TrendIndicator({ value, label, className }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive ? "text-green-600" : isNeutral ? "text-muted-foreground" : "text-red-600",
        className
      )}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : isNeutral ? (
        <Minus className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      <span>
        {isPositive ? "+" : ""}
        {value.toFixed(1)}%
      </span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </div>
  );
}
