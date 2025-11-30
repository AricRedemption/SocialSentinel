"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisResult } from "@/lib/types";
import { Lightbulb, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ImprovementSuggestionsProps {
  improvementSuggestions?: AnalysisResult["improvementSuggestions"];
}

export const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({
  improvementSuggestions,
}) => {
  if (!improvementSuggestions || improvementSuggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            产品改进建议
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            {improvementSuggestions === undefined
              ? "需要配置 API Key 以获取改进建议"
              : "暂无改进建议"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  const getPriorityLabel = (priority: "high" | "medium" | "low") => {
    switch (priority) {
      case "high":
        return "高优先级";
      case "medium":
        return "中优先级";
      case "low":
        return "低优先级";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          产品改进建议
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {improvementSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900 flex-1">
                  {suggestion.suggestion}
                </h4>
                <Badge
                  className={`ml-4 ${getPriorityColor(suggestion.priority)}`}
                >
                  {getPriorityLabel(suggestion.priority)}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2 text-sm text-slate-600 bg-slate-50 p-2 rounded border-l-2 border-yellow-300">
                <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="flex-1">
                  <span className="font-medium">依据：</span> {suggestion.evidence}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

