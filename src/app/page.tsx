"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Dashboard } from "@/components/Dashboard";
import { parseExcel } from "@/lib/excel-parser";
import { analyzeReviews } from "@/lib/analysis";
import { Review, AnalysisResult } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export default function Home() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      // 1. Parse Excel
      const parsedReviews = await parseExcel(file);

      // 2. Analyze Data
      const result = analyzeReviews(parsedReviews);

      // 3. Update State
      setReviews(parsedReviews);
      setAnalysis(result);
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
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {!reviews || !analysis ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
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
