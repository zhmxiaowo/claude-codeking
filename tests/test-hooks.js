#!/usr/bin/env node
/**
 * Hook 脚本单元测试
 * 通过 child_process 模拟 stdin 输入，验证 stderr 输出和 exit code
 */
const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const HOOKS_DIR = path.join(__dirname, '..', '.claude', 'hooks', 'scripts');
const CODEX_HOOKS_DIR = path.join(__dirname, '..', '.codex', 'hooks', 'scripts');

// 辅助函数：运行 hook 脚本，传入 JSON stdin，返回 { code, stdout, stderr }
function runHook(scriptName, stdinData, options = {}) {
  return new Promise((resolve) => {
    const scriptPath = path.join(options.hooksDir || HOOKS_DIR, scriptName);
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

async function runCodexHook(scriptName, stdinData, options = {}) {
  return runHook(scriptName, stdinData, { ...options, hooksDir: CODEX_HOOKS_DIR });
}

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
      projectType: 'web',
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
      projectType: 'web',
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
    const progress = { projectName: 'X', projectType: 'web', currentPhase: 'in_progress', totalTasks: 5, completedTasks: 2, lastSession: { tasksCompleted: [] }, blockedTasks: [] };
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
      projectName: 'X', projectType: 'web', currentPhase: 'in_progress',
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

  it('有未完成任务且无停止信号时强制续作', async () => {
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
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const stopPath = path.join(claudeDir, '.work-stop');
    const pausePath = path.join(claudeDir, '.work-pause');
    if (fs.existsSync(stopPath)) fs.rmSync(stopPath);
    if (fs.existsSync(pausePath)) fs.rmSync(pausePath);

    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /work next/);
    assert.match(r.stderr, /#3/);
  });

  it('有 in_progress 任务时优先续作当前任务', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'in_progress',
      currentTask: { id: 4, title: '继续实现支付' },
      totalTasks: 5,
      completedTasks: 2,
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [
        { id: 3, status: 'pending', title: '实现登录页' },
        { id: 4, status: 'in_progress', title: '继续实现支付' },
      ],
    }));
    const claudeDir = path.join(tmpDir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const stopPath = path.join(claudeDir, '.work-stop');
    const pausePath = path.join(claudeDir, '.work-pause');
    if (fs.existsSync(stopPath)) fs.rmSync(stopPath);
    if (fs.existsSync(pausePath)) fs.rmSync(pausePath);

    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 2);
    assert.match(r.stderr, /#4/);
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
// 3.5 next-task.js
// ============================================================
describe('next-task.js', () => {
  const script = 'next-task.js';
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-next-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('initialized 状态选择第一个依赖满足的 pending 任务', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'initialized',
      currentTask: null,
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [
        { id: 1, status: 'completed', title: '基础' },
        { id: 2, status: 'pending', title: '可执行', dependencies: [1] },
      ],
    }));

    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(JSON.parse(r.stdout).id, 2);
  });

  it('in_progress 状态优先恢复当前任务', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'in_progress',
      currentTask: { id: 3, title: '恢复任务' },
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [
        { id: 2, status: 'pending', title: '不应选择' },
        { id: 3, status: 'in_progress', title: '恢复任务' },
      ],
    }));

    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(JSON.parse(r.stdout).id, 3);
  });

  it('blocked 任务不可执行时返回 blocked 摘要', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'in_progress',
      currentTask: null,
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [
        { id: 1, status: 'blocked', title: '阻塞依赖' },
        { id: 2, status: 'pending', title: '等待依赖', dependencies: [1] },
      ],
    }));

    const r = await runHook(script, undefined, { cwd: tmpDir });
    const data = JSON.parse(r.stdout);
    assert.deepStrictEqual(data.blocked, [{ id: 2, unmet: [1] }]);
  });

  it('completed phase 静默退出', async () => {
    fs.writeFileSync(path.join(tmpDir, 'progress.json'), JSON.stringify({
      currentPhase: 'completed',
      currentTask: null,
    }));
    fs.writeFileSync(path.join(tmpDir, 'task.json'), JSON.stringify({
      tasks: [{ id: 1, status: 'pending', title: '不应输出' }],
    }));

    const r = await runHook(script, undefined, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    assert.strictEqual(r.stdout, '');
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

  it('context7 调用支持 libraryId 字段', async () => {
    const cachePath = path.join(tmpDir, '.claude', 'context7-cache.json');
    if (fs.existsSync(cachePath)) fs.rmSync(cachePath);

    const r = await runHook(script, {
      tool_name: 'mcp__context7__query_docs',
      tool_input: { libraryId: '/vercel/next.js' },
    }, { cwd: tmpDir });
    assert.strictEqual(r.code, 0);
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    assert.ok(cache['vercel/next.js']);
  });

  it('重复查询递增 queries 计数', async () => {
    const cachePath = path.join(tmpDir, '.claude', 'context7-cache.json');
    if (fs.existsSync(cachePath)) fs.rmSync(cachePath);
    await runHook(script, {
      tool_name: 'mcp__context7__resolve-library-id',
      tool_input: { libraryName: 'react' },
    }, { cwd: tmpDir });
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
// 7. Codex hook path parity
// ============================================================
describe('Codex hooks', () => {
  it('脚本文本不应读写 .claude 运行态目录', () => {
    const scripts = fs.readdirSync(CODEX_HOOKS_DIR).filter(file => file.endsWith('.js'));
    for (const script of scripts) {
      const content = fs.readFileSync(path.join(CODEX_HOOKS_DIR, script), 'utf8');
      assert.ok(!content.includes("'.claude'"), `${script} 不应使用 .claude 目录`);
      assert.ok(!content.includes('".claude"'), `${script} 不应使用 .claude 目录`);
    }
  });

  it('pre-write-context7-check 使用 .codex 缓存', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-codex-ctx-'));
    try {
      fs.mkdirSync(path.join(tmpDir, '.codex'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, '.codex', 'context7-cache.json'), JSON.stringify({
        react: { lastQuery: new Date().toISOString(), queries: 1 },
      }));

      const r = await runCodexHook('pre-write-context7-check.js', {
        tool_input: { content: "import React from 'react';" },
      }, { cwd: tmpDir });
      assert.strictEqual(r.code, 0);
      assert.strictEqual(r.stderr, '');
      assert.ok(!fs.existsSync(path.join(tmpDir, '.claude', 'context7-cache.json')));
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('track-context7-query 写入 .codex 缓存并支持 libraryId', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-test-codex-track-'));
    try {
      const r = await runCodexHook('track-context7-query.js', {
        tool_name: 'mcp__context7__query_docs',
        tool_input: { libraryId: '/vercel/next.js' },
      }, { cwd: tmpDir });
      assert.strictEqual(r.code, 0);
      const codexCache = path.join(tmpDir, '.codex', 'context7-cache.json');
      assert.ok(fs.existsSync(codexCache));
      assert.ok(!fs.existsSync(path.join(tmpDir, '.claude', 'context7-cache.json')));
      const cache = JSON.parse(fs.readFileSync(codexCache, 'utf8'));
      assert.ok(cache['vercel/next.js']);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
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
