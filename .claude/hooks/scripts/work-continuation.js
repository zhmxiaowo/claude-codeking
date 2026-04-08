#!/usr/bin/env node
// Stop hook: 检查是否有未完成任务，提醒继续工作
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const progressPath = path.join(cwd, 'progress.json');
const stopPath = path.join(cwd, '.claude', '.work-stop');
const taskPath = path.join(cwd, 'task.json');

try {
  // 如果有停止信号，用户主动停止，不提醒
  if (fs.existsSync(stopPath)) {
    process.exit(0);
  }

  // 检查 progress.json
  if (!fs.existsSync(progressPath)) {
    process.exit(0);
  }

  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));

  // 只在开发进行中时提醒
  if (progress.currentPhase !== 'in_progress') {
    process.exit(0);
  }

  // 检查是否还有未完成任务
  if (!fs.existsSync(taskPath)) {
    process.exit(0);
  }

  const tasks = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const pending = tasks.tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');

  if (pending.length > 0) {
    const lines = [
      '',
      '⚠ 仍有 ' + pending.length + ' 个未完成任务！',
      '  下一个任务: #' + pending[0].id + ' ' + pending[0].title,
      '  请继续执行 /work 完成剩余任务。',
      '  如需停止，请使用 /stopwork。',
      ''
    ];
    process.stderr.write(lines.join('\n'));
  }
} catch (e) {
  // fail-safe
}

process.exit(0);
