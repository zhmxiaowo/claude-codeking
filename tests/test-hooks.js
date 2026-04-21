#!/usr/bin/env node
/**
 * Hook 脚本单元测试
 * 通过 child_process 模拟 stdin 输入，验证 stderr 输出和 exit code
 */
const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const HOOKS_DIR = path.join(__dirname, '..', '.claude', 'hooks', 'scripts');

// 辅助函数：运行 hook 脚本，传入 JSON stdin，返回 { code, stdout, stderr }
function runHook(scriptName, stdinData, options = {}) {
  return new Promise((resolve) => {
    const scriptPath = path.join(HOOKS_DIR, scriptName);
    const child = execFile('node', [scriptPath], {
      cwd: options.cwd || process.cwd(),
      timeout: 5000,
      env: { ...process.env, ...options.env },
    }, (error, stdout, stderr) => {
      resolve({
        code: error ? error.code ?? 1 : 0,
        stdout: stdout || '',
        stderr: stderr || '',
      });
    });
    if (stdinData !== undefined) {
      child.stdin.write(typeof stdinData === 'string' ? stdinData : JSON.stringify(stdinData));
      child.stdin.end();
    } else {
      child.stdin.end();
    }
  });
}

// ============================================================
// 1. block-dangerous-cmd.js
// ============================================================
describe('block-dangerous-cmd.js', () => {
  const script = 'block-dangerous-cmd.js';

  it('应阻止 --no-verify 命令 (exit 2)', async () => {
    const r = await runHook(script, { tool_input: { command: 'git commit --no-verify -m "test"' } });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /--no-verify/);
  });

  it('应阻止 git push --force 命令 (exit 2)', async () => {
    const r = await runHook(script, { tool_input: { command: 'git push --force origin main' } });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /force push/);
  });

  it('应阻止 git push -f 命令 (exit 2)', async () => {
    const r = await runHook(script, { tool_input: { command: 'git push -f origin main' } });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /force push/);
  });

  it('应阻止 rm -rf / 命令 (exit 2)', async () => {
    const r = await runHook(script, { tool_input: { command: 'rm -rf /' } });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /rm -rf/);
  });

  it('应阻止 rm -rf ~ 命令 (exit 2)', async () => {
    const r = await runHook(script, { tool_input: { command: 'rm -rf ~' } });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /rm -rf/);
  });

  it('应阻止 git reset --hard origin/main (exit 2)', async () => {
    const r = await runHook(script, { tool_input: { command: 'git reset --hard origin/main' } });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /git reset/);
  });

  it('应放行安全命令 (exit 0)', async () => {
    const r = await runHook(script, { tool_input: { command: 'git add .' } });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('应放行 npm install (exit 0)', async () => {
    const r = await runHook(script, { tool_input: { command: 'npm install react' } });
    assert.strictEqual(r.code, 0);
  });

  it('空输入不崩溃 (exit 0)', async () => {
    const r = await runHook(script, '{}');
    assert.strictEqual(r.code, 0);
  });

  it('无 stdin 不崩溃 (exit 0)', async () => {
    const r = await runHook(script, '');
    assert.strictEqual(r.code, 0);
  });
});

// ============================================================
// 2. session-start-inject.js
// ============================================================
describe('session-start-inject.js', () => {
  const script = 'session-start-inject.js';
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('无 progress.json 时静默退出 (exit 0, 无输出)', async () => {
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('有 progress.json 时输出进度摘要', async () => {
    const progress = {
      projectName: 'TestApp',
      tier: 'T3',
      currentPhase: 'in_progress',
      totalTasks: 10,
      completedTasks: 3,
      currentTask: null,
      lastSession: { date: '2026-04-01', tasksCompleted: [1, 2, 3], notes: '' },
      blockedTasks: [],
    };
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify(progress));
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.match(r.stderr, /TestApp/);
    assert.match(r.stderr, /3\/10/);
    assert.match(r.stderr, /1, 2, 3/);
  });

  it('有阻塞任务时输出警告', async () => {
    const progress = {
      projectName: 'TestApp',
      tier: 'T3',
      currentPhase: 'in_progress',
      totalTasks: 10,
      completedTasks: 3,
      currentTask: null,
      lastSession: { date: '', tasksCompleted: [], notes: '' },
      blockedTasks: [4, 5],
    };
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify(progress));
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.match(r.stderr, /阻塞/);
    assert.match(r.stderr, /4, 5/);
  });

  it('有 .work-stop 文件时输出停止信号', async () => {
    const progress = { projectName: 'X', tier: 'T3', currentPhase: 'in_progress', totalTasks: 5, completedTasks: 2, lastSession: { tasksCompleted: [] }, blockedTasks: [] };
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify(progress));
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, '.work-stop'), '用户需要测试界面');
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.match(r.stderr, /停止信号/);
    assert.match(r.stderr, /用户需要测试界面/);
    // cleanup
    fs.rmSync(path.join(claudeDir, '.work-stop'));
  });

  it('有验证失败记录时输出', async () => {
    const progress = {
      projectName: 'X', tier: 'T3', currentPhase: 'in_progress',
      totalTasks: 5, completedTasks: 2,
      lastSession: { tasksCompleted: [] }, blockedTasks: [],
      verifyFailures: [{ taskId: 3, reason: '编译失败 - 缺少依赖' }],
    };
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify(progress));
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.match(r.stderr, /验证失败/);
    assert.match(r.stderr, /编译失败/);
  });
});

