"use client";

import React, { useState } from "react";
import { Review, TypicalReview } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ExternalLink, Sparkles } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
  typicalReviews?: TypicalReview[];
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews, typicalReviews }) => {
  // 如果有典型评论，只显示典型评论（最多10条），按权重排序
  const displayReviews = typicalReviews && typicalReviews.length > 0 
    ? typicalReviews
        .slice()
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .slice(0, 10) // 最多显示10条
    : reviews.slice(0, 10).map(r => ({
        originalText: r.content,
        translatedText: r.content,
        rating: r.rating,
        reviewUrl: r.reviewUrl,
        aiInsight: undefined as string | undefined,
        typicalReason: undefined as string | undefined,
        weight: undefined as number | undefined,
        tags: [] as string[],
      }));
  
  const hasTypicalReviews = typicalReviews && typicalReviews.length > 0;
  
  // Helper to find matching review for AI insight
  const getReviewForInsight = (review: Review) => {
    if (!typicalReviews) return undefined;
    return typicalReviews.find(tr => 
      tr.originalText === review.content || 
      tr.reviewUrl === review.reviewUrl
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          典型评论展示
          {hasTypicalReviews 
            ? ` (AI 精选 ${displayReviews.length} 条，共 ${reviews.length} 条评论)`
            : ` (显示前 ${displayReviews.length} 条，共 ${reviews.length} 条)`
          }
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayReviews.map((item, index) => {
            const typicalReview = item as TypicalReview;
            const review = reviews.find(r => 
              r.content === typicalReview.originalText || 
              r.reviewUrl === typicalReview.reviewUrl
            );
            
            return (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i < Math.round(typicalReview.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300"
                        }
                      />
                    ))}
                  </div>
                  {typicalReview.weight !== undefined && (
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      权重: {typicalReview.weight}
                    </span>
                  )}
                  {review && (
                    <span className="text-xs text-slate-700">
                      {review.date}
                    </span>
                  )}
                </div>
                {typicalReview.reviewUrl && (
                  <a
                    href={typicalReview.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              {review && (
                <h4 className="font-semibold text-sm mb-1 text-slate-900">
                  {review.title}
                </h4>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-slate-900">
                  {typicalReview.originalText}
                </p>
                {typicalReview.translatedText && typicalReview.translatedText !== typicalReview.originalText && (
                  <p className="text-sm text-slate-600 italic">
                    中文翻译: {typicalReview.translatedText}
                  </p>
                )}
                
                {/* 典型原因 */}
                {typicalReview.typicalReason && (
                  <div className="mt-2 p-2 bg-amber-50 border-l-2 border-amber-400 rounded">
                    <div className="text-xs font-semibold text-amber-800 mb-1">典型原因</div>
                    <p className="text-sm text-amber-900">{typicalReview.typicalReason}</p>
                  </div>
                )}
                
                {/* AI 洞察 */}
                {typicalReview.aiInsight && (
                  <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 rounded">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-blue-800 mb-1">AI 洞察</div>
                        <p className="text-sm text-blue-900">{typicalReview.aiInsight}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 标签 */}
              {(typicalReview.tags && typicalReview.tags.length > 0) && (
                <div className="flex flex-wrap gap-2 text-xs mt-3">
                  {typicalReview.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* 评论元数据 */}
              {review && (
                <div className="flex flex-wrap gap-2 text-xs text-slate-700 mt-2">
                  {review.variant && (
                    <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      型号: {review.variant}
                    </span>
                  )}
                  {review.isVP && (
                    <span className="bg-green-50 text-green-800 px-2 py-1 rounded border border-green-100">
                      VP购买
                    </span>
                  )}
                  {review.isVine && (
                    <span className="bg-purple-50 text-purple-800 px-2 py-1 rounded border border-purple-100">
                      Vine Voice
                    </span>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </div>

        {!hasTypicalReviews && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            <p>提示：配置 API Key 后，AI 将自动提取最多 10 条最具代表性的典型评论，并标注典型原因、权重和标签。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
