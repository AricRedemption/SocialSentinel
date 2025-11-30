"use client";

import React from "react";
import { TopicCluster } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TopicClustersProps {
  clusters: TopicCluster[];
}

export const TopicClusters: React.FC<TopicClustersProps> = ({ clusters }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {clusters.map((cluster, index) => (
        <Card
          key={index}
          className="overflow-hidden hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium">
              {cluster.name}
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {cluster.percentage}%
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-800 mb-4 min-h-[40px]">
              {cluster.summary}
            </p>
            <div className="bg-slate-50 p-3 rounded-lg text-xs space-y-2">
              {cluster.examples.map((ex, i) => (
                <div key={i} className="border-l-2 border-blue-400 pl-2">
                  <p className="font-medium text-slate-900">
                    &quot;{ex.cn}&quot;
                  </p>
                  <p className="text-slate-700 italic">&quot;{ex.en}&quot;</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
