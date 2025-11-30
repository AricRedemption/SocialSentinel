import { Review, AnalysisResult } from "./types";
import { LLMSettings } from "@/components/SettingsDialog";

export interface LLMAnalysisResponse {
  productInfo?: {
    mainAsin?: string;
    title?: string;
    category?: string;
    variantStatsByAsin?: { [asin: string]: number };
    variantStatsByModel?: { [model: string]: number };
  };
  starDistribution?: { [key: number]: number };
  starDistributionPercent?: { [key: number]: number };
  starDistributionText?: { [key: number]: string };
  sentimentAnalysis?: {
    positive: number;
    neutral: number;
    negative: number;
    summary: string;
  };
  topicClusters?: Array<{
    name: string;
    percentage: number;
    summary: string;
    examples: { en: string; cn: string }[];
  }>;
  userInsights?: {
    purchaseMotivations?: string[];
    unmetNeeds?: string[];
    personas?: string[];
  };
  prosCons?: {
    pros?: Array<{ summary: string; originalText: string; frequency: number }>;
    cons?: Array<{ summary: string; originalText: string; frequency: number }>;
  };
  returnReasons?: Array<{
    reason: string;
    evidence: string[];
    frequency: number;
  }>;
  improvementSuggestions?: Array<{
    suggestion: string;
    evidence: string;
    priority: "high" | "medium" | "low";
  }>;
  typicalReviews?: Array<{
    originalText: string;
    translatedText: string;
    rating: number;
    reviewUrl: string;
    aiInsight: string;
  }>;
}

export const analyzeWithLLM = async (
  reviews: Review[],
  settings: LLMSettings
): Promise<LLMAnalysisResponse> => {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviews,
        provider: settings.provider,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        const errorText = await response.text();
        throw new Error(`Analysis failed (${response.status}): ${errorText}`);
      }
      
      // 构建详细的错误信息
      const errorMessage = errorData.error || "Analysis failed";
      const errorDetails = errorData.details || errorData.received || {};
      
      let fullErrorMessage = `${errorMessage}`;
      if (Object.keys(errorDetails).length > 0) {
        fullErrorMessage += `\n详细信息: ${JSON.stringify(errorDetails, null, 2)}`;
      }
      
      throw new Error(fullErrorMessage);
    }

    const data = await response.json();

    // Handle raw text response (if LLM didn't return JSON)
    if (data.raw) {
      console.error("LLM returned non-JSON response:", {
        preview: data.preview,
        rawLength: data.raw?.length,
      });
      throw new Error(
        `LLM 返回了非 JSON 格式的响应。请检查模型配置。\n响应预览: ${data.preview || "无"}`
      );
    }

    // Check if response has error
    if (data.error) {
      throw new Error(data.error);
    }

    return data as LLMAnalysisResponse;
  } catch (error) {
    console.error("LLM Analysis Error:", error);
    throw error;
  }
};

