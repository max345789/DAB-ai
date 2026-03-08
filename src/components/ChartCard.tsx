"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DataPoint = {
  date: string;
  value: number;
};

type Props = {
  title: string;
  data: DataPoint[];
  stroke: string;
};

export function ChartCard({ title, data, stroke }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-slate-700 dark:text-slate-200">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(15, 23, 42, 0.9)",
                border: "1px solid rgba(148, 163, 184, 0.2)",
              }}
            />
            <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
