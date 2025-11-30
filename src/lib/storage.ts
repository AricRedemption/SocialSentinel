import { Review, AnalysisResult } from "./types";

export interface HistoryRecord {
  id: string;
  createdAt: string;
  fileName?: string;
  productInfo: {
    mainAsin: string;
    title: string;
    totalReviews: number;
  };
  reviews: Review[];
  analysis: AnalysisResult;
}

const STORAGE_KEY = "social_sentinel_history";
const MAX_HISTORY = 50; // 最多保存50条历史记录

/**
 * 生成唯一的 ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 保存分析结果到本地存储
 */
export function saveHistory(
  reviews: Review[],
  analysis: AnalysisResult,
  fileName?: string
): string {
  const id = generateId();
  const record: HistoryRecord = {
    id,
    createdAt: new Date().toISOString(),
    fileName,
    productInfo: {
      mainAsin: analysis.productInfo.mainAsin,
      title: analysis.productInfo.title,
      totalReviews: analysis.productInfo.totalReviews,
    },
    reviews,
    analysis,
  };

  const history = getHistory();
  history.unshift(record); // 新记录放在最前面

  // 限制历史记录数量
  const limitedHistory = history.slice(0, MAX_HISTORY);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedHistory));
    return id;
  } catch (error) {
    console.error("保存历史记录失败:", error);
    // 如果存储空间不足，尝试删除最旧的记录
    if (error instanceof Error && error.name === "QuotaExceededError") {
      const reducedHistory = limitedHistory.slice(0, Math.floor(MAX_HISTORY / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedHistory));
      return id;
    }
    throw error;
  }
}

/**
 * 获取所有历史记录
 */
export function getHistory(): HistoryRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("读取历史记录失败:", error);
    return [];
  }
}

/**
 * 根据 ID 获取历史记录
 */
export function getHistoryById(id: string): HistoryRecord | null {
  const history = getHistory();
  return history.find((record) => record.id === id) || null;
}

/**
 * 删除历史记录
 */
export function deleteHistory(id: string): void {
  const history = getHistory();
  const filtered = history.filter((record) => record.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("删除历史记录失败:", error);
  }
}

/**
 * 清空所有历史记录
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("清空历史记录失败:", error);
  }
}


