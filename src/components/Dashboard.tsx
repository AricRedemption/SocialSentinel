"use client";

import React from "react";
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
import { Download, RefreshCw } from "lucide-react";

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
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-8 pb-20">
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
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-blue-50/50 rounded-full border border-blue-100">
            <span className="text-xs text-slate-500 font-medium">
              Powered by
            </span>
            <img
              src="/assets/coze/logo.png"
              alt="Coze"
              className="h-5 w-auto object-contain"
            />
          </div>
          <ConnectionStatusIndicator />
          <SettingsDialog />
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={18} />
            重新上传
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Download size={18} />
            导出报告
          </button>
        </div>
      </div>

      {/* 2.2.1 & 2.2.2 Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
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
        <h2 className="text-2xl font-bold text-slate-800 mb-4">主题聚类</h2>
        <TopicClusters clusters={analysis.topicClusters} />
      </section>

      {/* 2.3 User Insights */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-2xl font-bold text-slate-800">用户洞察</h2>
          <img
            src="/assets/coze/with-friends.png"
            alt="User Insights"
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
