import * as XLSX from 'xlsx';
import fs from 'fs';

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

        let rating, title, content;

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

        reviews.push({
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
            '评分': rating // Adding this column as per our parser logic
        });
    }

    const worksheet = XLSX.utils.json_to_sheet(reviews);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reviews');

    XLSX.writeFile(workbook, 'mock_reviews.xlsx');
    console.log('Successfully generated mock_reviews.xlsx with 100 reviews.');
};

generateMockData();
