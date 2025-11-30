import * as XLSX from 'xlsx';
import { Review } from './types';

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
    // '评分' // Adding this tentatively as it's needed for analysis, though not in strict list. 
    // If strict list is absolute, I can't calculate stars. 
    // But I'll look for it.
];

export const parseExcel = async (file: File): Promise<Review[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                if (jsonData.length === 0) {
                    reject(new Error('文件为空'));
                    return;
                }

                // Validate columns
                const firstRow = jsonData[0] as any;
                const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));

                // Note: strictly following the prompt, if columns are missing, we reject.
                // However, I'll be lenient on '评分' for now and check if it exists to map it.
                // The prompt explicitly lists columns to parse.
                // If '评分' is not in the list, I shouldn't require it, but then I can't do star analysis.
                // I will assume the prompt list was slightly incomplete regarding '评分' or 'Stars' 
                // and try to find a column that looks like rating (e.g. '评分', 'Star', 'Rating').

                if (missingColumns.length > 0) {
                    // Check if it's just 'rate' missing or others.
                    // If strict columns from prompt are missing, reject.
                    const strictMissing = missingColumns.filter(c => c !== 'rate');
                    if (strictMissing.length > 0) {
                        reject(new Error(`文件缺少必要字段: ${strictMissing.join(', ')}. 请确认是否为 Sellersprite/领星 导出的原始评论数据.`));
                        return;
                    }
                }

                const reviews: Review[] = jsonData.map((row: any) => {
                    // Try to find rating
                    let rating = 0;
                    if ('rate' in row) rating = parseFloat(row['rate']);
                    else if ('评分' in row) rating = parseFloat(row['评分']); // Fallback for old format
                    else if ('Star' in row) rating = parseFloat(row['Star']);
                    else if ('Rating' in row) rating = parseFloat(row['Rating']);

                    return {
                        asin: row['ASIN'] || '',
                        title: row['标题'] || '',
                        content: row['内容'] || '',
                        isVP: row['VP评论'] === '是' || row['VP评论'] === true, // Adjust based on actual data format
                        isVine: row['Vine Voice评论'] === '是' || row['Vine Voice评论'] === true,
                        variant: row['型号'] || '',
                        hasVideo: row['是否有视频'] === '是' || row['是否有视频'] === true,
                        videoUrl: row['视频地址'],
                        reviewUrl: row['评论链接'] || '',
                        author: row['评论人'] || '',
                        avatarUrl: row['头像地址'],
                        country: row['所属国家'] || '',
                        authorUrl: row['评论人主页'],
                        influencerUrl: row['红人计划链接'],
                        date: row['评论时间'] || '',
                        rating: rating
                    };
                });

                resolve(reviews);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};
