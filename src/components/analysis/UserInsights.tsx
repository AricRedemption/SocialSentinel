"use client";

import React from "react";
import { AnalysisResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  ShoppingCart,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

interface UserInsightsProps {
  insights: AnalysisResult["userInsights"];
  prosCons: AnalysisResult["prosCons"];
}

export const UserInsights: React.FC<UserInsightsProps> = ({
  insights,
  prosCons,
}) => {
  // 安全获取数组，确保始终是数组类型
  const personas = Array.isArray(insights?.personas) ? insights.personas : [];
  const purchaseMotivations = Array.isArray(insights?.purchaseMotivations) 
    ? insights.purchaseMotivations 
    : [];
  const unmetNeeds = Array.isArray(insights?.unmetNeeds) 
    ? insights.unmetNeeds 
    : [];
  const pros = Array.isArray(prosCons?.pros) ? prosCons.pros : [];
  const cons = Array.isArray(prosCons?.cons) ? prosCons.cons : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">消费者画像</CardTitle>
            <User className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {personas.length > 0 ? (
                personas.map((persona, i) => (
                  <span
                    key={i}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {persona}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">暂无数据</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">购买动机</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-slate-800">
              {purchaseMotivations.length > 0 ? (
                purchaseMotivations.map((m, i) => (
                  <li key={i}>{m}</li>
                ))
              ) : (
                <li className="text-slate-500">暂无数据</li>
              )}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未满足需求</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground ml-auto" />
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-sm text-slate-800">
              {unmetNeeds.length > 0 ? (
                unmetNeeds.map((n, i) => (
                  <li key={i}>{n}</li>
                ))
              ) : (
                <li className="text-slate-500">暂无数据</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <ThumbsUp size={20} /> 产品优点
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pros.length > 0 ? (
              pros.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.summary}</p>
                    <p className="text-xs text-slate-600 italic">
                      "{item.originalText}"
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded">
                    {item.frequency}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">暂无数据</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <ThumbsDown size={20} /> 产品缺点
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cons.length > 0 ? (
              cons.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-900">{item.summary}</p>
                    <p className="text-xs text-slate-600 italic">
                      "{item.originalText}"
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-red-100 text-red-800 px-2 py-1 rounded">
                    {item.frequency}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">暂无数据</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