// ============================================================
// 3. work-continuation.js
// ============================================================
describe('work-continuation.js', () => {
  const script = 'work-continuation.js';
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-cont-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('无 progress.json 时静默退出', async () => {
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('currentPhase 非 in_progress 时静默退出', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'initialized', totalTasks: 5, completedTasks: 0,
    }));
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('有停止信号时静默退出（尊重用户 /stopwork）', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'in_progress', totalTasks: 5, completedTasks: 2,
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [
        { id: 1, status: 'completed' }, { id: 2, status: 'completed' },
        { id: 3, status: 'pending', title: 'Next Task' },
      ],
    }));
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(path.join(claudeDir, '.work-stop'), '测试中');
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
    fs.rmSync(path.join(claudeDir, '.work-stop'));
  });

  it('有未完成任务且无停止信号时输出续命提醒', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'in_progress', totalTasks: 5, completedTasks: 2,
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [
        { id: 1, status: 'completed' }, { id: 2, status: 'completed' },
        { id: 3, status: 'pending', title: '实现登录页' },
        { id: 4, status: 'pending', title: '实现注册页' },
      ],
    }));
    // 确保没有 stop 文件
    const stopPath = path.join(tmpDir, '.claude', '.work-stop');
    if (fs.existsSync(stopPath)) fs.rmSync(stopPath);

    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.match(r.stderr, /2 个未完成任务/);
    assert.match(r.stderr, /#3/);
    assert.match(r.stderr, /实现登录页/);
  });

  it('所有任务完成时静默退出', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'in_progress', totalTasks: 2, completedTasks: 2,
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [
        { id: 1, status: 'completed' }, { id: 2, status: 'completed' },
      ],
    }));
    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });
});

