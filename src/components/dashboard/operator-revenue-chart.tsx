"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { chartColors } from "@/lib/constants/theme";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RevenueTrendPoint } from "@/types";

interface OperatorRevenueChartProps {
  trends: RevenueTrendPoint[];
}

export function OperatorRevenueChart({ trends }: OperatorRevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Trend (30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="stakesGradOp" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartColors.stakes}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColors.stakes}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="ggrGradOp" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={chartColors.ggr}
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor={chartColors.ggr}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(val: string) =>
                  new Date(val).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })
                }
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(val: number) =>
                  `${(val / 1_000_000).toFixed(1)}M`
                }
                className="text-xs"
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), ""]}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                }
              />
              <Area
                type="monotone"
                dataKey="stakes"
                stroke={chartColors.stakes}
                fill="url(#stakesGradOp)"
                strokeWidth={2}
                name="Stakes"
              />
              <Area
                type="monotone"
                dataKey="ggr"
                stroke={chartColors.ggr}
                fill="url(#ggrGradOp)"
                strokeWidth={2}
                name="GGR"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: chartColors.stakes }}
            />
            <span className="text-sm text-muted-foreground">Stakes</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: chartColors.ggr }}
            />
            <span className="text-sm text-muted-foreground">GGR</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
