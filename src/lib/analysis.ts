import { Review, AnalysisResult, TopicCluster, ProConItem } from './types';

export const analyzeReviews = (reviews: Review[]): AnalysisResult => {
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

    // Use the title from the most frequent ASIN or just the first one
    const title = reviews.find(r => r.asin === maxAsin)?.title || reviews[0]?.title || 'Unknown Product';

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

    // 4. Mock NLP / Topic Clusters
    // In a real app, this would call an LLM. Here we generate static mock data or simple keyword matching.
    const topicClusters: TopicCluster[] = [
        {
            name: '使用体验与方便性',
            percentage: 35,
            summary: '用户普遍认为产品易于使用，操作简便，但在某些特定场景下可能不够直观。',
            examples: [
                { en: "Very easy to use.", cn: "非常易于使用。" },
                { en: "Setup was a breeze.", cn: "设置非常简单。" }
            ]
        },
        {
            name: '做工质量',
            percentage: 25,
            summary: '大部分用户对做工表示满意，但有少量反馈提到材质略显廉价。',
            examples: [
                { en: "Solid build quality.", cn: "做工扎实。" },
                { en: "Feels a bit plastic.", cn: "感觉有点塑料感。" }
            ]
        },
        {
            name: '续航/充电',
            percentage: 20,
            summary: '续航能力符合预期，但充电速度较慢是主要槽点。',
            examples: [
                { en: "Battery lasts all day.", cn: "电池能用一整天。" },
                { en: "Charging takes forever.", cn: "充电太慢了。" }
            ]
        },
        {
            name: '客服与售后',
            percentage: 10,
            summary: '售后服务响应迅速，解决了大部分用户的问题。',
            examples: [
                { en: "Customer service was helpful.", cn: "客服很有帮助。" }
            ]
        }
    ];

    // 5. Mock User Insights
    const userInsights = {
        purchaseMotivations: ['性价比高', '朋友推荐', '替换旧设备', '特定功能需求'],
        unmetNeeds: ['希望有更多颜色选择', '需要更长的充电线', '期待防水功能'],
        personas: ['家庭主妇', '科技爱好者', '学生', '办公室职员']
    };

    // 6. Mock Pros & Cons
    const pros: ProConItem[] = [
        { summary: '性价比高', originalText: "Great value for money.", frequency: 45 },
        { summary: '易于安装', originalText: "Easy to install.", frequency: 30 },
        { summary: '外观时尚', originalText: "Looks modern and sleek.", frequency: 25 }
    ];

    const cons: ProConItem[] = [
        { summary: '说明书不清晰', originalText: "Instructions are confusing.", frequency: 15 },
        { summary: '噪音较大', originalText: "A bit noisy when running.", frequency: 10 },
        { summary: '配件缺失', originalText: "Missing parts in the box.", frequency: 5 }
    ];

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
            totalReviews: reviews.length
        },
        starDistribution,
        variantAnalysis,
        topicClusters,
        userInsights,
        prosCons: { pros, cons },
        reviewsOverTime
    };
};
