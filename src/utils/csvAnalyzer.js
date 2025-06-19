// csvAnalyzer.js
// CSVデータの分析用ユーティリティ（雛形）

const fs = require('fs');
const { parse } = require('csv-parse/sync');

/**
 * CSVファイルをパースしてデータ配列を返す
 * @param {string} filePath - CSVファイルのパス
 * @returns {Promise<Array<Object>>} - パース済みデータ
 */
async function parseCSV(filePath) {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    // 日付やサイズを適切な型に変換
    return records.map(row => ({
        ...row,
        DATE: row['DATE'],
        SIZE: row['SIZE'] !== undefined ? Number(row['SIZE']) : undefined,
        ID: row['ID'] !== undefined ? Number(row['ID']) : undefined,
    }));
}

/**
 * 日付範囲でデータをフィルタ
 * @param {Array<Object>} data - パース済みデータ
 * @param {string} startDate - 開始日 (YYYY-MM-DD)
 * @param {string} endDate - 終了日 (YYYY-MM-DD)
 * @returns {Array<Object>} - フィルタ済みデータ
 */
function filterByDateRange(data, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return data.filter(row => {
        const d = new Date(row['DATE']);
        return d >= start && d <= end;
    });
}

/**
 * サイズでデータをフィルタ
 * @param {Array<Object>} data - パース済みデータ
 * @param {number} minSize - 最小サイズ
 * @param {number} maxSize - 最大サイズ
 * @returns {Array<Object>} - フィルタ済みデータ
 */
function filterBySize(data, minSize, maxSize) {
    return data.filter(row => {
        const size = row['SIZE'];
        return (typeof size === 'number') && size >= minSize && size <= maxSize;
    });
}

/**
 * サイズの統計量（平均・合計・最大・最小）を計算
 * @param {Array<Object>} data - パース済みデータ
 * @returns {{average: number, sum: number, max: number, min: number}}
 */
function calculateSizeStats(data) {
    const sizes = data.map(row => row['SIZE']).filter(s => typeof s === 'number' && !isNaN(s));
    if (sizes.length === 0) {
        return { average: 0, sum: 0, max: 0, min: 0 };
    }
    const sum = sizes.reduce((a, b) => a + b, 0);
    const max = Math.max(...sizes);
    const min = Math.min(...sizes);
    const average = sum / sizes.length;
    return { average, sum, max, min };
}

module.exports = {
    parseCSV,
    filterByDateRange,
    filterBySize,
    calculateSizeStats,
}; 