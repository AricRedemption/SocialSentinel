"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getHistoryById } from "@/lib/storage";
import { HistoryRecord } from "@/lib/storage";
import { Dashboard } from "@/components/Dashboard";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<HistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id as string;
    if (!id) {
      setError("无效的报告 ID");
      setLoading(false);
      return;
    }

    const historyRecord = getHistoryById(id);
    if (!historyRecord) {
      setError("报告不存在或已被删除");
      setLoading(false);
      return;
    }

    setRecord(historyRecord);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-slate-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {error || "报告不存在"}
          </h1>
          <p className="text-slate-600 mb-6">
            {error || "该报告可能已被删除或不存在"}
          </p>
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">
              {record.productInfo.title || record.fileName || "历史报告"}
            </h1>
            <p className="text-sm text-slate-500">
              {new Date(record.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
        </div>
      </div>
      <Dashboard
        analysis={record.analysis}
        reviews={record.reviews}
        onReset={() => router.push("/")}
      />
    </div>
  );
}



