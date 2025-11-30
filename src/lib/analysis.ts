import { Review, AnalysisResult } from './types';
import { analyzeWithLLM, LLMAnalysisResponse } from './llm-analyzer';
import { LLMSettings } from '@/components/SettingsDialog';

// 常见评论短语，用于判断标题是否合适
const commonReviewPhrases = ['loved it', 'great product', 'highly recommend', 'best purchase', 'works perfectly', 'disappointed', 'average', 'good but', 'waste of money', 'stopped working'];

// 基础统计分析（不依赖 LLM）
export const calculateBasicStats = (reviews: Review[]) => {
    // 1. Product Info
    const asinCounts: { [key: string]: number } = {};
    let maxAsin = '';
    let maxAsinCount = 0;

    reviews.forEach(r => {
        if (r.asin) {
            asinCounts[r.asin] = (asinCounts[r.asin] || 0) + 1;
            if (asinCounts[r.asin] > maxAsinCount) {
                maxAsinCount = asinCounts[r.asin];
                maxAsin = r.asin;
            }
        }
    });

    // 提取产品标题：优先使用主ASIN对应的标题，如果标题是评论标题（太短或像"Loved it"），则尝试从评论内容中提取
    let title = reviews.find(r => r.asin === maxAsin)?.title || reviews[0]?.title || 'Unknown Product';
    
    // 如果标题太短（少于10个字符）或看起来像评论标题（包含常见评论短语），尝试从评论内容中提取产品名称
    const isLikelyReviewTitle = commonReviewPhrases.some(phrase => title.toLowerCase().includes(phrase)) || title.length < 10;
    
    if (isLikelyReviewTitle) {
      // 尝试从评论内容中提取产品名称（查找最常见的名词短语）
      // 这里简化处理，使用主ASIN对应的第一个较长标题，或者使用"产品 [主ASIN]"
      const alternativeTitle = reviews
        .filter(r => r.asin === maxAsin && r.title && r.title.length > 15)
        .map(r => r.title)
        .find(t => t && t.length > 15);
      
      if (alternativeTitle) {
        title = alternativeTitle;
      } else {
        // 如果找不到合适的标题，使用通用格式
        title = `产品 ${maxAsin}`;
      }
    }

    // 2. Star Distribution
    const starDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
        const rating = Math.round(r.rating || 0);
        if (rating >= 1 && rating <= 5) {
            starDistribution[rating]++;
        }
    });

    // 3. Variant Analysis
    const variantAnalysis: AnalysisResult['variantAnalysis'] = {};
    reviews.forEach(r => {
        const variant = r.variant || 'Unknown';
        if (!variantAnalysis[variant]) {
            variantAnalysis[variant] = {
                count: 0,
                starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                sentiment: { positive: 0, neutral: 0, negative: 0 }
            };
        }

        variantAnalysis[variant].count++;
        const rating = Math.round(r.rating || 0);
        if (rating >= 1 && rating <= 5) {
            variantAnalysis[variant].starDistribution[rating]++;
        }

        // Mock Sentiment based on rating
        if (rating >= 4) variantAnalysis[variant].sentiment.positive++;
        else if (rating === 3) variantAnalysis[variant].sentiment.neutral++;
        else variantAnalysis[variant].sentiment.negative++;
    });

    // Calculate star distribution percentages
    const total = Object.values(starDistribution).reduce((a, b) => a + b, 0);
    const starDistributionPercent: { [key: number]: number } = {};
    const starDistributionText: { [key: number]: string } = {};
    
    for (let i = 1; i <= 5; i++) {
        if (total > 0) {
            starDistributionPercent[i] = Math.round((starDistribution[i] / total) * 100);
            const bars = Math.round((starDistribution[i] / total) * 20); // 20 chars max
            starDistributionText[i] = '█'.repeat(bars);
        } else {
            starDistributionPercent[i] = 0;
            starDistributionText[i] = '';
        }
    }

    // Calculate variant stats by ASIN and Model
    const variantStatsByAsin: { [asin: string]: number } = {};
    const variantStatsByModel: { [model: string]: number } = {};
    
    reviews.forEach(r => {
        if (r.asin) {
            variantStatsByAsin[r.asin] = (variantStatsByAsin[r.asin] || 0) + 1;
        }
        if (r.variant) {
            variantStatsByModel[r.variant] = (variantStatsByModel[r.variant] || 0) + 1;
        }
    });

    // 7. Reviews Over Time
    const reviewsByDate: { [key: string]: number } = {};
    reviews.forEach(r => {
        if (r.date) {
            // Normalize date format if needed, assuming YYYY-MM-DD
            const date = r.date.split('T')[0];
            reviewsByDate[date] = (reviewsByDate[date] || 0) + 1;
        }
    });

    const reviewsOverTime = Object.entries(reviewsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        productInfo: {
            mainAsin: maxAsin,
            title: title,
            totalReviews: reviews.length,
            variantStatsByAsin,
            variantStatsByModel,
        },
        starDistribution,
        starDistributionPercent,
        starDistributionText,
        variantAnalysis,
        reviewsOverTime,
        // These will be filled by LLM analysis
        topicClusters: [],
        userInsights: {
            purchaseMotivations: [],
            unmetNeeds: [],
            personas: [],
        },
        prosCons: {
            pros: [],
            cons: [],
        },
    };
};

