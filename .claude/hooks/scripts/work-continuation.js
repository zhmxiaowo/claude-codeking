#!/usr/bin/env node
// Stop hook: 检查是否有未完成任务
// - 在 /work 循环中（in_progress）且有 pending 任务 → exit 2 强制 Claude 继续
// - 不在 /work 循环中 → exit 0 仅提醒
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const progressPath = path.join(cwd, 'progress.json');
const stopPath = path.join(cwd, '.claude', '.work-stop');
const taskPath = path.join(cwd, 'task.json');

try {
  // 如果有停止信号，用户主动停止，不阻止
  if (fs.existsSync(stopPath)) {
    process.exit(0);
  }

  // 检查 progress.json
  if (!fs.existsSync(progressPath)) {
    process.exit(0);
  }

  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));

  // 只在开发进行中时处理
  if (progress.currentPhase !== 'in_progress') {
    process.exit(0);
  }

  // 检查是否还有未完成任务
  if (!fs.existsSync(taskPath)) {
    process.exit(0);
  }

  const tasks = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const pending = tasks.tasks.filter(t => t.status === 'pending');

  if (pending.length > 0) {
    const msg = [
      '⚠ 还有 ' + pending.length + ' 个未完成任务！',
      '下一个任务: #' + pending[0].id + ' ' + pending[0].title,
      '请立即继续执行 /work 循环的下一个任务。不要停止。',
      ''
    ].join('\n');
    process.stderr.write(msg);
    process.exit(2); // 阻止 Claude 停止，强制继续 /work 循环
  }
} catch (e) {
  // fail-safe: 出错时不阻止停止
}

process.exit(0);
