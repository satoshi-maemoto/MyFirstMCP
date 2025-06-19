const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  parseCSV,
  filterByDateRange,
  filterBySize,
  calculateSizeStats
} = require('./csvAnalyzer');

const TEST_CSV_PATH = path.join(__dirname, 'test_sample.csv');
const CSV_CONTENT = `ID,日付,サイズ\n1,2024-05-01,10\n2,2024-05-02,20\n3,2024-06-01,30\n4,2024-06-15,40\n5,2024-07-01,50`;

async function runTests() {
  // テスト用CSVファイル作成
  fs.writeFileSync(TEST_CSV_PATH, CSV_CONTENT, 'utf-8');

  // parseCSV
  const data = await parseCSV(TEST_CSV_PATH);
  assert.strictEqual(data.length, 5, 'CSVの行数が正しい');
  assert.strictEqual(data[0]['ID'], '1');
  assert.strictEqual(data[0]['日付'], '2024-05-01');
  assert.strictEqual(data[0]['サイズ'], 10);

  // filterByDateRange
  const mayData = filterByDateRange(data, '2024-05-01', '2024-05-31');
  assert.strictEqual(mayData.length, 2, '5月のデータ件数が正しい');
  assert.strictEqual(mayData[1]['ID'], '2');

  // filterBySize
  const sizeData = filterBySize(data, 20, 40);
  assert.strictEqual(sizeData.length, 3, 'サイズ20-40のデータ件数が正しい');
  assert.strictEqual(sizeData[0]['ID'], '2');
  assert.strictEqual(sizeData[2]['ID'], '4');

  // calculateSizeStats
  const stats = calculateSizeStats(data);
  assert.strictEqual(stats.sum, 150, 'サイズ合計が正しい');
  assert.strictEqual(stats.max, 50, 'サイズ最大が正しい');
  assert.strictEqual(stats.min, 10, 'サイズ最小が正しい');
  assert.strictEqual(stats.average, 30, 'サイズ平均が正しい');

  // filterByDateRange + calculateSizeStats (2024-05-01〜2024-06-30)
  const rangeData = filterByDateRange(data, '2024-05-01', '2024-06-30');
  const rangeStats = calculateSizeStats(rangeData);
  assert.strictEqual(rangeData.length, 61, '5/1〜6/30のデータ件数が正しい');
  assert.ok(rangeStats.sum > 0, '合計が0より大きい');
  assert.ok(rangeStats.max > 0, '最大値が0より大きい');
  assert.ok(rangeStats.min > 0, '最小値が0より大きい');
  assert.ok(rangeStats.average > 0, '平均が0より大きい');

  // 後始末
  fs.unlinkSync(TEST_CSV_PATH);
  console.log('✅ All csvAnalyzer tests passed!');
}

if (require.main === module) {
  runTests().catch(e => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  });
} 