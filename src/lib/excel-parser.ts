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
    'rate', // 根据系统提示词，rate 是必需字段
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

                // Validate columns - 严格匹配所有必需字段
                const firstRow = jsonData[0] as any;
                const missingColumns = REQUIRED_COLUMNS.filter(col => !(col in firstRow));

                if (missingColumns.length > 0) {
                    // 如果缺少任何必需字段（包括 rate），拒绝文件
                    reject(new Error(`文件缺少必要字段: ${missingColumns.join(', ')}. 请确认是否为 Sellersprite/领星 导出的原始评论数据.`));
                        return;
                }

                const reviews: Review[] = jsonData.map((row: any) => {
                    // 根据系统提示词，rate 是必需字段，应该总是存在
                    // 但为了兼容性，如果 rate 字段值为空，尝试从其他字段推断
                    let rating = 0;
                    if (row['rate'] !== undefined && row['rate'] !== null && row['rate'] !== '') {
                        rating = parseFloat(row['rate']);
                    } else {
                        // Fallback: 尝试从其他可能的字段名获取（仅作为兼容性处理）
                        if ('评分' in row && row['评分']) rating = parseFloat(row['评分']);
                        else if ('Star' in row && row['Star']) rating = parseFloat(row['Star']);
                        else if ('Rating' in row && row['Rating']) rating = parseFloat(row['Rating']);
                    }

                    // 确保 rating 是有效数字
                    if (isNaN(rating) || rating < 0 || rating > 5) {
                        rating = 0;
                    }

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
