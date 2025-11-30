import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getAnalysisPrompt } from "@/lib/system-prompt";
import { Review } from "@/lib/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    // 先尝试解析请求体
    let body;
    try {
      body = await req.json();
    } catch (parseError: any) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { 
          error: "Invalid JSON in request body",
          details: parseError.message 
        },
        { status: 400 }
      );
    }

    const { reviews, provider, apiKey, baseUrl, model } = body;

    // 详细的参数检查
    if (!apiKey || (typeof apiKey === 'string' && apiKey.trim() === '')) {
      console.error("Missing or empty API Key");
      return NextResponse.json(
        { 
          error: "Missing API Key",
          received: {
            hasApiKey: !!apiKey,
            apiKeyType: typeof apiKey,
            provider,
            hasReviews: !!reviews,
            reviewsType: Array.isArray(reviews) ? 'array' : typeof reviews,
            reviewsLength: Array.isArray(reviews) ? reviews.length : 'N/A'
          }
        },
        { status: 400 }
      );
    }

    if (!reviews) {
      console.error("No reviews provided");
      return NextResponse.json(
        { 
          error: "No reviews provided",
          received: {
            hasReviews: false,
            reviewsType: typeof reviews,
            provider,
            hasApiKey: !!apiKey
          }
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(reviews)) {
      console.error("Reviews is not an array:", typeof reviews);
      return NextResponse.json(
        { 
          error: "Reviews must be an array",
          received: {
            reviewsType: typeof reviews,
            reviewsValue: reviews
          }
        },
        { status: 400 }
      );
    }

    if (reviews.length === 0) {
      console.error("Reviews array is empty");
      return NextResponse.json(
        { 
          error: "Reviews array is empty",
          received: {
            reviewsLength: 0,
            provider,
            hasApiKey: !!apiKey
          }
        },
        { status: 400 }
      );
    }

    // Prepare reviews data for LLM (limit to avoid token limits)
    const reviewsData = reviews.slice(0, 500).map((r: Review) => ({
      asin: r.asin,
      title: r.title,
      content: r.content,
      rating: r.rating,
      variant: r.variant,
      date: r.date,
    }));

    const prompt = getAnalysisPrompt(JSON.stringify(reviewsData, null, 2));

    let analysisResult: string;

    // 智谱 AI 使用 Anthropic 兼容的 API，所以也使用 Anthropic SDK
    if (provider === "claude" || provider === "zhipu") {
      const anthropic = new Anthropic({
        apiKey: apiKey,
        baseURL: baseUrl || undefined,
      });

      const response = await anthropic.messages.create({
        model: model || (provider === "zhipu" ? "glm-4.6" : "claude-3-5-sonnet-20240620"),
        max_tokens: 8192,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      // 安全检查：确保 response.content 存在且不为空
      if (!response.content || !Array.isArray(response.content) || response.content.length === 0) {
        throw new Error(`${provider === "zhipu" ? "智谱 AI" : "Claude"} API returned empty or invalid response`);
      }

      const firstContent = response.content[0];
      if (!firstContent) {
        throw new Error(`${provider === "zhipu" ? "智谱 AI" : "Claude"} API response content is empty`);
      }

      // 安全访问 firstContent 的属性
      if (firstContent.type === "text" && firstContent.text) {
        analysisResult = firstContent.text;
        // 记录响应预览（仅开发环境）
        if (process.env.NODE_ENV === "development") {
          console.log(`${provider === "zhipu" ? "智谱 AI" : "Claude"} Response preview:`, {
            length: analysisResult.length,
            firstChars: analysisResult.substring(0, 200),
            lastChars: analysisResult.substring(Math.max(0, analysisResult.length - 200)),
          });
        }
      } else {
        // 如果不是文本类型，尝试序列化整个内容
        analysisResult = JSON.stringify(response.content);
      }
    } else {
      // OpenAI & DeepSeek (compatible)
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl,
        dangerouslyAllowBrowser: true,
      });

      let response;
      try {
        // 构建请求参数
        const requestParams: any = {
        model: model || "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "你是一个专业的 Amazon 评论分析专家。请严格按照用户要求生成 JSON 格式的分析结果。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 8192,
        };

        // 某些模型可能不支持 response_format，先尝试使用
        // 如果失败，会在 catch 中重试不使用它
        try {
          requestParams.response_format = { type: "json_object" };
          response = await openai.chat.completions.create(requestParams);
        } catch (formatError: any) {
          // 如果 response_format 不支持，尝试不使用它
          console.warn("response_format not supported, retrying without it:", formatError.message);
          delete requestParams.response_format;
          response = await openai.chat.completions.create(requestParams);
        }
      } catch (apiError: any) {
        console.error("OpenAI API call failed:", {
          error: apiError.message,
          status: apiError.status,
          code: apiError.code,
          type: apiError.type,
          response: apiError.response?.data,
        });
        throw new Error(
          `OpenAI API call failed: ${apiError.message || "Unknown error"}`
        );
      }

      // 记录响应结构以便调试
      console.log("OpenAI API Response:", {
        hasResponse: !!response,
        hasChoices: !!response?.choices,
        choicesLength: response?.choices?.length,
        firstChoice: response?.choices?.[0],
      });

      // 安全检查：确保 response.choices 存在且不为空
      if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        console.error("Invalid OpenAI response structure:", JSON.stringify(response, null, 2));
        throw new Error(
          `OpenAI API returned empty or invalid response. Response: ${JSON.stringify(response)}`
        );
      }

      const firstChoice = response.choices[0];
      if (!firstChoice || !firstChoice.message) {
        console.error("Invalid first choice structure:", JSON.stringify(firstChoice, null, 2));
        throw new Error(
          `OpenAI API response choice is invalid. Choice: ${JSON.stringify(firstChoice)}`
        );
      }

      analysisResult = firstChoice.message.content || "{}";
      
      if (!analysisResult || analysisResult === "{}") {
        console.error("Empty analysis result from OpenAI");
        throw new Error("OpenAI API returned empty content");
      }
    }

    // Try to parse JSON response with multiple strategies
    let parsed: any;
    
    try {
      // Strategy 1: Direct JSON parse
      parsed = JSON.parse(analysisResult);
      return NextResponse.json(parsed);
    } catch (e1) {
      // Strategy 2: Extract JSON from markdown code blocks (```json ... ```)
      // First, try to extract everything between ```json and ```
      const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
      const codeBlockMatch = analysisResult.match(codeBlockRegex);
      if (codeBlockMatch && codeBlockMatch[1]) {
        try {
          const codeContent = codeBlockMatch[1].trim();
          // Find the JSON object boundaries
          const jsonStart = codeContent.indexOf('{');
          const jsonEnd = codeContent.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const jsonStr = codeContent.substring(jsonStart, jsonEnd + 1);
            parsed = JSON.parse(jsonStr);
            console.log("Successfully parsed JSON from markdown code block");
        return NextResponse.json(parsed);
          }
        } catch (e2: any) {
          console.warn("Failed to parse JSON from markdown block:", e2?.message || e2);
        }
      }
      
      // Strategy 2b: Try a more aggressive extraction - find all content between first ``` and last ```
      const firstBacktick = analysisResult.indexOf('```');
      const lastBacktick = analysisResult.lastIndexOf('```');
      if (firstBacktick !== -1 && lastBacktick !== -1 && lastBacktick > firstBacktick + 3) {
        try {
          const extracted = analysisResult.substring(firstBacktick + 3, lastBacktick).trim();
          // Remove "json" if present at the start
          const cleaned = extracted.replace(/^json\s*/i, '').trim();
          const jsonStart = cleaned.indexOf('{');
          const jsonEnd = cleaned.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
            parsed = JSON.parse(jsonStr);
            console.log("Successfully parsed JSON using aggressive extraction");
            return NextResponse.json(parsed);
          }
          } catch (e2b: any) {
            console.warn("Failed aggressive extraction:", e2b?.message || e2b);
          }
      }

      // Strategy 3: Find JSON object by matching braces (more robust)
      // Find the first { and match it with the last } to get complete JSON
      let jsonStart = analysisResult.indexOf('{');
      let jsonEnd = analysisResult.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        // Try to extract and parse the JSON
        let jsonCandidate = analysisResult.substring(jsonStart, jsonEnd + 1);
        
        // Try parsing directly
        try {
          parsed = JSON.parse(jsonCandidate);
          return NextResponse.json(parsed);
        } catch (e3) {
          // If direct parse fails, try to clean it up
          // Remove any markdown code block markers that might be inside
          jsonCandidate = jsonCandidate.replace(/```(?:json)?\s*/g, '').replace(/\s*```/g, '');
          try {
            parsed = JSON.parse(jsonCandidate);
            return NextResponse.json(parsed);
            } catch (e4: any) {
              console.warn("Failed to parse JSON object after cleaning:", e4?.message || e4);
            }
        }
      }

      // Strategy 4: Try to clean the entire response
      let cleaned = analysisResult.trim();
      // Remove markdown code block markers
      cleaned = cleaned.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');
      // Find JSON boundaries again after cleaning
      jsonStart = cleaned.indexOf('{');
      jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        try {
          parsed = JSON.parse(cleaned);
          return NextResponse.json(parsed);
          } catch (e5: any) {
            console.warn("Failed to parse cleaned JSON:", e5?.message || e5);
          }
      }

      // Log the raw response for debugging
      console.error("Failed to parse JSON response. Raw response:", {
        length: analysisResult.length,
        preview: analysisResult.substring(0, 500),
        provider,
        jsonStart,
        jsonEnd,
      });

      // If still not JSON, return as text (frontend will handle)
      return NextResponse.json({
        raw: analysisResult,
        error: "Failed to parse JSON response",
        preview: analysisResult.substring(0, 200),
      });
    }
  } catch (error: any) {
    console.error("Analysis API Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      // 如果是 OpenAI 错误，记录更多信息
      status: error.status,
      code: error.code,
      type: error.type,
    });
    
    // 返回更详细的错误信息
    const errorMessage = error.message || "Analysis failed";
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? {
          stack: error.stack,
          name: error.name,
          status: error.status,
          code: error.code,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

