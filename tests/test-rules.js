#!/usr/bin/env node
/**
 * Rules 文件验证
 * 验证 web.md 和 game-engine.md 的内容完整性和规范覆盖
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const RULES_DIR = path.join(ROOT, '.claude', 'rules');
const AGENTS_RULES_DIR = path.join(ROOT, '.agents', 'rules');

function normalizeNewlines(content) {
  return content.replace(/\r\n/g, '\n');
}

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

    it('应定义 Entity 为引擎业务对象', () => {
      assert.ok(content.includes('Entity') && content.includes('Actor') && content.includes('GameObject') && content.includes('Node'));
      assert.ok(content.includes('Transform'));
    });

    it('应允许 Component 包含自身数据相关方法', () => {
      assert.ok(content.includes('Component') && content.includes('数据容器'));
      assert.ok(content.includes('自身'));
    });

    it('应定义 System 为模块中心', () => {
      assert.ok(content.includes('System') && content.includes('模块中心'));
      assert.ok(content.includes('<ModuleName>System'));
    });

    it('应包含跨模块 Flow 编排层', () => {
      assert.ok(content.includes('Flow'));
      assert.ok(content.includes('代码版蓝图'));
      assert.ok(content.includes('业务流程中枢'));
      assert.ok(content.includes('transaction'));
      assert.ok(content.includes('删除 `Flows/` 不应影响'));
    });

    it('应禁止 System 直接互调', () => {
      assert.ok(content.includes('System 不直接互调'));
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
    it('应包含链式编程原则且不写具体示例', () => {
      assert.ok(content.includes('链式操作'));
      assert.ok(!content.includes('UIBuilder'));
      assert.ok(!content.includes('MoveTo'));
    });

    // 目录结构
    it('应包含标准目录结构', () => {
      const dirs = ['<ProjectName>', 'Modules', '<ModuleName>', 'Components', 'Systems', 'Data', 'Tests', 'Flows', 'Shared', 'Services', 'Utils', 'UI', 'Config'];
      for (const d of dirs) {
        assert.ok(content.includes(d), `目录结构应包含 ${d}/`);
      }
    });

    it('应要求按模块聚合 ECS 代码', () => {
      assert.ok(content.includes('按模块聚合'));
      assert.ok(content.includes('不按 Components / Systems 全局分层'));
      assert.ok(content.includes('跨模块编排只放 `Flows/`'));
    });

    it('应支持 Shared 临时能力 Component', () => {
      assert.ok(content.includes('Shared/Components'));
      assert.ok(content.includes('临时能力 Component'));
    });

    // 代码规范
    it('应禁止 Update/Tick 中分配内存', () => {
      assert.ok(content.includes('Update') || content.includes('Tick'));
      assert.ok(content.includes('对象池') || content.includes('object pool'));
    });

    it('应要求资源引用集中配置', () => {
      assert.ok(content.includes('资源路径'));
      assert.ok(content.includes('Prefab'));
      assert.ok(content.includes('Config/Data'));
    });

    // 测试
    it('应要求 System 和 Flow 可单元测试', () => {
      assert.ok(content.includes('单元测试') || content.includes('unit test'));
      assert.ok(content.includes('Flow'));
    });

    it('应要求零 warning 策略', () => {
      assert.ok(content.includes('zero warning') || content.includes('零 warning'));
    });
  });
});

describe('Rules 与 CLAUDE.md 一致性', () => {
  const claudeMd = fs.readFileSync(path.join(ROOT, 'CLAUDE.md'), 'utf8');

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

describe('Codex rules 与 AGENTS.md 一致性', () => {
  const agentsMd = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8');

  it('.agents/rules 目录应存在', () => {
    assert.ok(fs.existsSync(AGENTS_RULES_DIR));
  });

  it('AGENTS.md 应引用 .agents/rules', () => {
    assert.ok(agentsMd.includes('.agents/rules'));
    assert.ok(!agentsMd.includes('.Codex/rules'));
  });

  it('AGENTS.md 不应使用 @import 预加载上下文', () => {
    const imports = [...agentsMd.matchAll(/^@(.+)$/gm)].map(m => m[1].trim());
    assert.strictEqual(imports.length, 0, 'AGENTS.md 不应包含 @import');
  });

  it('.agents/rules 应与 .claude/rules 同步', () => {
    for (const file of ['web.md', 'game-engine.md']) {
      const claude = normalizeNewlines(fs.readFileSync(path.join(RULES_DIR, file), 'utf8'));
      const agents = normalizeNewlines(fs.readFileSync(path.join(AGENTS_RULES_DIR, file), 'utf8'));
      assert.strictEqual(agents, claude, `${file} 不同步`);
    }
  });
});
