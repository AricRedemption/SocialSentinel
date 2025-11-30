"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisResult } from "@/lib/types";
import { AlertTriangle, Quote } from "lucide-react";

interface ReturnReasonsProps {
  returnReasons?: AnalysisResult["returnReasons"];
}

export const ReturnReasons: React.FC<ReturnReasonsProps> = ({
  returnReasons,
}) => {
  if (!returnReasons || returnReasons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            退货原因与差评来源
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            {returnReasons === undefined
              ? "需要配置 API Key 以获取退货原因分析"
              : "未发现明显的退货原因"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          退货原因与差评来源
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {returnReasons.map((reason, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900 flex-1">
                  {reason.reason}
                </h4>
                <span className="ml-4 text-xs font-bold bg-orange-100 text-orange-800 px-2 py-1 rounded">
                  出现 {reason.frequency} 次
                </span>
              </div>
              <div className="mt-3 space-y-2">
                <div className="text-xs font-medium text-slate-600 mb-1">
                  相关评论证据：
                </div>
                {Array.isArray(reason.evidence) && reason.evidence.length > 0 ? (
                  reason.evidence.map((evidence, evIndex) => (
                    <div
                      key={evIndex}
                      className="flex gap-2 text-sm text-slate-700 bg-slate-50 p-2 rounded border-l-2 border-orange-300"
                    >
                      <Quote className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                      <p className="flex-1 italic">"{evidence}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">暂无证据</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

