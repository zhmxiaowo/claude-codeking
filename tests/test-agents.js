#!/usr/bin/env node
/**
 * Agent 定义文件验证
 * 验证 agent 的 frontmatter、工具配置、内容结构
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const AGENTS_DIR = path.join(__dirname, '..', '.claude', 'agents');

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const yaml = {};
  match[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      yaml[key] = val;
    }
  });
  return yaml;
}

const EXPECTED_AGENTS = [
  {
    name: 'code-reviewer',
    file: 'code-reviewer.md',
    requiredFrontmatter: { tools: 'Read, Grep, Glob' },
    requiredContent: ['Bug', 'critical', 'warning', 'info', '置信度', 'CLAUDE.md', 'OWASP'],
    forbiddenContent: [],
  },
  {
    name: 'qa-verifier',
    file: 'qa-verifier.md',
    requiredFrontmatter: {},
    requiredContent: [
      // 编译门禁（核心改进）
      '编译', 'npm run build', 'tsc',
      // Web 前端验证流程
      'Playwright', 'browser_navigate', 'browser_snapshot', 'browser_console_messages',
      // 后端验证
      'uv run', 'app.main',
      // 设计对齐
      'DESIGN.md',
      // 错误报告
      '修复建议',
      // 严格顺序
      '前一步失败则停止',
    ],
    forbiddenContent: [],
  },
];

describe('Agent 定义文件验证', () => {
  it('agents 目录应存在', () => {
    assert.ok(fs.existsSync(AGENTS_DIR));
  });

  for (const agent of EXPECTED_AGENTS) {
    describe(`agent: ${agent.name}`, () => {
      const agentDir = path.join(AGENTS_DIR, agent.name);
      const agentFile = path.join(agentDir, agent.file);

      it('目录应存在', () => {
        assert.ok(fs.existsSync(agentDir));
      });

      it('定义文件应存在', () => {
        assert.ok(fs.existsSync(agentFile));
      });

      it('应有有效的 YAML frontmatter', () => {
        const content = fs.readFileSync(agentFile, 'utf8');
        const fm = parseFrontmatter(content);
        assert.ok(fm, 'frontmatter 解析失败');
        assert.ok(fm.name, '缺少 name 字段');
        assert.ok(fm.tools, '缺少 tools 字段');
        assert.ok(fm.model, '缺少 model 字段');
        assert.ok(fm.maxTurns, '缺少 maxTurns 字段');
      });

      for (const [key, val] of Object.entries(agent.requiredFrontmatter)) {
        it(`frontmatter ${key} 应为 "${val}"`, () => {
          const content = fs.readFileSync(agentFile, 'utf8');
          const fm = parseFrontmatter(content);
          assert.strictEqual(fm[key], val);
        });
      }

      for (const keyword of agent.requiredContent) {
        it(`内容应包含 "${keyword}"`, () => {
          const content = fs.readFileSync(agentFile, 'utf8');
          assert.ok(content.includes(keyword), `缺少关键内容: ${keyword}`);
        });
      }
    });
  }
});

describe('Agent 质量验证 - qa-verifier 编译门禁', () => {
  const qaFile = path.join(AGENTS_DIR, 'qa-verifier', 'qa-verifier.md');

  it('验证流程应先编译再测试（顺序正确）', () => {
    const content = fs.readFileSync(qaFile, 'utf8');
    // Step 2 编译检查应在 Step 4 Playwright 之前
    const buildIdx = content.indexOf('Step 2');
    const playwrightIdx = content.indexOf('Step 4');
    assert.ok(buildIdx > 0, '应包含 Step 2 编译检查');
    assert.ok(playwrightIdx > 0, '应包含 Step 4 Playwright 验证');
    assert.ok(buildIdx < playwrightIdx, '编译检查(Step 2)应在 Playwright 验证(Step 4)之前');
  });

  it('应包含依赖安装步骤', () => {
    const content = fs.readFileSync(qaFile, 'utf8');
    assert.ok(content.includes('npm install') || content.includes('pnpm install'));
  });

  it('应包含开发服务器启动步骤', () => {
    const content = fs.readFileSync(qaFile, 'utf8');
    assert.ok(content.includes('npm run dev') || content.includes('npm start'));
  });

  it('应包含后端编译 / 导入验证', () => {
    const content = fs.readFileSync(qaFile, 'utf8');
    assert.ok(content.includes('uv run'), '后端编译应使用 uv run');
    assert.ok(content.includes('app.main'), '应验证 app.main 可导入');
  });

  it('验证失败时应提供修复建议（非简单"失败"）', () => {
    const content = fs.readFileSync(qaFile, 'utf8');
    // 多处提到修复建议
    const fixCount = (content.match(/修复建议/g) || []).length;
    assert.ok(fixCount >= 2, `应在多处提到修复建议，实际出现 ${fixCount} 次`);
  });
});
