"use client";

import React, { useState, useEffect } from "react";
import { HistoryRecord, getHistory, deleteHistory } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { Clock, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface HistoryListProps {
  onSelect?: (id: string) => void;
}

export function HistoryList({ onSelect }: HistoryListProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadHistory();
    // 监听存储变化（当其他标签页保存新记录时）
    const handleStorageChange = () => {
      loadHistory();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loadHistory = () => {
    const records = getHistory();
    setHistory(records);
  };

  const handleView = (id: string) => {
    if (onSelect) {
      onSelect(id);
    } else {
      router.push(`/report/${id}`);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("确定要删除这条历史记录吗？")) {
      deleteHistory(id);
      loadHistory();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">历史记录</h2>
        <span className="text-sm text-slate-500">{history.length} 条记录</span>
      </div>
      <div className="space-y-3">
        {history.map((record) => (
          <Card
            key={record.id}
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleView(record.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <h3 className="font-medium text-slate-900 truncate">
                    {record.productInfo.title || record.fileName || "未命名报告"}
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(record.createdAt)}</span>
                  </div>
                  <span>ASIN: {record.productInfo.mainAsin}</span>
                  <span>{record.productInfo.totalReviews} 条评论</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDelete(e, record.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

