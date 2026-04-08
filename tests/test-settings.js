#!/usr/bin/env node
/**
 * Settings 和 MCP 配置验证
 * 验证 .claude/settings.json 和 .mcp.json 的结构、hook 注册、插件配置
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SETTINGS_PATH = path.join(ROOT, '.claude', 'settings.json');
const MCP_PATH = path.join(ROOT, '.mcp.json');
const HOOKS_DIR = path.join(ROOT, '.claude', 'hooks', 'scripts');

describe('settings.json 验证', () => {
  it('文件应存在', () => {
    assert.ok(fs.existsSync(SETTINGS_PATH));
  });

  it('应是有效的 JSON', () => {
    const content = fs.readFileSync(SETTINGS_PATH, 'utf8');
    assert.doesNotThrow(() => JSON.parse(content));
  });

  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));

  // ========================================
  // 插件配置
  // ========================================
  describe('插件配置', () => {
    it('应有 enabledPlugins 字段', () => {
      assert.ok(settings.enabledPlugins);
    });

    it('应启用 Context7 插件', () => {
      assert.ok(settings.enabledPlugins['context7@claude-plugins-official'] === true);
    });

    it('应启用 Playwright 插件', () => {
      assert.ok(settings.enabledPlugins['playwright@claude-plugins-official'] === true);
    });
  });

  // ========================================
  // Hook 注册
  // ========================================
  describe('Hook 注册', () => {
    it('应有 hooks 字段', () => {
      assert.ok(settings.hooks);
    });

    // SessionStart hooks
    it('应注册 SessionStart hook', () => {
      assert.ok(settings.hooks.SessionStart);
      assert.ok(settings.hooks.SessionStart.length > 0);
    });

    it('SessionStart 应包含 session-start-inject.js', () => {
      const cmds = JSON.stringify(settings.hooks.SessionStart);
      assert.ok(cmds.includes('session-start-inject.js'));
    });

    // PreToolUse hooks
    it('应注册 PreToolUse hooks', () => {
      assert.ok(settings.hooks.PreToolUse);
      assert.ok(settings.hooks.PreToolUse.length >= 2);
    });

    it('PreToolUse 应包含 Bash 匹配器（block-dangerous-cmd）', () => {
      const bashHook = settings.hooks.PreToolUse.find(h => h.matcher === 'Bash');
      assert.ok(bashHook, '缺少 Bash matcher');
      const cmds = JSON.stringify(bashHook);
      assert.ok(cmds.includes('block-dangerous-cmd.js'));
    });

    it('PreToolUse 应包含 Write|Edit 匹配器（pre-write-context7-check）', () => {
      const writeHook = settings.hooks.PreToolUse.find(h =>
        h.matcher && h.matcher.includes('Write')
      );
      assert.ok(writeHook, '缺少 Write matcher');
      const cmds = JSON.stringify(writeHook);
      assert.ok(cmds.includes('pre-write-context7-check.js'));
    });

    // PostToolUse hooks
    it('应注册 PostToolUse hooks', () => {
      assert.ok(settings.hooks.PostToolUse);
      assert.ok(settings.hooks.PostToolUse.length > 0);
    });

    it('PostToolUse 应包含 context7 匹配器', () => {
      const ctx7Hook = settings.hooks.PostToolUse.find(h =>
        h.matcher && h.matcher.includes('context7')
      );
      assert.ok(ctx7Hook, '缺少 context7 matcher');
      const cmds = JSON.stringify(ctx7Hook);
      assert.ok(cmds.includes('track-context7-query.js'));
    });

    // Stop hooks
    it('应注册 Stop hooks', () => {
      assert.ok(settings.hooks.Stop);
      assert.ok(settings.hooks.Stop.length >= 2, 'Stop hooks 应至少有 2 个（compact-warn + work-continuation）');
    });

    it('Stop 应包含 context-compact-warn.js', () => {
      const cmds = JSON.stringify(settings.hooks.Stop);
      assert.ok(cmds.includes('context-compact-warn.js'));
    });

    it('Stop 应包含 work-continuation.js（新增）', () => {
      const cmds = JSON.stringify(settings.hooks.Stop);
      assert.ok(cmds.includes('work-continuation.js'));
    });
  });

  // ========================================
  // Hook 脚本文件存在性
  // ========================================
  describe('Hook 脚本文件存在性', () => {
    const expectedScripts = [
      'block-dangerous-cmd.js',
      'context-compact-warn.js',
      'pre-write-context7-check.js',
      'session-start-inject.js',
      'track-context7-query.js',
      'work-continuation.js',
    ];

    for (const script of expectedScripts) {
      it(`${script} 应存在`, () => {
        assert.ok(fs.existsSync(path.join(HOOKS_DIR, script)), `${script} 不存在`);
      });
    }
  });

  // ========================================
  // 环境变量
  // ========================================
  describe('环境变量', () => {
    it('应启用 LSP 工具', () => {
      assert.ok(settings.env);
      assert.strictEqual(settings.env.ENABLE_LSP_TOOL, '1');
    });
  });
});

describe('.mcp.json 验证', () => {
  it('文件应存在', () => {
    assert.ok(fs.existsSync(MCP_PATH));
  });

  it('应是有效的 JSON', () => {
    const content = fs.readFileSync(MCP_PATH, 'utf8');
    assert.doesNotThrow(() => JSON.parse(content));
  });

  const mcp = JSON.parse(fs.readFileSync(MCP_PATH, 'utf8'));

  it('应有 mcpServers 字段', () => {
    assert.ok(mcp.mcpServers);
  });

  describe('fetch MCP server', () => {
    it('应存在 fetch 配置', () => {
      assert.ok(mcp.mcpServers.fetch);
    });

    it('类型应为 stdio', () => {
      assert.strictEqual(mcp.mcpServers.fetch.type, 'stdio');
    });

    it('命令应为 uvx', () => {
      assert.strictEqual(mcp.mcpServers.fetch.command, 'uvx');
    });

    it('参数应包含 mcp-server-fetch', () => {
      assert.ok(mcp.mcpServers.fetch.args.includes('mcp-server-fetch'));
    });
  });

  describe('exa MCP server', () => {
    it('应存在 exa 配置', () => {
      assert.ok(mcp.mcpServers.exa);
    });

    it('类型应为 http', () => {
      assert.strictEqual(mcp.mcpServers.exa.type, 'http');
    });

    it('URL 应包含 exa.ai', () => {
      assert.ok(mcp.mcpServers.exa.url.includes('exa.ai'));
    });

    it('URL 应包含搜索工具', () => {
      assert.ok(mcp.mcpServers.exa.url.includes('web_search_exa'));
    });
  });
});

describe('Settings 与其他文件的一致性', () => {
  it('settings.json 中引用的所有 hook 脚本都应存在', () => {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    const allHookCmds = JSON.stringify(settings.hooks);
    // 提取所有 .js 文件引用
    const jsFiles = allHookCmds.match(/[\w-]+\.js/g) || [];
    for (const jsFile of jsFiles) {
      assert.ok(
        fs.existsSync(path.join(HOOKS_DIR, jsFile)),
        `settings.json 引用的 ${jsFile} 不存在`
      );
    }
  });
});
