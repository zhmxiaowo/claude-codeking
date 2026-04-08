#!/usr/bin/env node
/**
 * CLAUDE.md 主文档验证
 * 验证启动协议、工作流文档、工具指南的完整性和一致性
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const CLAUDE_MD = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');

describe('CLAUDE.md 主文档验证', () => {

  // ========================================
  // Session 启动协议
  // ========================================
  describe('Session 启动协议', () => {
    it('应包含 progress.json 检查', () => {
      assert.ok(CLAUDE_MD.includes('progress.json'));
    });

    it('应包含 /init-project 提示', () => {
      assert.ok(CLAUDE_MD.includes('/init-project'));
    });

    it('应包含 spec.md 读取', () => {
      assert.ok(CLAUDE_MD.includes('spec.md'));
    });

    it('应包含 projectType 条件加载', () => {
      assert.ok(CLAUDE_MD.includes('projectType'));
      assert.ok(CLAUDE_MD.includes('web'));
      assert.ok(CLAUDE_MD.includes('game-engine'));
    });

    it('应包含 git 状态检查', () => {
      assert.ok(CLAUDE_MD.includes('git'));
    });
  });

  // ========================================
  // 搜索优先原则
  // ========================================
  describe('搜索优先原则', () => {
    it('应要求 Context7 查文档', () => {
      assert.ok(CLAUDE_MD.includes('Context7'));
    });

    it('应要求 resolve-library-id', () => {
      assert.ok(CLAUDE_MD.includes('resolve-library-id'));
    });

    it('应要求 query-docs', () => {
      assert.ok(CLAUDE_MD.includes('query-docs'));
    });

    it('应禁止凭记忆写 API', () => {
      assert.ok(CLAUDE_MD.includes('禁止凭记忆'));
    });
  });

  // ========================================
  // 通用编码规范
  // ========================================
  describe('通用编码规范', () => {
    it('应要求组合优于继承', () => {
      assert.ok(CLAUDE_MD.includes('组合优于继承'));
    });

    it('应要求 async/await', () => {
      assert.ok(CLAUDE_MD.includes('async/await'));
    });

    it('应要求链式编程', () => {
      assert.ok(CLAUDE_MD.includes('链式编程'));
    });

    it('应禁止过度封装', () => {
      assert.ok(CLAUDE_MD.includes('不过度封装'));
    });

    it('应禁止投机性代码', () => {
      assert.ok(CLAUDE_MD.includes('投机性代码'));
    });
  });

  // ========================================
  // 核心工作流
  // ========================================
  describe('核心工作流', () => {
    it('应包含 /init-project 命令', () => {
      assert.ok(CLAUDE_MD.includes('/init-project'));
    });

    it('应包含 /work 命令', () => {
      assert.ok(CLAUDE_MD.includes('/work'));
    });

    it('应包含 /stopwork 命令（新增）', () => {
      assert.ok(CLAUDE_MD.includes('/stopwork'));
    });

    it('应包含 /change 命令（新增）', () => {
      assert.ok(CLAUDE_MD.includes('/change'));
    });

    it('应包含 /review 命令', () => {
      assert.ok(CLAUDE_MD.includes('/review'));
    });

    it('/work 描述应包含 Build 步骤（编译门禁）', () => {
      assert.ok(CLAUDE_MD.includes('Build'));
    });
  });

  // ========================================
  // 进度跟踪
  // ========================================
  describe('进度跟踪', () => {
    it('应定义提交信息格式', () => {
      assert.ok(CLAUDE_MD.includes('feat/fix/refactor'));
    });

    it('应定义进度更新提交格式', () => {
      assert.ok(CLAUDE_MD.includes('chore: update progress'));
    });
  });

  // ========================================
  // 工具使用指南
  // ========================================
  describe('工具使用指南', () => {
    it('应包含 Context7 使用场景', () => {
      assert.ok(CLAUDE_MD.includes('Context7 MCP'));
    });

    it('应包含 Playwright 使用场景', () => {
      assert.ok(CLAUDE_MD.includes('Playwright MCP'));
    });

    it('应包含 code-reviewer agent', () => {
      assert.ok(CLAUDE_MD.includes('code-reviewer'));
    });

    it('应包含 qa-verifier agent', () => {
      assert.ok(CLAUDE_MD.includes('qa-verifier'));
    });
  });
});
