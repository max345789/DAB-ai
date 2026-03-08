"use client";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  label: string;
  value: string;
  change: string;
  trend: number[];
  href?: string;
};

export function MetricCard({ label, value, change, trend, href }: Props) {
  const chartData = trend.map((point, index) => ({ index, point }));

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-white/20 dark:from-white/10 dark:to-white/5" />
      <CardHeader>
        <CardTitle className="text-sm text-slate-500 dark:text-slate-400">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {value}
          </p>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-200">
            {change}
          </span>
        </div>
        <div className="h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                }}
              />
              <Line
                type="monotone"
                dataKey="point"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {href ? (
          <a
            href={href}
            className="text-xs text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            View Details
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
