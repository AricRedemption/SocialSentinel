"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User } from "lucide-react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review, AnalysisResult } from "@/lib/types";
import { useSettings } from "@/lib/settings-context";

interface ChatInterfaceProps {
  reviews: Review[];
  analysis?: AnalysisResult;
  onReset?: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  reviews,
  analysis,
  onReset,
}) => {
  const { settings, isConfigured } = useSettings();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "您好！我是您的评论分析助手。您可以问我关于这些评论的任何问题。如需配置 AI 模型，请点击页面右上角的设置按钮。",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousAnalysisRef = useRef<AnalysisResult | undefined>(analysis);

  // 当分析数据变化时（重新上传或新分析），清除聊天历史
  useEffect(() => {
    // 如果之前有分析数据，现在变为 null 或 undefined，说明是重新上传
    if (previousAnalysisRef.current && !analysis) {
      setMessages([
        {
          role: "assistant",
          content:
            "已清除之前的对话记录。请上传新的评论文件，我会根据新文件重新进行分析。",
        },
      ]);
    }
    // 如果分析数据从 null 变为有值，说明是新文件上传完成
    else if (!previousAnalysisRef.current && analysis) {
      setMessages([
        {
          role: "assistant",
          content:
            "您好！我是您的评论分析助手。我已经完成了对新上传文件的分析，您可以问我关于这些评论的任何问题。",
        },
      ]);
    }
    // 如果分析数据发生变化（可能是重新分析），也清除历史
    else if (
      previousAnalysisRef.current &&
      analysis &&
      previousAnalysisRef.current.productInfo.mainAsin !==
        analysis.productInfo.mainAsin
    ) {
      setMessages([
        {
          role: "assistant",
          content:
            "已切换到新的分析数据。我可以回答您关于当前评论数据的任何问题。",
        },
      ]);
    }

    previousAnalysisRef.current = analysis;
  }, [analysis]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getRelevantContext = (
    query: string,
    reviews: Review[],
    analysis?: AnalysisResult
  ) => {
    const contextParts: string[] = [];

    // 1. 基础统计信息
    contextParts.push(`=== 基础统计信息 ===`);
    contextParts.push(`总评论数: ${reviews.length}`);
    if (analysis) {
      contextParts.push(`主 ASIN: ${analysis.productInfo.mainAsin}`);
      contextParts.push(`产品标题: ${analysis.productInfo.title}`);
      if (analysis.productInfo.category) {
        contextParts.push(`产品分类: ${analysis.productInfo.category}`);
      }

      // 星级分布（详细）
      contextParts.push(`\n星级分布:`);
      [5, 4, 3, 2, 1].forEach((star) => {
        const count = analysis.starDistribution[star] || 0;
        const percent = analysis.starDistributionPercent?.[star] || 0;
        const text = analysis.starDistributionText?.[star] || "";
        contextParts.push(`  ${star}星: ${count}条 (${percent}%) ${text}`);
      });

      // 变体统计
      if (analysis.productInfo.variantStatsByAsin) {
        contextParts.push(`\n按 ASIN 统计:`);
        Object.entries(analysis.productInfo.variantStatsByAsin).forEach(
          ([asin, count]) => {
            contextParts.push(`  ${asin}: ${count}条`);
          }
        );
      }
      if (analysis.productInfo.variantStatsByModel) {
        contextParts.push(`\n按型号统计:`);
        Object.entries(analysis.productInfo.variantStatsByModel).forEach(
          ([model, count]) => {
            contextParts.push(`  ${model}: ${count}条`);
          }
        );
      }
    }

    // 2. 完整的分析结果
    if (analysis) {
      contextParts.push(`\n=== 完整分析结果 ===`);

      // 情绪分析
      if (analysis.sentimentAnalysis) {
        contextParts.push(`\n情绪分析:`);
        contextParts.push(`  积极: ${analysis.sentimentAnalysis.positive}%`);
        contextParts.push(`  中性: ${analysis.sentimentAnalysis.neutral}%`);
        contextParts.push(`  消极: ${analysis.sentimentAnalysis.negative}%`);
        contextParts.push(`  摘要: ${analysis.sentimentAnalysis.summary}`);
      }

      // 主题聚类（完整）
      if (analysis.topicClusters && analysis.topicClusters.length > 0) {
        contextParts.push(`\n主题聚类 (${analysis.topicClusters.length} 个):`);
        analysis.topicClusters.forEach((cluster, i) => {
          contextParts.push(
            `  ${i + 1}. ${cluster.name} (${cluster.percentage}%)`
          );
          contextParts.push(`     摘要: ${cluster.summary}`);
          if (cluster.examples && cluster.examples.length > 0) {
            cluster.examples.slice(0, 2).forEach((ex) => {
              contextParts.push(`     示例: "${ex.en}" / "${ex.cn}"`);
            });
          }
        });
      }

      // 用户洞察（完整）
      if (analysis.userInsights) {
        contextParts.push(`\n用户洞察:`);
        if (
          analysis.userInsights.purchaseMotivations &&
          analysis.userInsights.purchaseMotivations.length > 0
        ) {
          contextParts.push(`  购买动机:`);
          analysis.userInsights.purchaseMotivations.forEach((m, i) => {
            contextParts.push(`    ${i + 1}. ${m}`);
          });
        }
        if (
          analysis.userInsights.unmetNeeds &&
          analysis.userInsights.unmetNeeds.length > 0
        ) {
          contextParts.push(`  未满足需求:`);
          analysis.userInsights.unmetNeeds.forEach((n, i) => {
            contextParts.push(`    ${i + 1}. ${n}`);
          });
        }
        if (
          analysis.userInsights.personas &&
          analysis.userInsights.personas.length > 0
        ) {
          contextParts.push(`  消费者画像:`);
          analysis.userInsights.personas.forEach((p, i) => {
            contextParts.push(`    ${i + 1}. ${p}`);
          });
        }
      }

      // 产品优缺点（完整）
      if (analysis.prosCons) {
        if (analysis.prosCons.pros && analysis.prosCons.pros.length > 0) {
          contextParts.push(
            `\n产品优点 (${analysis.prosCons.pros.length} 条):`
          );
          analysis.prosCons.pros.forEach((pro, i) => {
            contextParts.push(
              `  ${i + 1}. ${pro.summary} (频率: ${pro.frequency}%)`
            );
            contextParts.push(`     原文: "${pro.originalText}"`);
          });
        }
        if (analysis.prosCons.cons && analysis.prosCons.cons.length > 0) {
          contextParts.push(
            `\n产品缺点 (${analysis.prosCons.cons.length} 条):`
          );
          analysis.prosCons.cons.forEach((con, i) => {
            contextParts.push(
              `  ${i + 1}. ${con.summary} (频率: ${con.frequency}%)`
            );
            contextParts.push(`     原文: "${con.originalText}"`);
          });
        }
      }

      // 退货原因
      if (analysis.returnReasons && analysis.returnReasons.length > 0) {
        contextParts.push(`\n退货原因 (${analysis.returnReasons.length} 个):`);
        analysis.returnReasons.forEach((reason, i) => {
          contextParts.push(
            `  ${i + 1}. ${reason.reason} (出现 ${reason.frequency} 次)`
          );
          if (reason.evidence && reason.evidence.length > 0) {
            reason.evidence.slice(0, 2).forEach((ev) => {
              contextParts.push(`     证据: "${ev}"`);
            });
          }
        });
      }

      // 改进建议
      if (
        analysis.improvementSuggestions &&
        analysis.improvementSuggestions.length > 0
      ) {
        contextParts.push(
          `\n改进建议 (${analysis.improvementSuggestions.length} 条):`
        );
        analysis.improvementSuggestions.forEach((suggestion, i) => {
          contextParts.push(
            `  ${i + 1}. [${suggestion.priority}] ${suggestion.suggestion}`
          );
          contextParts.push(`     依据: ${suggestion.evidence}`);
        });
      }

      // 典型评论
      if (analysis.typicalReviews && analysis.typicalReviews.length > 0) {
        contextParts.push(`\n典型评论 (${analysis.typicalReviews.length} 条):`);
        analysis.typicalReviews.slice(0, 5).forEach((review, i) => {
          contextParts.push(
            `  ${i + 1}. [${review.rating}星] ${review.originalText}`
          );
          contextParts.push(`     翻译: ${review.translatedText}`);
          contextParts.push(`     AI洞察: ${review.aiInsight}`);
        });
      }

      // 时间趋势（如果有）
      if (analysis.reviewsOverTime && analysis.reviewsOverTime.length > 0) {
        contextParts.push(`\n评论时间趋势:`);
        const recent = analysis.reviewsOverTime.slice(-10);
        recent.forEach((item) => {
          contextParts.push(`  ${item.date}: ${item.count}条`);
        });
      }
    }

    // 3. 相关评论样本（根据查询关键词筛选）
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 1);
    let relevant = reviews;

    if (keywords.length > 0) {
      const filtered = reviews.filter((r) =>
        keywords.some(
          (k) =>
            r.content?.toLowerCase().includes(k) ||
            r.title?.toLowerCase().includes(k) ||
            r.variant?.toLowerCase().includes(k)
        )
      );
      if (filtered.length > 0) {
        relevant = filtered;
      }
    }

    // 限制评论数量以避免 token 限制
    const sampleCount = Math.min(15, relevant.length);
    const sample = relevant
      .slice(0, sampleCount)
      .map(
        (r) =>
          `- [${r.rating}星] ${r.title || "无标题"}: ${
            r.content?.substring(0, 200) || ""
          } (型号: ${r.variant || "未知"}, ASIN: ${r.asin || "未知"})`
      )
      .join("\n");

    contextParts.push(
      `\n=== 相关评论样本 (显示 ${sampleCount}/${relevant.length} 条) ===`
    );
    contextParts.push(sample);

    return contextParts.join("\n");
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim().toLowerCase();

    // 检测重新上传关键词
    const resetKeywords = [
      "重新上传",
      "换一个表",
      "重新选择文件",
      "upload new file",
      "upload again",
      "重新开始",
      "清空",
      "重置",
    ];

    if (resetKeywords.some((keyword) => userMessage.includes(keyword))) {
      setInput("");
      // 清除所有消息历史
      setMessages([
        {
          role: "assistant",
          content:
            "已清除所有对话记录。请上传新的评论 xlsx 文件，我会根据新文件重新进行完整分析。",
        },
      ]);
      if (onReset) {
        onReset();
      }
      return;
    }

    if (!isConfigured || !settings?.apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "请先在页面右上角的设置中配置 API Key。",
        },
      ]);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setIsLoading(true);

    try {
      const context = getRelevantContext(input, reviews, analysis);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .concat({ role: "user", content: userMessage })
            .map((m) => ({ role: m.role, content: m.content })), // Send history
          provider: settings.provider,
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
          context: context,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        assistantMessage += text;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantMessage;
          return newMessages;
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "发生未知错误";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b py-3">
        <CardTitle>AI 智能问答</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          ref={scrollRef}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg flex gap-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white border shadow-sm rounded-bl-none text-slate-900"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="mt-1 shrink-0 w-8 h-8 rounded-full overflow-hidden bg-blue-50 border border-blue-100 p-1">
                    <Image
                      src="/assets/coze/goggles.png"
                      width={32}
                      height={32}
                      className="w-full h-full object-contain"
                      alt="AI"
                    />
                  </div>
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <User size={20} className="mt-1 shrink-0 opacity-80" />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                <div className="w-6 h-6 shrink-0">
                  <Image
                    src="/assets/coze/goggles.png"
                    width={24}
                    height={24}
                    className="w-full h-full object-contain animate-pulse"
                    alt="Thinking"
                  />
                </div>
                <span className="text-sm text-slate-700 animate-pulse">
                  正在思考...
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                settings?.apiKey ? "输入您的问题..." : "请先配置 API Key"
              }
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
