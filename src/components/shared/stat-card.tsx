"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, icon: Icon, className }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <div className={cn("flex items-center text-xs mt-1", isPositive ? "text-green-600" : "text-red-600")}>
            {isPositive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
            {isPositive ? "+" : ""}
            {trend.value.toFixed(1)}% {trend.label}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
