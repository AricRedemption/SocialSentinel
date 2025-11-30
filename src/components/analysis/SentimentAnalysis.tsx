"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisResult } from "@/lib/types";
import { TrendingUp, Minus, TrendingDown } from "lucide-react";

interface SentimentAnalysisProps {
  sentimentAnalysis?: AnalysisResult["sentimentAnalysis"];
}

export const SentimentAnalysis: React.FC<SentimentAnalysisProps> = ({
  sentimentAnalysis,
}) => {
  if (!sentimentAnalysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>情绪倾向分析</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            需要配置 API Key 以获取情绪分析数据
          </p>
        </CardContent>
      </Card>
    );
  }

  const { positive, neutral, negative, summary } = sentimentAnalysis;

  return (
    <Card>
      <CardHeader>
        <CardTitle>情绪倾向分析</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-4 bg-green-50 rounded-lg border border-green-100">
              <TrendingUp className="h-8 w-8 text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-700">{positive}%</div>
              <div className="text-sm text-green-600 mt-1">积极</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <Minus className="h-8 w-8 text-slate-600 mb-2" />
              <div className="text-2xl font-bold text-slate-700">{neutral}%</div>
              <div className="text-sm text-slate-600 mt-1">中性</div>
            </div>
            <div className="flex flex-col items-center p-4 bg-red-50 rounded-lg border border-red-100">
              <TrendingDown className="h-8 w-8 text-red-600 mb-2" />
              <div className="text-2xl font-bold text-red-700">{negative}%</div>
              <div className="text-sm text-red-600 mt-1">消极</div>
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold text-slate-800 mb-2">分析摘要</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">积极情绪</span>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${positive}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-slate-800 w-12 text-right">
                {positive}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">中性情绪</span>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 transition-all"
                    style={{ width: `${neutral}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-slate-800 w-12 text-right">
                {neutral}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">消极情绪</span>
              <div className="flex-1 mx-4">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all"
                    style={{ width: `${negative}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-medium text-slate-800 w-12 text-right">
                {negative}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



