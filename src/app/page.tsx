"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Dashboard } from "@/components/Dashboard";
import { parseExcel } from "@/lib/excel-parser";
import { analyzeReviews } from "@/lib/analysis";
import { Review, AnalysisResult } from "@/lib/types";
import { AlertCircle, Info } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ConnectionStatusIndicator } from "@/components/ConnectionStatusIndicator";
import { saveHistory } from "@/lib/storage";
import { HistoryList } from "@/components/HistoryList";
import { useRouter } from "next/navigation";

export default function Home() {
  const { settings, isConfigured } = useSettings();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisError(null);
    
    // 先清除旧数据，确保重新上传时清除所有状态
    setReviews(null);
    setAnalysis(null);
    setCurrentReportId(null);
    
    try {
      // 1. Parse Excel
      const parsedReviews = await parseExcel(file);

      // 2. Check API configuration
      if (!isConfigured || !settings?.apiKey) {
        setAnalysisError(
          "未配置 API Key，将仅显示基础统计。请在右上角设置中配置 API Key 以获取完整分析。"
        );
      }

      // 3. Analyze Data (async now)
      const result = await analyzeReviews(parsedReviews, settings);

      // 4. Save to history and get report ID
      const reportId = saveHistory(parsedReviews, result, file.name);
      setCurrentReportId(reportId);

      // 5. Navigate to report detail page
      router.push(`/report/${reportId}`);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "解析文件时发生错误，请检查文件格式。";
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setReviews(null);
    setAnalysis(null);
    setError(null);
    setAnalysisError(null);
    setCurrentReportId(null);
  };

  const handleHistorySelect = (id: string) => {
    router.push(`/report/${id}`);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {!reviews || !analysis ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          {/* 文件上传页面的设置按钮 */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <ConnectionStatusIndicator />
            <SettingsDialog />
          </div>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Amazon Review Intelligence
            </h1>
            <p className="text-slate-500">亚马逊评论智能分析系统</p>
          </div>

          <FileUpload
            onFileSelect={handleFileSelect}
            isAnalyzing={isAnalyzing}
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-2 max-w-md animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle size={20} className="shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {analysisError && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg flex items-center gap-2 max-w-md animate-in fade-in slide-in-from-bottom-2">
              <Info size={20} className="shrink-0" />
              <p>{analysisError}</p>
            </div>
          )}

          {/* 历史记录列表 */}
          <div className="w-full max-w-4xl mt-12 pb-8">
            <HistoryList onSelect={handleHistorySelect} />
          </div>
        </div>
      ) : (
        <Dashboard
          analysis={analysis}
          reviews={reviews}
          onReset={handleReset}
        />
      )}
    </main>
  );
}
