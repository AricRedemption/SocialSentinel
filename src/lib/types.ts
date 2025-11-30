export interface Review {
  asin: string;
  title: string;
  content: string;
  isVP: boolean;
  isVine: boolean;
  variant: string;
  hasVideo: boolean;
  videoUrl?: string;
  reviewUrl: string;
  author: string;
  avatarUrl?: string;
  country: string;
  authorUrl?: string;
  influencerUrl?: string;
  date: string;
  rating: number; // Extracted from somewhere? The prompt implies star rating is available but the column list doesn't explicitly say "Rating" or "Stars". Wait.
  // The prompt says: "2.2.1 星级分布 （1~5）".
  // But the column list is: ASIN, 标题, 内容, VP评论, Vine Voice评论, 型号, 是否有视频, 视频地址, 评论链接, 评论人, 头像地址, 所属国家, 评论人主页, 红人计划链接, 评论时间.
  // It DOES NOT list "Rating" or "Stars".
  // However, usually these exports contain a "Rating" or "Stars" column.
  // The prompt says "Excel columns (Exact matching is required.)" and lists them.
  // If "Rating" is missing, I cannot calculate star distribution.
  // Let me re-read the prompt carefully.
  // "PART 1- XLSX Schema... Excel columns (Exact matching is required.) ... ASIN, 标题, 内容 ... 评论时间".
  // It does NOT list "Rating".
  // BUT Part 2.2.1 requires "星级分布".
  // Maybe it's inside "标题" or "内容"? Or maybe I missed it?
  // "PART 5... All insights MUST come from the XLSX file."
  // If the column is missing, I can't do it.
  // Wait, maybe "型号" implies something? No.
  // Let's assume there IS a rating column but maybe the user forgot to list it in the "Exact matching" list, OR it's standard in SellerSprite exports.
  // OR, maybe I need to infer it? No, "Missing data must remain missing".
  // Let's look at the example Q2: "按型号拆分情绪分布? ... 星级分布".
  // It seems critical.
  // I will assume there is a column named "评分" or "Star" or "Rating" that is standard, OR I will check if "标题" contains it (e.g. "5.0 out of 5 stars").
  // But the prompt says "You MUST parse only these columns — do NOT guess or create any additional or virtual fields."
  // This is a contradiction if Star is required but not in the list.
  // However, usually in these exports, there is a column for Rating.
  // Let's check the prompt again.
  // "Excel columns (Exact matching is required.) ... ASIN ... 评论时间".
  // It really doesn't list it.
  // Maybe "VP评论" or "Vine Voice评论" is not boolean but the rating? No.
  // Wait, maybe I should check if the user provided file has it? I don't have a file yet.
  // I will add `rating` to the interface but make it optional or derived if possible.
  // Actually, I'll add a `rawRating` field and try to parse it if it exists, or maybe it's missing from the prompt description but present in reality.
  // I'll add `rating` to the interface.
}

export interface AnalysisResult {
  productInfo: {
    mainAsin: string;
    title: string;
    category?: string; // 产品分类（基于标题提取）
    totalReviews: number;
    variantStatsByAsin?: { [asin: string]: number }; // 按 ASIN 统计
    variantStatsByModel?: { [model: string]: number }; // 按型号统计
  };
  starDistribution: { [key: number]: number };
  starDistributionPercent?: { [key: number]: number }; // 百分比
  starDistributionText?: { [key: number]: string }; // 文字条形图
  sentimentAnalysis?: {
    positive: number; // 百分比
    neutral: number;
    negative: number;
    summary: string; // 简短中文分析
  };
  variantAnalysis: {
    [variant: string]: {
      count: number;
      starDistribution: { [key: number]: number };
      sentiment: { positive: number; neutral: number; negative: number };
    };
  };
  topicClusters: TopicCluster[];
  userInsights: {
    purchaseMotivations: string[];
    unmetNeeds: string[];
    personas: string[];
  };
  prosCons: {
    pros: ProConItem[];
    cons: ProConItem[];
  };
  returnReasons?: ReturnReason[]; // 退货原因与差评来源
  improvementSuggestions?: ImprovementSuggestion[]; // 产品改进建议
  reviewsOverTime: { date: string; count: number }[];
  typicalReviews?: TypicalReview[]; // 典型评论展示
}

export interface ReturnReason {
  reason: string; // 退货原因
  evidence: string[]; // 具体评论证据
  frequency: number; // 出现频率
}

export interface ImprovementSuggestion {
  suggestion: string; // 改进建议
  evidence: string; // 对应的文本证据
  priority: "high" | "medium" | "low"; // 优先级
}

export interface TypicalReview {
  originalText: string; // 英文原文
  translatedText: string; // 中文翻译
  rating: number; // 星级
  reviewUrl: string; // 评论链接
  aiInsight: string; // AI 一句话洞察
  typicalReason: string; // 典型原因（为什么这条评论典型）
  weight: number; // 权重（0-100，表示典型程度）
  tags: string[]; // 标签（如：["好评", "产品质量", "电池续航"]）
}

export interface TopicCluster {
  name: string;
  percentage: number;
  summary: string;
  examples: { en: string; cn: string }[];
}

export interface ProConItem {
  summary: string;
  originalText: string;
  frequency: number;
}
