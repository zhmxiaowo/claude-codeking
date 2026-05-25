#!/usr/bin/env node
/**
 * CLAUDE.md 主文档验证
 * 验证入口文档只保留全局最小规则，不承载 /work 状态机。
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CLAUDE_MD = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');

describe('CLAUDE.md 主文档验证', () => {
  describe('全局最小入口', () => {
    it('应包含搜索优先原则', () => {
      assert.ok(CLAUDE_MD.includes('搜索优先原则'));
      assert.ok(CLAUDE_MD.includes('Context7'));
      assert.ok(CLAUDE_MD.includes('resolve-library-id'));
      assert.ok(CLAUDE_MD.includes('query-docs'));
      assert.ok(CLAUDE_MD.includes('禁止凭记忆'));
    });

    it('应包含通用编码规范', () => {
      assert.ok(CLAUDE_MD.includes('组合优于继承'));
      assert.ok(CLAUDE_MD.includes('async/await'));
      assert.ok(CLAUDE_MD.includes('链式编程'));
      assert.ok(CLAUDE_MD.includes('不过度封装'));
      assert.ok(CLAUDE_MD.includes('投机性代码'));
    });

    it('应包含工具使用指南', () => {
      assert.ok(CLAUDE_MD.includes('Context7 MCP'));
      assert.ok(CLAUDE_MD.includes('Playwright MCP'));
      assert.ok(CLAUDE_MD.includes('code-reviewer'));
      assert.ok(CLAUDE_MD.includes('qa-verifier'));
    });

    it('应包含核心命令索引', () => {
      assert.ok(CLAUDE_MD.includes('/init-project'));
      assert.ok(CLAUDE_MD.includes('/work'));
      assert.ok(CLAUDE_MD.includes('/stopwork'));
      assert.ok(CLAUDE_MD.includes('/change'));
      assert.ok(CLAUDE_MD.includes('/review'));
    });
  });

  describe('职责边界', () => {
    it('不应包含 /work 状态机章节', () => {
      assert.ok(!CLAUDE_MD.includes('Session 启动协议'));
      assert.ok(!CLAUDE_MD.includes('上下文原则'));
      assert.ok(!CLAUDE_MD.includes('经验管理'));
      assert.ok(!CLAUDE_MD.includes('进度跟踪'));
      assert.ok(!CLAUDE_MD.includes('验证分层原则'));
      assert.ok(!CLAUDE_MD.includes('项目类型规则'));
    });

    it('不应要求普通对话读取任务状态文件', () => {
      assert.ok(!CLAUDE_MD.includes('progress.currentTask'));
      assert.ok(!CLAUDE_MD.includes('next-task.js'));
      assert.ok(!CLAUDE_MD.includes('currentPhase'));
      assert.ok(!CLAUDE_MD.includes('chore: update task state'));
    });
  });
});
