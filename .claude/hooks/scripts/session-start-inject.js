#!/usr/bin/env node
// SessionStart hook: 读取 progress.json 注入上次进度摘要 + .work-stop 原因
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const progressPath = path.join(cwd, 'progress.json');
const stopPath = path.join(cwd, '.claude', '.work-stop');

const lines = [];

try {
  if (fs.existsSync(progressPath)) {
    const p = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    lines.push('📊 上次进度摘要：');
    lines.push(`  项目：${p.projectName || '(未命名)'}${p.tier ? ` [${p.tier}]` : ''}`);
    lines.push(`  阶段：${p.currentPhase} | 模块：${p.currentModule || '-'}`);
    lines.push(`  已完成 ${p.completedTasks}/${p.totalTasks} 个 task`);
    const recent = (p.lastSession?.tasksCompleted || []).slice(-3);
    if (recent.length) lines.push(`  最近完成：${recent.join(', ')}`);
    if ((p.blockedTasks || []).length) lines.push(`  ⚠ 阻塞 task：${p.blockedTasks.join(', ')}`);
    if ((p.verifyFailures || []).length) {
      const last = p.verifyFailures[p.verifyFailures.length - 1];
      lines.push(`  ⚠ 最近验证失败：${last.taskId} - ${last.reason}`);
    }
  }

  if (fs.existsSync(stopPath)) {
    const reason = fs.readFileSync(stopPath, 'utf8').trim();
    lines.push('');
    lines.push(`🛑 存在停止信号（上次 /stopwork）：`);
    lines.push(`  ${reason}`);
    lines.push(`  运行 /resumework 清除后可继续 /work`);
  }
} catch (e) {
  // fail-safe, don't block session start
}

if (lines.length) process.stderr.write(lines.join('\n') + '\n');
process.exit(0);
