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
  distributionPercent?: { [key: number]: number };
  distributionText?: { [key: number]: string };
}

export const StarDistribution: React.FC<StarDistributionProps> = ({
  distribution,
  distributionPercent,
  distributionText,
}) => {
  const data = [
    { name: "5星", count: distribution[5] || 0, color: "#22c55e", percent: distributionPercent?.[5] || 0, text: distributionText?.[5] || "" },
    { name: "4星", count: distribution[4] || 0, color: "#84cc16", percent: distributionPercent?.[4] || 0, text: distributionText?.[4] || "" },
    { name: "3星", count: distribution[3] || 0, color: "#eab308", percent: distributionPercent?.[3] || 0, text: distributionText?.[3] || "" },
    { name: "2星", count: distribution[2] || 0, color: "#f97316", percent: distributionPercent?.[2] || 0, text: distributionText?.[2] || "" },
    { name: "1星", count: distribution[1] || 0, color: "#ef4444", percent: distributionPercent?.[1] || 0, text: distributionText?.[1] || "" },
  ];

  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>星级分布 (总计: {total})</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <div className="h-[240px] mb-4 flex-shrink-0">
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
        </div>
        
        {/* 文字形式条形图 */}
        <div className="space-y-2 border-t pt-4 flex-1 overflow-y-auto">
          <div className="text-sm font-semibold text-slate-700 mb-3">文字形式分布</div>
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-12">{entry.name}</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm font-mono text-slate-800 min-w-[100px]">
                  {entry.text || "█".repeat(Math.round((entry.count / total) * 20))}
                </span>
                <span className="text-xs text-slate-500">
                  {entry.count} ({entry.percent}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
