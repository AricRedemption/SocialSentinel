"use client";

import React, { useRef, useState } from "react";
import { AnalysisResult, Review } from "@/lib/types";
import { StarDistribution } from "./analysis/StarDistribution";
import { TopicClusters } from "./analysis/TopicClusters";
import { UserInsights } from "./analysis/UserInsights";
import { ReviewList } from "./analysis/ReviewList";
import { ReviewTrendChart } from "./analysis/ReviewTrendChart";
import { SentimentAnalysis } from "./analysis/SentimentAnalysis";
import { ReturnReasons } from "./analysis/ReturnReasons";
import { ImprovementSuggestions } from "./analysis/ImprovementSuggestions";
import { ChatInterface } from "./ChatInterface";
import { SettingsDialog } from "./SettingsDialog";
import { ConnectionStatusIndicator } from "./ConnectionStatusIndicator";
import { Download, RefreshCw, FileDown, Image as ImageIcon, Loader2, Printer } from "lucide-react";
import Image from "next/image";
import { exportToPDF, exportToPNG } from "@/lib/export-utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DashboardProps {
  analysis: AnalysisResult;
  reviews: Review[];
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  analysis,
  reviews,
  onReset,
}) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);

  // 预加载导出库，避免使用时加载失败
  React.useEffect(() => {
    const preloadLibraries = async () => {
      try {
        // 预加载但不执行，只是确保 chunk 已加载
        await Promise.all([
          import('html2canvas').catch(() => null),
          import('jspdf').catch(() => null),
        ]);
        setLibrariesLoaded(true);
      } catch (error) {
        console.warn('预加载导出库失败，将在使用时重试:', error);
        setLibrariesLoaded(true); // 仍然设置为 true，让重试机制处理
      }
    };
    preloadLibraries();
  }, []);

  const handleExport = async (format: 'pdf' | 'png') => {
    if (!dashboardRef.current) {
      alert('无法找到要导出的内容，请刷新页面后重试');
      return;
    }

    setIsExporting(true);
    setExportMenuOpen(false);

    try {
      // 等待元素完全渲染，包括所有AI生成的内容
      // 增加等待时间确保所有动态内容都已加载
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 再次检查元素
      if (!dashboardRef.current) {
        throw new Error('元素未准备好');
      }

      // 等待所有图片和图表加载完成
      const images = dashboardRef.current.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        if ((img as HTMLImageElement).complete) {
          return Promise.resolve();
        }
        return new Promise((resolve) => {
          (img as HTMLImageElement).onload = resolve;
          (img as HTMLImageElement).onerror = resolve;
          setTimeout(resolve, 1000); // 超时保护
        });
      });
      await Promise.all(imagePromises);

      // 等待图表渲染完成（Recharts 需要额外时间）
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 生成文件名（使用产品标题，清理特殊字符）
      const fileName = analysis.productInfo.title
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50) || '报告';

      if (format === 'pdf') {
        // PDF 使用 html2canvas + jsPDF
        await exportToPDF(dashboardRef.current, fileName);
      } else {
        await exportToPNG(dashboardRef.current, fileName);
      }
    } catch (error) {
      console.error('导出失败:', error);
      const errorMessage = error instanceof Error ? error.message : '导出失败，请重试';
      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dashboardRef} className="max-w-7xl mx-auto p-4 space-y-8 pb-20 print-content">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {analysis.productInfo.title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-slate-600 text-sm flex-wrap">
            <span>
              主 ASIN:{" "}
              <span className="font-mono font-medium text-slate-800">
                {analysis.productInfo.mainAsin}
              </span>
            </span>
            <span>•</span>
            <span>
              总评论数:{" "}
              <span className="font-medium text-slate-800">
                {analysis.productInfo.totalReviews}
              </span>
            </span>
            {analysis.productInfo.category && (
              <>
                <span>•</span>
                <span>
                  产品分类:{" "}
                  <span className="font-medium text-slate-800">
                    {analysis.productInfo.category}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-3 items-center no-print">
          <ConnectionStatusIndicator />
          <SettingsDialog />
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={18} />
            重新上传
          </button>
          <Popover open={exportMenuOpen} onOpenChange={setExportMenuOpen}>
            <PopoverTrigger asChild>
              <button
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    导出中...
                  </>
                ) : (
                  <>
            <Download size={18} />
            导出报告
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-1">
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 transition-colors text-left"
                >
                  <FileDown size={16} />
                  导出为 PDF
                </button>
                <button
                  onClick={() => handleExport('png')}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-slate-100 transition-colors text-left"
                >
                  <ImageIcon size={16} />
                  导出为 PNG
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2.2.1 & 2.2.2 Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-[400px]">
          <StarDistribution
            distribution={analysis.starDistribution}
            distributionPercent={analysis.starDistributionPercent}
            distributionText={analysis.starDistributionText}
          />
        </div>
        <div className="lg:col-span-2 h-[400px]">
          <ReviewTrendChart data={analysis.reviewsOverTime} />
        </div>
      </div>

      {/* 2.2.2 Sentiment Analysis */}
      {analysis.sentimentAnalysis && (
        <section>
          <SentimentAnalysis sentimentAnalysis={analysis.sentimentAnalysis} />
        </section>
      )}

      {/* Topic Clusters */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-slate-800">主题聚类</h2>
          <Image
            src="/assets/coze/waving-dark.png"
            alt="Topic Clusters"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </div>
        <TopicClusters clusters={analysis.topicClusters} />
      </section>

      {/* 2.3 User Insights */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-slate-800">用户洞察</h2>
          <Image
            src="/assets/coze/with-friends.png"
            alt="User Insights"
            width={40}
            height={40}
            className="h-10 w-auto object-contain"
          />
        </div>
        <UserInsights
          insights={analysis.userInsights}
          prosCons={analysis.prosCons}
        />
      </section>

      {/* 2.5 Return Reasons */}
      {analysis.returnReasons && analysis.returnReasons.length > 0 && (
        <section>
          <ReturnReasons returnReasons={analysis.returnReasons} />
        </section>
      )}

      {/* 2.6 Improvement Suggestions */}
      {analysis.improvementSuggestions &&
        analysis.improvementSuggestions.length > 0 && (
          <section>
            <ImprovementSuggestions
              improvementSuggestions={analysis.improvementSuggestions}
            />
          </section>
        )}

      {/* 2.7 Review List */}
      <section>
        <ReviewList
          reviews={reviews}
          typicalReviews={analysis.typicalReviews}
        />
      </section>

      {/* Part 4: Q&A */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">AI 智能问答</h2>
        <ChatInterface
          reviews={reviews}
          analysis={analysis}
          onReset={onReset}
        />
      </section>
    </div>
  );
};
