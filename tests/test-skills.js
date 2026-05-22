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
    requiredSections: ['Startup', 'Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6', 'Step 7'],
    requiredContent: ['永不停止', '绝对禁止提前停止', '编译验证', 'cancelled', '.work-stop', 'Context7', 'doneWhen', 'milestone', 'qa-verifier'],
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
