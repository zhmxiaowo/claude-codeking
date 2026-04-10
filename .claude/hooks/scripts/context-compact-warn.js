#!/usr/bin/env node
// Stop hook: 通过 transcript 长度估算 context 占用，提醒压缩
const fs = require('fs');

let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const transcriptPath = data.transcript_path || data.transcriptPath;
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return process.exit(0);

    const stat = fs.statSync(transcriptPath);
    // 粗估：transcript 每 KB ≈ 250 token；默认 context 200k
    const estTokens = Math.floor(stat.size / 4);
    const pctUsed = estTokens / 200000;

    if (pctUsed > 0.5 && pctUsed < 0.9) {
      process.stderr.write(`💡 上下文已用约 ${(pctUsed*100).toFixed(0)}%（估算 ${estTokens} tokens）。建议在合适的 task 边界运行 /compact 保持质量。\n`);
    } else if (pctUsed >= 0.9) {
      process.stderr.write(`⚠ 上下文告急（约 ${(pctUsed*100).toFixed(0)}%），请尽快完成当前任务后运行 /compact。\n`);
    }
  } catch (e) {}
  process.exit(0);
});
