#!/usr/bin/env node
/**
 * Rules 文件验证
 * 验证 web.md 的内容完整性和规范覆盖（Web 专属模板）
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const RULES_DIR = path.join(__dirname, '..', '.claude', 'rules');

describe('Rules 文件验证', () => {
  it('rules 目录应存在', () => {
    assert.ok(fs.existsSync(RULES_DIR));
  });

  describe('web.md', () => {
    const rulePath = path.join(RULES_DIR, 'web.md');

    it('文件应存在', () => {
      assert.ok(fs.existsSync(rulePath));
    });

    const content = fs.readFileSync(rulePath, 'utf8');

    // 架构模式
    it('应包含组件式架构规范', () => {
      assert.ok(content.includes('组合优于继承') || content.includes('组件式架构'));
    });

    it('应禁止过深继承链', () => {
      assert.ok(content.includes('2 层'));
    });

    // 异步模式
    it('应要求 async/await', () => {
      assert.ok(content.includes('async/await'));
    });

    it('应禁止嵌套回调', () => {
      assert.ok(content.includes('回调') || content.includes('callback'));
    });

    it('应要求 Promise.all', () => {
      assert.ok(content.includes('Promise.all'));
    });

    // 链式编程
    it('应包含链式/Builder 模式', () => {
      assert.ok(content.includes('Builder') || content.includes('链式'));
    });

    // 目录结构
    it('应包含前端标准目录结构', () => {
      const dirs = ['components', 'services', 'stores', 'types'];
      for (const d of dirs) {
        assert.ok(content.includes(d), `目录结构应包含 ${d}/`);
      }
    });

    it('应包含后端标准目录结构', () => {
      const dirs = ['api', 'models', 'schemas'];
      for (const d of dirs) {
        assert.ok(content.includes(d), `目录结构应包含 ${d}/`);
      }
    });

    // 代码规范
    it('应禁止 any 类型', () => {
      assert.ok(content.includes('any'));
    });

    it('应要求 props 类型定义', () => {
      assert.ok(content.includes('props') && content.includes('类型'));
    });

    // 测试
    it('应要求使用 Playwright', () => {
      assert.ok(content.includes('Playwright'));
    });

    it('应要求零 error 策略', () => {
      assert.ok(content.includes('零') && content.includes('error'));
    });

    // 视觉设计（新增）
    it('应指向 DESIGN.md 作为视觉设计 source of truth', () => {
      assert.ok(content.includes('DESIGN.md'));
    });

    it('应明确图标来源约束', () => {
      assert.ok(content.includes('@iconify/vue'));
    });

    // 版本锁定
    it('应要求提交 uv.lock 和 package-lock.json', () => {
      assert.ok(content.includes('uv.lock'));
      assert.ok(content.includes('package-lock.json'));
    });
  });
});

describe('Rules 与 CLAUDE.md 一致性', () => {
  const claudeMd = fs.readFileSync(path.join(__dirname, '..', 'CLAUDE.md'), 'utf8');

  it('CLAUDE.md 应引用 web.md', () => {
    assert.ok(claudeMd.includes('web'));
    assert.ok(claudeMd.includes('.claude/rules'));
  });

  it('CLAUDE.md 不应残留 game-engine 分派', () => {
    assert.ok(!claudeMd.includes('game-engine'), 'CLAUDE.md 不应再引用 game-engine');
    assert.ok(!claudeMd.includes('MonoBehaviour'), 'CLAUDE.md 不应包含 game-engine 特有规范');
  });

  it('CLAUDE.md 的通用规范不应与 rules 重复（委托给 rules）', () => {
    // CLAUDE.md 工具指南表中会引用 Playwright MCP 作为使用场景，这是合理的
    // 但不应包含 Playwright 的具体测试规范（如截图对比、零 error 策略等）
    assert.ok(!claudeMd.includes('截图对比'), 'CLAUDE.md 不应包含 web 特有的测试细节');
  });
});
