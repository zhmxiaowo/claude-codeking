#!/usr/bin/env node
/**
 * Skill 文件结构验证
 * 验证所有 skill 的 YAML frontmatter、必要字段、内容结构
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, '.claude', 'skills');
const CODEX_SKILLS_DIR = path.join(ROOT, '.agents', 'skills');

// 解析 YAML frontmatter（简易版，不引入第三方库，兼容 \r\n）
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

// 所有 skill 的预期配置
const EXPECTED_SKILLS = [
  {
    name: 'init-project',
    requiredFields: ['name', 'description', 'user-invocable'],
    requiredSections: ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5', 'Phase 6', 'Phase 7'],
    requiredContent: ['第一性原理', '架构设计', '任务拆解确认', 'spec.md', 'task.json', 'progress.json', 'doneWhen', 'verificationLevel'],
  },
  {
    name: 'work',
    requiredFields: ['name', 'description', 'user-invocable'],
    requiredSections: ['Startup', 'Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Step 7', '并行工具调用'],
    requiredContent: ['永不停止', '绝对禁止提前停止', '编译验证', 'cancelled', '.work-stop', 'Context7', 'doneWhen', 'milestone', 'qa-verifier', 'next-task.js', 'chore: update task state'],
  },
  {
    name: 'stopwork',
    requiredFields: ['name', 'description', 'user-invocable'],
    requiredSections: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
    requiredContent: ['.work-stop', 'progress.json', 'git commit', '/work'],
  },
  {
    name: 'change',
    requiredFields: ['name', 'description', 'user-invocable'],
    requiredSections: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6'],
    requiredContent: ['spec.md', 'task.json', 'progress.json', 'cancelled', 'origin', 'changeRef', 'changeHistory', 'verificationLevel'],
  },
  {
    name: 'review',
    requiredFields: ['name', 'description', 'user-invocable'],
    requiredSections: [],
    requiredContent: ['code-reviewer'],
  },
];

describe('Skill 文件结构验证', () => {
  // 检查 skills 目录存在
  it('skills 目录应存在', () => {
    assert.ok(fs.existsSync(SKILLS_DIR), `${SKILLS_DIR} 不存在`);
  });

  for (const skill of EXPECTED_SKILLS) {
    describe(`/skill: ${skill.name}`, () => {
      const skillDir = path.join(SKILLS_DIR, skill.name);
      const skillFile = path.join(skillDir, 'SKILL.md');

      it('skill 目录应存在', () => {
        assert.ok(fs.existsSync(skillDir), `${skillDir} 不存在`);
      });

      it('SKILL.md 应存在', () => {
        assert.ok(fs.existsSync(skillFile), `${skillFile} 不存在`);
      });

      it('应有有效的 YAML frontmatter', () => {
        const content = fs.readFileSync(skillFile, 'utf8');
        const fm = parseFrontmatter(content);
        assert.ok(fm, 'YAML frontmatter 解析失败');
      });

      for (const field of skill.requiredFields) {
        it(`frontmatter 应包含 "${field}" 字段`, () => {
          const content = fs.readFileSync(skillFile, 'utf8');
          const fm = parseFrontmatter(content);
          assert.ok(fm[field] !== undefined, `缺少 frontmatter 字段: ${field}`);
        });
      }

      it('user-invocable 应为 true', () => {
        const content = fs.readFileSync(skillFile, 'utf8');
        const fm = parseFrontmatter(content);
        assert.strictEqual(fm['user-invocable'], 'true');
      });

      for (const section of skill.requiredSections) {
        it(`内容应包含 "${section}" 章节`, () => {
          const content = fs.readFileSync(skillFile, 'utf8');
          assert.ok(content.includes(section), `缺少章节: ${section}`);
        });
      }

      for (const keyword of skill.requiredContent) {
        it(`内容应包含关键词 "${keyword}"`, () => {
          const content = fs.readFileSync(skillFile, 'utf8');
          assert.ok(content.includes(keyword), `缺少关键内容: ${keyword}`);
        });
      }
    });
  }
});

describe('Skill 交叉一致性验证', () => {
  it('/work 应引用 .work-stop（与 /stopwork 联动）', () => {
    const workContent = fs.readFileSync(path.join(SKILLS_DIR, 'work', 'SKILL.md'), 'utf8');
    assert.ok(workContent.includes('.work-stop'), '/work 应处理 .work-stop 信号');
  });

  it('/change 的 task 状态应与 /work 支持的状态一致', () => {
    const changeContent = fs.readFileSync(path.join(SKILLS_DIR, 'change', 'SKILL.md'), 'utf8');
    const workContent = fs.readFileSync(path.join(SKILLS_DIR, 'work', 'SKILL.md'), 'utf8');
    // /change 使用 cancelled 状态，/work 应跳过 cancelled
    assert.ok(changeContent.includes('cancelled'), '/change 应支持 cancelled 状态');
    assert.ok(workContent.includes('cancelled'), '/work 应跳过 cancelled 任务');
  });

  it('/init-project 应生成与 /change 兼容的 task 格式（含 origin 字段）', () => {
    const initContent = fs.readFileSync(path.join(SKILLS_DIR, 'init-project', 'SKILL.md'), 'utf8');
    assert.ok(initContent.includes('origin'), '/init-project 生成的 task 应包含 origin 字段');
  });

  it('/init-project 与 /work 应共享验收字段', () => {
    const initContent = fs.readFileSync(path.join(SKILLS_DIR, 'init-project', 'SKILL.md'), 'utf8');
    const workContent = fs.readFileSync(path.join(SKILLS_DIR, 'work', 'SKILL.md'), 'utf8');
    assert.ok(initContent.includes('doneWhen'), '/init-project 应生成 doneWhen');
    assert.ok(workContent.includes('doneWhen'), '/work 应消费 doneWhen');
    assert.ok(initContent.includes('verificationLevel'), '/init-project 应生成 verificationLevel');
    assert.ok(workContent.includes('verificationLevel'), '/work 应消费 verificationLevel');
  });

  it('/stopwork 应提示用户使用 /change 和 /work', () => {
    const stopContent = fs.readFileSync(path.join(SKILLS_DIR, 'stopwork', 'SKILL.md'), 'utf8');
    assert.ok(stopContent.includes('/change'), '/stopwork 应提示 /change');
    assert.ok(stopContent.includes('/work'), '/stopwork 应提示 /work');
  });
});

describe('Codex Skill 文件结构验证', () => {
  it('.agents/skills 目录应存在', () => {
    assert.ok(fs.existsSync(CODEX_SKILLS_DIR));
  });

  for (const skill of EXPECTED_SKILLS) {
    describe(`/skill: ${skill.name} (Codex)`, () => {
      const skillDir = path.join(CODEX_SKILLS_DIR, skill.name);
      const skillFile = path.join(skillDir, 'SKILL.md');

      it('skill 目录应存在', () => {
        assert.ok(fs.existsSync(skillDir), `${skillDir} 不存在`);
      });

      it('SKILL.md 应存在', () => {
        assert.ok(fs.existsSync(skillFile), `${skillFile} 不存在`);
      });

      it('应有有效的 YAML frontmatter', () => {
        const content = fs.readFileSync(skillFile, 'utf8');
        const fm = parseFrontmatter(content);
        assert.ok(fm, 'YAML frontmatter 解析失败');
        for (const field of skill.requiredFields) {
          assert.ok(fm[field] !== undefined, `缺少 frontmatter 字段: ${field}`);
        }
        assert.strictEqual(fm['user-invocable'], 'true');
      });

      for (const section of skill.requiredSections) {
        it(`内容应包含 "${section}" 章节`, () => {
          const content = fs.readFileSync(skillFile, 'utf8');
          assert.ok(content.includes(section), `缺少章节: ${section}`);
        });
      }
    });
  }
});

describe('Claude/Codex Skill 契约一致性', () => {
  it('两套 skills 应包含相同命令', () => {
    const claude = fs.readdirSync(SKILLS_DIR).filter(name => fs.statSync(path.join(SKILLS_DIR, name)).isDirectory()).sort();
    const codex = fs.readdirSync(CODEX_SKILLS_DIR).filter(name => fs.statSync(path.join(CODEX_SKILLS_DIR, name)).isDirectory()).sort();
    assert.deepStrictEqual(codex, claude);
  });

  it('Codex /work 不应引用不存在的 .Codex 目录或强依赖 Claude agents', () => {
    const work = fs.readFileSync(path.join(CODEX_SKILLS_DIR, 'work', 'SKILL.md'), 'utf8');
    assert.ok(!work.includes('.Codex'), 'Codex /work 不应引用 .Codex');
    assert.ok(work.includes('.agents/rules'), 'Codex /work 应引用 .agents/rules');
    assert.ok(!work.includes('启动 code-reviewer agent'), 'Codex /work 不应强制启动 Claude code-reviewer agent');
    assert.ok(!work.includes('启动 qa-verifier agent'), 'Codex /work 不应强制启动 Claude qa-verifier agent');
  });

  it('/work 应记录和恢复 in_progress/currentTask 状态', () => {
    for (const dir of [SKILLS_DIR, CODEX_SKILLS_DIR]) {
      const work = fs.readFileSync(path.join(dir, 'work', 'SKILL.md'), 'utf8');
      assert.ok(work.includes('status = "in_progress"'), `${dir} /work 应设置 in_progress`);
      assert.ok(work.includes('currentTask = { id, title }'), `${dir} /work 应设置 currentTask`);
      assert.ok(work.includes('从 "in_progress" 改为 "completed"'), `${dir} /work 应完成 in_progress 任务`);
    }
  });

  it('/work Startup 应确保核心上下文完整并按 projectType 加载 rules', () => {
    const cases = [
      { dir: SKILLS_DIR, rulesPath: '.claude/rules', scriptPath: '.claude/hooks/scripts/next-task.js' },
      { dir: CODEX_SKILLS_DIR, rulesPath: '.agents/rules', scriptPath: '.codex/hooks/scripts/next-task.js' },
    ];

    for (const c of cases) {
      const work = fs.readFileSync(path.join(c.dir, 'work', 'SKILL.md'), 'utf8');
      assert.ok(work.includes('项目核心上下文装载'), `${c.dir} /work 应声明 Startup 是上下文装载`);
      assert.ok(work.includes('完整、可信、未过期，则不重复读取'), `${c.dir} /work 应允许核心上下文完整时跳过重读`);
      assert.ok(work.includes('缺失、不确定、压缩后只剩摘要'), `${c.dir} /work 应在上下文不完整时全量读取`);
      assert.ok(work.includes('若存在 `experience.md`，也全量读取'), `${c.dir} /work 应可选读取 experience.md`);
      assert.ok(work.includes('无法可靠判断核心上下文是否完整'), `${c.dir} /work 应按缺失处理不确定上下文`);
      assert.ok(work.includes('projectType'), `${c.dir} /work 应按 projectType 选择 rules`);
      assert.ok(work.includes(`${c.rulesPath}/web.md`), `${c.dir} /work 应引用 web rules`);
      assert.ok(work.includes(`${c.rulesPath}/game-engine.md`), `${c.dir} /work 应引用 game-engine rules`);
      assert.ok(work.includes(c.scriptPath), `${c.dir} /work 应使用对应 next-task.js`);
    }
  });

  it('/work 应将持续开发状态机留在 skill 内', () => {
    for (const dir of [SKILLS_DIR, CODEX_SKILLS_DIR]) {
      const work = fs.readFileSync(path.join(dir, 'work', 'SKILL.md'), 'utf8');
      assert.ok(work.includes('持续开发的唯一状态机'), `${dir} /work 应声明状态机职责`);
      assert.ok(work.includes('Startup 后，任务选择只通过 `next-task.js`'), `${dir} /work 后续任务选择应依赖 next-task`);
      assert.ok(work.includes('不要为了找下一个任务反复全量读取 `task.json`'), `${dir} /work 不应反复全量扫描任务`);
      assert.ok(work.includes('Plan'), `${dir} /work 应包含 Plan`);
      assert.ok(work.includes('Implement'), `${dir} /work 应包含 Implement`);
      assert.ok(work.includes('Review'), `${dir} /work 应包含 Review`);
      assert.ok(work.includes('Build'), `${dir} /work 应包含 Build`);
      assert.ok(work.includes('Test'), `${dir} /work 应包含 Test`);
      assert.ok(work.includes('Commit'), `${dir} /work 应包含 Commit`);
      assert.ok(work.includes('Continue'), `${dir} /work 应包含 Continue`);
    }
  });

  it('/work 应采用功能提交 + 状态提交两阶段提交', () => {
    for (const dir of [SKILLS_DIR, CODEX_SKILLS_DIR]) {
      const work = fs.readFileSync(path.join(dir, 'work', 'SKILL.md'), 'utf8');
      assert.ok(work.includes('feat/fix/refactor: [任务标题] - task #[id]'), `${dir} /work 应定义功能提交`);
      assert.ok(work.includes('git add task.json progress.json experience.md'), `${dir} /work 应合并状态和经验提交`);
      assert.ok(work.includes('chore: update task state - task #[id]'), `${dir} /work 应定义状态提交`);
      assert.ok(!work.includes('chore: update progress - task #[id] completed'), `${dir} /work 不应使用旧进度提交`);
      assert.ok(!work.includes('chore: update experience notes - task #[id]'), `${dir} /work 不应独立提交 experience`);
    }
  });

  it('/work 应使用并行工具调用而不是批处理脚本口吻', () => {
    for (const dir of [SKILLS_DIR, CODEX_SKILLS_DIR]) {
      const work = fs.readFileSync(path.join(dir, 'work', 'SKILL.md'), 'utf8');
      assert.ok(work.includes('并行工具调用'), `${dir} /work 应使用并行工具调用`);
      assert.ok(work.includes('互不依赖'), `${dir} /work 应说明互不依赖的调用可并行`);
      assert.ok(work.includes('同一轮工具调用'), `${dir} /work 应说明同一轮工具调用`);
      assert.ok(work.includes('有先后依赖的动作分轮执行'), `${dir} /work 应说明依赖动作分轮执行`);
      assert.ok(work.includes('不和探索 / 检查混在同一轮'), `${dir} /work 应隔离写入类动作`);
      assert.ok(!work.includes('只读 Node.js/Python 批处理汇总'), `${dir} /work 不应建议脚本批处理`);
      assert.ok(!work.includes('只用于探索和摘要'), `${dir} /work 不应保留旧批处理描述`);
      assert.ok(!work.includes('少于 10 行'), `${dir} /work 不应限制计划行数`);
    }
  });

  it('/work 不应包含模块边界暂停或手动 compact 流程', () => {
    for (const dir of [SKILLS_DIR, CODEX_SKILLS_DIR]) {
      const work = fs.readFileSync(path.join(dir, 'work', 'SKILL.md'), 'utf8');
      assert.ok(!work.includes('.work-pause'), `${dir} /work 不应使用 .work-pause`);
      assert.ok(!work.includes('模块边界检测'), `${dir} /work 不应包含模块边界检测`);
      assert.ok(!work.includes('/clear'), `${dir} /work 不应要求 /clear`);
      assert.ok(!/compact/i.test(work), `${dir} /work 不应包含 compact 流程`);
      assert.ok(!work.includes('changeArea'), `${dir} /work 不应依赖 changeArea`);
    }
  });

  it('/stopwork 不应要求破坏性回滚未完成变更', () => {
    for (const dir of [SKILLS_DIR, CODEX_SKILLS_DIR]) {
      const stop = fs.readFileSync(path.join(dir, 'stopwork', 'SKILL.md'), 'utf8');
      assert.ok(!stop.includes('git checkout -- .'), `${dir} /stopwork 不应自动回滚`);
      assert.ok(stop.includes('不回滚、不丢弃 WIP'), `${dir} /stopwork 应保留 WIP`);
    }
  });
});
