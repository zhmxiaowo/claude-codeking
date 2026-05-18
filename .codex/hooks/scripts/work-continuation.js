#!/usr/bin/env node
// Stop hook: /work 循环中存在 pending 任务时强制 Claude 继续
// 注入消息保持极简，避免污染对话历史
// .work-stop  → 用户主动停止信号，放行
// .work-pause → 模块边界自动暂停信号，放行（让用户 /clear 后再 /work）
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const progressPath = path.join(cwd, 'progress.json');
const stopPath = path.join(cwd, '.claude', '.work-stop');
const pausePath = path.join(cwd, '.claude', '.work-pause');
const taskPath = path.join(cwd, 'task.json');

try {
  if (fs.existsSync(stopPath)) process.exit(0);
  if (fs.existsSync(pausePath)) process.exit(0);
  if (!fs.existsSync(progressPath) || !fs.existsSync(taskPath)) process.exit(0);

  const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
  if (progress.currentPhase !== 'in_progress') process.exit(0);

  const tasks = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const next = tasks.tasks.find(t => t.status === 'pending');
  if (!next) process.exit(0);

  // 极简注入：只一个标记，让 Claude 知道继续 work 循环
  process.stderr.write(`→ work next: #${next.id}`);
  process.exit(2);
} catch (e) {
  process.exit(0);
}
