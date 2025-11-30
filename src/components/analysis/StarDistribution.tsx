"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StarDistributionProps {
  distribution: { [key: number]: number };
}

export const StarDistribution: React.FC<StarDistributionProps> = ({
  distribution,
}) => {
  const data = [
    { name: "5星", count: distribution[5] || 0, color: "#22c55e" },
    { name: "4星", count: distribution[4] || 0, color: "#84cc16" },
    { name: "3星", count: distribution[3] || 0, color: "#eab308" },
    { name: "2星", count: distribution[2] || 0, color: "#f97316" },
    { name: "1星", count: distribution[1] || 0, color: "#ef4444" },
  ];

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>星级分布 (总计: {total})</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={40}
              tick={{ fontSize: 12, fill: "#334155" }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                color: "#1e293b",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={30}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
