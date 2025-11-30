import * as XLSX from 'xlsx';
import fs from 'fs';

// 必需字段列表（与 excel-parser.ts 中的 REQUIRED_COLUMNS 保持一致）
const REQUIRED_COLUMNS = [
    'ASIN',
    '标题',
    '内容',
    'VP评论',
    'Vine Voice评论',
    '型号',
    '是否有视频',
    '视频地址',
    '评论链接',
    '评论人',
    '头像地址',
    '所属国家',
    '评论人主页',
    '红人计划链接',
    '评论时间',
    'rate', // 必需字段：评分
];

const generateMockData = () => {
    const reviews = [];
    const asins = ['B08XYZ1234', 'B09ABC5678', 'B07DEF9012'];
    const variants = ['黑色基础款', '白色升级款', '蓝色专业版'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'Japan'];

    const positiveTitles = ['Great product!', 'Loved it', 'Best purchase ever', 'Highly recommend', 'Works perfectly'];
    const negativeTitles = ['Disappointed', 'Stopped working', 'Waste of money', 'Not as described', 'Terrible quality'];
    const neutralTitles = ['It is okay', 'Average', 'Good but has flaws', 'Decent for the price'];

    const positiveContents = [
        'I have been using this for a week and it works great. The battery life is amazing.',
        'Exceeded my expectations. Build quality is top notch.',
        'Very easy to set up and use. Would buy again.',
        'Perfect for my needs. Shipping was fast too.',
        'The best in its class. Highly recommended.'
    ];
    const negativeContents = [
        'Stopped working after two days. Very disappointed.',
        'The material feels cheap and it broke easily.',
        'Battery life is terrible, does not last an hour.',
        'Customer service was unhelpful when I tried to return it.',
        'Do not buy this, save your money.'
    ];
    const neutralContents = [
        'It does the job, but nothing special.',
        'Good value for money, but could be better.',
        'A bit noisy, but works fine otherwise.',
        'Okay product, but I expected more features.',
        'Mixed feelings. Some parts are good, others not so much.'
    ];

    for (let i = 0; i < 100; i++) {
        const isPositive = Math.random() > 0.3; // 70% positive
        const isNegative = !isPositive && Math.random() > 0.6; // Of the remaining 30%, 40% negative (approx 12% total)

        let rating: number, title: string, content: string;

        if (isPositive) {
            rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
            title = positiveTitles[Math.floor(Math.random() * positiveTitles.length)];
            content = positiveContents[Math.floor(Math.random() * positiveContents.length)];
        } else if (isNegative) {
            rating = Math.floor(Math.random() * 2) + 1; // 1 or 2
            title = negativeTitles[Math.floor(Math.random() * negativeTitles.length)];
            content = negativeContents[Math.floor(Math.random() * negativeContents.length)];
        } else {
            rating = 3;
            title = neutralTitles[Math.floor(Math.random() * neutralTitles.length)];
            content = neutralContents[Math.floor(Math.random() * neutralContents.length)];
        }

        // Add some variation to content
        content += ` (Review #${i + 1})`;

        // 按照 REQUIRED_COLUMNS 的顺序构建对象，确保所有必需字段都存在
        const review: Record<string, any> = {
            'ASIN': asins[Math.floor(Math.random() * asins.length)],
            '标题': title,
            '内容': content,
            'VP评论': Math.random() > 0.2 ? '是' : '否',
            'Vine Voice评论': Math.random() > 0.9 ? '是' : '否',
            '型号': variants[Math.floor(Math.random() * variants.length)],
            '是否有视频': Math.random() > 0.8 ? '是' : '否',
            '视频地址': '',
            '评论链接': `https://www.amazon.com/review/R${Math.random().toString(36).substring(7)}`,
            '评论人': `User${Math.floor(Math.random() * 10000)}`,
            '头像地址': '',
            '所属国家': countries[Math.floor(Math.random() * countries.length)],
            '评论人主页': '',
            '红人计划链接': '',
            '评论时间': new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
            'rate': rating // 确保 rate 字段是数字类型
        };

        // 验证所有必需字段都存在
        const missingFields = REQUIRED_COLUMNS.filter(col => !(col in review));
        if (missingFields.length > 0) {
            throw new Error(`缺少必需字段: ${missingFields.join(', ')}`);
        }

        reviews.push(review);
    }

    // 验证第一条记录包含所有必需字段
    const firstReview = reviews[0];
    const missingInFirst = REQUIRED_COLUMNS.filter(col => !(col in firstReview));
    if (missingInFirst.length > 0) {
        throw new Error(`第一条记录缺少字段: ${missingInFirst.join(', ')}`);
    }

    // 生成 Excel 文件
    const worksheet = XLSX.utils.json_to_sheet(reviews);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviews');

    // 写入文件
    XLSX.writeFile(workbook, 'mock_reviews.xlsx');
    
    // 验证生成的文件
    const generatedWorkbook = XLSX.readFile('mock_reviews.xlsx');
    const generatedSheet = generatedWorkbook.Sheets[generatedWorkbook.SheetNames[0]];
    const generatedData = XLSX.utils.sheet_to_json(generatedSheet);
    
    if (generatedData.length === 0) {
        throw new Error('生成的 Excel 文件为空');
    }

    // 验证生成的 Excel 文件包含所有必需字段
    const firstRow = generatedData[0] as any;
    const missingInFile = REQUIRED_COLUMNS.filter(col => !(col in firstRow));
    if (missingInFile.length > 0) {
        throw new Error(`生成的 Excel 文件缺少字段: ${missingInFile.join(', ')}`);
    }

    // 验证 rate 字段是数字类型
    const rateValue = firstRow['rate'];
    if (rateValue === undefined || rateValue === null || rateValue === '') {
        throw new Error('rate 字段为空或未定义');
    }
    const rateNum = typeof rateValue === 'number' ? rateValue : parseFloat(rateValue);
    if (isNaN(rateNum) || rateNum < 1 || rateNum > 5) {
        console.warn(`警告: rate 值异常: ${rateValue} (类型: ${typeof rateValue})`);
    }

    console.log('✓ 成功生成 mock_reviews.xlsx，包含 100 条评论');
    console.log(`✓ 验证通过: 所有必需字段都存在，包括 'rate' 字段`);
    console.log(`✓ rate 字段示例值: ${firstRow['rate']} (类型: ${typeof firstRow['rate']})`);
    console.log(`✓ 字段列表: ${REQUIRED_COLUMNS.join(', ')}`);
};

generateMockData();
