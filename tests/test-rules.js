#!/usr/bin/env node
/**
 * Rules 文件验证
 * 验证 web.md 和 game-engine.md 的内容完整性和规范覆盖
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
    it('应包含标准目录结构', () => {
      const dirs = ['components', 'services', 'stores', 'utils', 'types'];
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
  });

  describe('game-engine.md', () => {
    const rulePath = path.join(RULES_DIR, 'game-engine.md');

    it('文件应存在', () => {
      assert.ok(fs.existsSync(rulePath));
    });

    const content = fs.readFileSync(rulePath, 'utf8');

    // ECS 架构
    it('应强制 ECS 架构', () => {
      assert.ok(content.includes('ECS'));
    });

    it('应定义 Entity 为纯 ID', () => {
      assert.ok(content.includes('Entity') && content.includes('纯 ID'));
    });

    it('应定义 Component 为纯数据', () => {
      assert.ok(content.includes('Component') && content.includes('纯数据'));
    });

    it('应定义 System 为纯逻辑', () => {
      assert.ok(content.includes('System') && content.includes('纯逻辑'));
    });

    it('应禁止 MonoBehaviour 万能类', () => {
      assert.ok(content.includes('MonoBehaviour'));
    });

    // 异步模式
    it('应支持 Unity UniTask', () => {
      assert.ok(content.includes('UniTask'));
    });

    it('应支持 Unreal UE5Coro', () => {
      assert.ok(content.includes('UE5Coro'));
    });

    it('应支持 Cocos Promise/async-await', () => {
      assert.ok(content.includes('Cocos') && content.includes('async-await'));
    });

    // 链式编程
    it('应包含 UI 链式构建示例', () => {
      assert.ok(content.includes('UIBuilder'));
    });

    it('应包含动画链式示例', () => {
      assert.ok(content.includes('MoveTo') || content.includes('anim'));
    });

    // 目录结构
    it('应包含标准目录结构', () => {
      const dirs = ['Components', 'Systems', 'Services', 'Utils', 'UI', 'Config'];
      for (const d of dirs) {
        assert.ok(content.includes(d), `目录结构应包含 ${d}/`);
      }
    });

    // 代码规范
    it('应禁止 Update/Tick 中分配内存', () => {
      assert.ok(content.includes('Update') || content.includes('Tick'));
      assert.ok(content.includes('对象池') || content.includes('object pool'));
    });

    // 测试
    it('应要求 System 可单元测试', () => {
      assert.ok(content.includes('单元测试') || content.includes('unit test'));
    });

    it('应要求零 warning 策略', () => {
      assert.ok(content.includes('zero warning') || content.includes('零 warning'));
    });
  });
});

describe('Rules 与 CLAUDE.md 一致性', () => {
  const claudeMd = fs.readFileSync(path.join(__dirname, '..', 'CLAUDE.md'), 'utf8');

  it('CLAUDE.md 应引用 web.md', () => {
    assert.ok(claudeMd.includes('web'));
    assert.ok(claudeMd.includes('.claude/rules'));
  });

  it('CLAUDE.md 应引用 game-engine.md', () => {
    assert.ok(claudeMd.includes('game-engine'));
  });

  it('CLAUDE.md 的通用规范不应与 rules 重复（委托给 rules）', () => {
    // CLAUDE.md 不应包含 ECS 细节（game-engine 特有的架构规范）
    assert.ok(!claudeMd.includes('MonoBehaviour'), 'CLAUDE.md 不应包含 game-engine 特有规范');
    // CLAUDE.md 工具指南表中会引用 Playwright MCP 作为使用场景，这是合理的
    // 但不应包含 Playwright 的具体测试规范（如截图对比、零 error 策略等）
    assert.ok(!claudeMd.includes('截图对比'), 'CLAUDE.md 不应包含 web 特有的测试细节');
  });
});