// ============================================================
// 4. pre-write-context7-check.js
// ============================================================
describe('pre-write-context7-check.js', () => {
  const script = 'pre-write-context7-check.js';
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-ctx7-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('无 import 语句时静默通过', async () => {
    const r = await runHook(script, {
      tool_input: { content: 'const x = 1;\nconsole.log(x);' },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('只有相对路径 import 时静默通过', async () => {
    const r = await runHook(script, {
      tool_input: { content: "import { foo } from './utils';" },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('只有 node builtin import 时静默通过', async () => {
    const r = await runHook(script, {
      tool_input: { content: "const fs = require('fs');\nconst path = require('path');" },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('有未查询的第三方包时输出警告', async () => {
    const r = await runHook(script, {
      tool_input: { content: "import React from 'react';\nimport axios from 'axios';" },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0); // 警告但不阻止
    assert.match(r.stderr, /Context7/);
    assert.match(r.stderr, /react/);
    assert.match(r.stderr, /axios/);
  });

  it('有近期缓存的包不再警告', async () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const cache = {
      react: { lastQuery: new Date().toISOString(), queries: 1 },
      axios: { lastQuery: new Date().toISOString(), queries: 2 },
    };
    fs.writeFileSync(path.join(claudeDir, 'context7-cache.json'), JSON.stringify(cache));
    const r = await runHook(script, {
      tool_input: { content: "import React from 'react';\nimport axios from 'axios';" },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
    // cleanup
    fs.rmSync(path.join(claudeDir, 'context7-cache.json'));
  });

  it('缓存超过 24h 的包仍然警告', async () => {
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const staleDate = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
    const cache = { react: { lastQuery: staleDate, queries: 1 } };
    fs.writeFileSync(path.join(claudeDir, 'context7-cache.json'), JSON.stringify(cache));
    const r = await runHook(script, {
      tool_input: { content: "import React from 'react';" },
    }, { cwd: tmpDir });
    assert.match(r.stderr, /react/);
    fs.rmSync(path.join(claudeDir, 'context7-cache.json'));
  });

  it('支持 @scope/package 格式', async () => {
    const r = await runHook(script, {
      tool_input: { content: "import { Button } from '@mui/material';" },
    }, { cwd: tmpDir });
    assert.match(r.stderr, /@mui\/material/);
  });

  it('Edit 操作使用 new_string 字段', async () => {
    const r = await runHook(script, {
      tool_input: { new_string: "import lodash from 'lodash';" },
    }, { cwd: tmpDir });
    assert.match(r.stderr, /lodash/);
  });
});

// ============================================================
// 5. track-context7-query.js
// ============================================================
describe('track-context7-query.js', () => {
  const script = 'track-context7-query.js';
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-track-'));
    fs.mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('非 context7 工具调用时不写缓存', async () => {
    const r = await runHook(script, {
      tool_name: 'some_other_tool',
      tool_input: { libraryName: 'react' },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.ok(!fs.existsSync(path.join(tmpDir, '.claude', 'context7-cache.json')));
  });

  it('context7 调用写入缓存', async () => {
    const r = await runHook(script, {
      tool_name: 'mcp__context7__resolve-library-id',
      tool_input: { libraryName: 'react' },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    const cachePath = path.join(tmpDir, '.claude', 'context7-cache.json');
    assert.ok(fs.existsSync(cachePath));
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    assert.ok(cache['react']);
    assert.strictEqual(cache['react'].queries, 1);
    assert.ok(cache['react'].lastQuery);
  });

  it('重复查询递增 queries 计数', async () => {
    await runHook(script, {
      tool_name: 'mcp__context7__query-docs',
      tool_input: { libraryName: 'react' },
    }, { cwd: tmpDir });
    const cache = JSON.parse(fs.readFileSync(path.join(tmpDir, '.claude', 'context7-cache.json'), 'utf8'));
    assert.strictEqual(cache['react'].queries, 2);
  });

  it('无 libraryName 时不写缓存', async () => {
    // 先删除缓存
    const cachePath = path.join(tmpDir, '.claude', 'context7-cache.json');
    if (fs.existsSync(cachePath)) fs.rmSync(cachePath);

    const r = await runHook(script, {
      tool_name: 'mcp__context7__query-docs',
      tool_input: {},
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.ok(!fs.existsSync(cachePath));
  });
});

// ============================================================
// 6. context-compact-warn.js
// ============================================================
describe('context-compact-warn.js', () => {
  const script = 'context-compact-warn.js';
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-compact-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('无 transcript_path 时静默退出', async () => {
    const r = await runHook(script, {});
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('小 transcript 不触发警告 (<50%)', async () => {
    const smallFile = path.join(tmpDir, 'small.txt');
    fs.writeFileSync(smallFile, 'x'.repeat(100 * 1024)); // 100KB ≈ 25k tokens ≈ 12.5%
    const r = await runHook(script, { transcript_path: smallFile });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stderr, '');
  });

  it('中等 transcript 触发温和提醒 (50-90%)', async () => {
    const medFile = path.join(tmpDir, 'medium.txt');
    // 50%: 100k tokens = 400KB
    fs.writeFileSync(medFile, 'x'.repeat(500 * 1024)); // 500KB ≈ 125k tokens ≈ 62.5%
    const r = await runHook(script, { transcript_path: medFile });
    assert.strictEqual(r.code, 0);
    assert.match(r.stderr, /上下文提醒/);
    assert.match(r.stderr, /compact/i);
  });

  it('大 transcript 触发紧急警告 (>=90%)', async () => {
    const bigFile = path.join(tmpDir, 'big.txt');
    // 90%: 180k tokens = 720KB
    fs.writeFileSync(bigFile, 'x'.repeat(800 * 1024)); // 800KB ≈ 200k tokens
    const r = await runHook(script, { transcript_path: bigFile });
    assert.strictEqual(r.code, 0);
    assert.match(r.stderr, /告急/);
  });
});