// 辅助函数：将百分比字符串转换为数字
const parsePercentage = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        // 处理 "57%" 或 "57" 格式
        const num = parseFloat(value.replace('%', ''));
        return isNaN(num) ? 0 : num;
    }
    if (value && typeof value === 'object' && 'percentage' in value) {
        // 处理 {percentage: "57%"} 格式
        return parsePercentage(value.percentage);
    }
    return 0;
};

// 合并 LLM 分析结果
const mergeLLMResults = (
    basicStats: AnalysisResult,
    llmResults: LLMAnalysisResponse
): AnalysisResult => {
    // 转换 sentimentAnalysis 格式
    let sentimentAnalysis = basicStats.sentimentAnalysis;
    if (llmResults.sentimentAnalysis) {
        const llmSentiment = llmResults.sentimentAnalysis;
        // 处理不同的数据格式
        if (typeof llmSentiment === 'object') {
            sentimentAnalysis = {
                positive: parsePercentage(
                    (llmSentiment as any).positive?.percentage || 
                    (llmSentiment as any).positive || 
                    0
                ),
                neutral: parsePercentage(
                    (llmSentiment as any).neutral?.percentage || 
                    (llmSentiment as any).neutral || 
                    0
                ),
                negative: parsePercentage(
                    (llmSentiment as any).negative?.percentage || 
                    (llmSentiment as any).negative || 
                    0
                ),
                summary: (llmSentiment as any).summary || (llmSentiment as any).analysis || '',
            };
        }
    }

    // 转换 topicClusters 格式
    let topicClusters = basicStats.topicClusters;
    if (llmResults.topicClusters && Array.isArray(llmResults.topicClusters)) {
        topicClusters = llmResults.topicClusters.map((cluster: any) => ({
            name: cluster.name || cluster.topicName || '未知主题',
            percentage: parsePercentage(cluster.percentage),
            summary: cluster.summary || '',
            examples: cluster.examples || (cluster.typicalSnippet ? [{
                en: cluster.typicalSnippet.original || cluster.typicalSnippet.en || '',
                cn: cluster.typicalSnippet.translation || cluster.typicalSnippet.cn || '',
            }] : []),
        }));
    }

    // 转换 userInsights 格式
    let userInsights = basicStats.userInsights;
    if (llmResults.userInsights) {
        const llmInsights = llmResults.userInsights as any;
        userInsights = {
            purchaseMotivations: llmInsights.purchaseMotivations || 
                (llmInsights.purchaseMotivation ? 
                    (Array.isArray(llmInsights.purchaseMotivation) ? 
                        llmInsights.purchaseMotivation.map((m: any) => m.insight || m) : 
                        [llmInsights.purchaseMotivation.summary || llmInsights.purchaseMotivation]) : 
                    basicStats.userInsights.purchaseMotivations),
            unmetNeeds: llmInsights.unmetNeeds || 
                (llmInsights.unmetNeeds ? 
                    (Array.isArray(llmInsights.unmetNeeds) ? 
                        llmInsights.unmetNeeds.map((n: any) => n.insight || n) : 
                        [llmInsights.unmetNeeds.summary || llmInsights.unmetNeeds]) : 
                    basicStats.userInsights.unmetNeeds),
            personas: llmInsights.personas || 
                (llmInsights.consumerProfile ? 
                    (llmInsights.consumerProfile.userCharacteristics ? 
                        llmInsights.consumerProfile.userCharacteristics.map((p: any) => p.characteristic || p) : 
                        [llmInsights.consumerProfile.summary || '']) : 
                    basicStats.userInsights.personas),
        };
    }

    // 转换 prosCons 格式
    let prosCons = basicStats.prosCons;
    if (llmResults.prosCons) {
        const llmProsCons = llmResults.prosCons as any;
        prosCons = {
            pros: (llmProsCons.pros || []).map((pro: any) => ({
                summary: pro.summary || pro.point || '',
                originalText: pro.originalText || pro.originalQuote || '',
                frequency: parsePercentage(pro.frequency),
            })),
            cons: (llmProsCons.cons || []).map((con: any) => ({
                summary: con.summary || con.point || '',
                originalText: con.originalText || con.originalQuote || '',
                frequency: parsePercentage(con.frequency),
            })),
        };
    }

    // 转换 starDistribution 格式（如果 LLM 返回了不同的格式）
    let starDistribution = basicStats.starDistribution;
    let starDistributionPercent = basicStats.starDistributionPercent;
    let starDistributionText = basicStats.starDistributionText;
    
    if (llmResults.starDistribution) {
        const llmStarDist = llmResults.starDistribution as any;
        // 检查是否是 {"5星": {count, percentage, chart}} 格式
        if (llmStarDist['5星'] || llmStarDist['4星'] || llmStarDist['3星'] || llmStarDist['2星'] || llmStarDist['1星']) {
            const newDist: { [key: number]: number } = {};
            const newDistPercent: { [key: number]: number } = {};
            const newDistText: { [key: number]: string } = {};
            
            ['5星', '4星', '3星', '2星', '1星'].forEach((star, index) => {
                const rating = 5 - index;
                const starData = llmStarDist[star];
                if (starData) {
                    newDist[rating] = starData.count || 0;
                    newDistPercent[rating] = parsePercentage(starData.percentage);
                    newDistText[rating] = starData.chart || '';
                }
            });
            
            starDistribution = newDist;
            starDistributionPercent = newDistPercent;
            starDistributionText = newDistText;
        }
    }

    return {
        ...basicStats,
        starDistribution,
        starDistributionPercent,
        starDistributionText,
        productInfo: {
            ...basicStats.productInfo,
            // 优先使用 LLM 提取的产品标题（更准确），如果 LLM 没有提供或标题不合适，使用基础统计的标题
            title: (llmResults.productInfo?.title && 
                    llmResults.productInfo.title.length > 10 && 
                    !commonReviewPhrases.some(phrase => llmResults.productInfo!.title!.toLowerCase().includes(phrase)))
                ? llmResults.productInfo.title
                : basicStats.productInfo.title,
            category: llmResults.productInfo?.category || basicStats.productInfo.category,
            variantStatsByAsin: llmResults.productInfo?.variantStatsByAsin || 
                (llmResults.productInfo as any)?.variantStats?.byAsin || 
                basicStats.productInfo.variantStatsByAsin,
            variantStatsByModel: llmResults.productInfo?.variantStatsByModel || 
                (llmResults.productInfo as any)?.variantStats?.byModel || 
                basicStats.productInfo.variantStatsByModel,
        },
        sentimentAnalysis,
        topicClusters,
        userInsights,
        prosCons,
        returnReasons: llmResults.returnReasons || basicStats.returnReasons,
        improvementSuggestions: llmResults.improvementSuggestions || basicStats.improvementSuggestions,
        typicalReviews: (llmResults.typicalReviews || []).map((review: any) => ({
            originalText: review.originalText || review.original || '',
            translatedText: review.translatedText || review.translation || '',
            rating: review.rating || 0,
            reviewUrl: review.reviewUrl || review.link || '',
            aiInsight: review.aiInsight || review.insight || '',
            typicalReason: review.typicalReason || '',
            weight: typeof review.weight === 'number' ? review.weight : (review.weight ? parseFloat(review.weight) : 0),
            tags: Array.isArray(review.tags) ? review.tags : [],
        })) || basicStats.typicalReviews,
    };
};

// 主分析函数：先计算基础统计，然后调用 LLM（如果配置了）
export const analyzeReviews = async (
    reviews: Review[],
    settings?: LLMSettings | null
): Promise<AnalysisResult> => {
    // 先计算基础统计（不依赖 LLM）
    const basicStats = calculateBasicStats(reviews);

    // 如果配置了 API，调用 LLM 进行深度分析
    if (settings && settings.apiKey) {
        try {
            const llmResults = await analyzeWithLLM(reviews, settings);
            return mergeLLMResults(basicStats, llmResults);
        } catch (error) {
            console.error("LLM analysis failed, using basic stats only:", error);
            // 如果 LLM 分析失败，返回基础统计
            return basicStats;
        }
    }

    // 如果没有配置 API，只返回基础统计
    return basicStats;
};
