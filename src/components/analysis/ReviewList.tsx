"use client";

import React, { useState } from "react";
import { Review } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ExternalLink } from "lucide-react";

interface ReviewListProps {
  reviews: Review[];
}

export const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.ceil(reviews.length / pageSize);

  const currentReviews = reviews.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle>典型评论展示 ({reviews.length} 条)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {currentReviews.map((review, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={
                        i < Math.round(review.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-slate-300"
                      }
                    />
                  ))}
                  <span className="text-xs text-slate-700 ml-2">
                    {review.date}
                  </span>
                </div>
                {review.reviewUrl && (
                  <a
                    href={review.reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>

              <h4 className="font-semibold text-sm mb-1 text-slate-900">
                {review.title}
              </h4>
              <p className="text-sm text-slate-900 mb-2">{review.content}</p>

              <div className="flex flex-wrap gap-2 text-xs text-slate-700">
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
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-sm flex items-center">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
            >
              下一页
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
