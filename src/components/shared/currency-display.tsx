"use client";

import { cn } from "@/lib/utils";
import { formatCurrency, formatCompactNumber } from "@/lib/utils/formatters";

interface CurrencyDisplayProps {
  amount: number;
  compact?: boolean;
  className?: string;
}

export function CurrencyDisplay({ amount, compact = false, className }: CurrencyDisplayProps) {
  const formatted = compact ? `GHS ${formatCompactNumber(amount)}` : formatCurrency(amount);
  return <span className={cn("font-mono", className)}>{formatted}</span>;
}
