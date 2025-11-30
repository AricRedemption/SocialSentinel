"use client";

import React from "react";
import { TopicCluster } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopicClustersProps {
  clusters: TopicCluster[];
}

export const TopicClusters: React.FC<TopicClustersProps> = ({ clusters }) => {
  // 安全检查：确保 clusters 是数组
  const safeClusters = Array.isArray(clusters) ? clusters : [];

  if (safeClusters.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <p>暂无主题聚类数据</p>
        <p className="text-sm mt-2">需要配置 API Key 以获取主题聚类分析</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {safeClusters.map((cluster, index) => {
        // 安全检查：确保 examples 是数组
        const examples = Array.isArray(cluster?.examples) ? cluster.examples : [];
        
        return (
          <Card
            key={index}
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg font-medium">
                {cluster.name || "未知主题"}
              </CardTitle>
              <Badge variant="secondary" className="text-sm">
                {cluster.percentage || 0}%
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-800 mb-4 min-h-[40px]">
                {cluster.summary || "暂无摘要"}
              </p>
              {examples.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2">
                  {examples.map((ex, i) => (
                    <div key={i} className="border-l-2 border-blue-400 pl-2">
                      <p className="font-medium text-slate-900">
                        &quot;{ex.cn || ex.en || ""}&quot;
                      </p>
                      {ex.en && (
                        <p className="text-slate-700 italic">&quot;{ex.en}&quot;</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
