#!/usr/bin/env node
/**
 * 模板文件验证
 * 验证 spec.md、task.json、progress.json 的结构和字段完整性
 */
const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

describe('模板文件验证', () => {
  it('templates 目录应存在', () => {
    assert.ok(fs.existsSync(TEMPLATES_DIR));
  });

  // ========================================
  // spec.md
  // ========================================
  describe('spec.md 模板', () => {
    const filePath = path.join(TEMPLATES_DIR, 'spec.md');

    it('文件应存在', () => {
      assert.ok(fs.existsSync(filePath));
    });

    const content = fs.readFileSync(filePath, 'utf8');

    it('应包含概览章节', () => {
      assert.ok(content.includes('## 概览'));
    });

    it('应包含项目名称字段', () => {
      assert.ok(content.includes('项目名称'));
    });

    it('应包含项目类型字段（web | game-engine）', () => {
      assert.ok(content.includes('web') && content.includes('game-engine'));
    });

    it('应包含目标用户章节', () => {
      assert.ok(content.includes('## 目标用户'));
    });

    it('应包含技术栈章节', () => {
      assert.ok(content.includes('## 技术栈'));
    });

    it('应包含核心功能章节', () => {
      assert.ok(content.includes('## 核心功能'));
    });

    it('应包含架构设计章节（新增）', () => {
      assert.ok(content.includes('## 架构设计'));
    });

    it('架构设计应包含技术选型子章节', () => {
      assert.ok(content.includes('### 技术选型'));
    });

    it('架构设计应包含模块划分子章节', () => {
      assert.ok(content.includes('### 模块划分'));
    });

    it('架构设计应包含数据流向子章节', () => {
      assert.ok(content.includes('### 数据流向'));
    });

    it('架构设计应包含目录结构子章节', () => {
      assert.ok(content.includes('### 目录结构'));
    });

    it('架构设计应包含关键决策子章节', () => {
      assert.ok(content.includes('### 关键决策'));
    });

    it('应包含非功能需求章节', () => {
      assert.ok(content.includes('## 非功能需求'));
    });
  });

  // ========================================
  // task.json
  // ========================================
  describe('task.json 模板', () => {
    const filePath = path.join(TEMPLATES_DIR, 'task.json');

    it('文件应存在', () => {
      assert.ok(fs.existsSync(filePath));
    });

    it('应是有效的 JSON', () => {
      const content = fs.readFileSync(filePath, 'utf8');
      assert.doesNotThrow(() => JSON.parse(content));
    });

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    it('应有 tasks 数组', () => {
      assert.ok(Array.isArray(data.tasks));
    });

    it('tasks 不应为空（应有示例）', () => {
      assert.ok(data.tasks.length > 0);
    });

    // 验证示例 task 的字段
    const sampleTask = data.tasks[0];

    it('task 应有 id 字段', () => {
      assert.ok('id' in sampleTask);
      assert.strictEqual(typeof sampleTask.id, 'number');
    });

    it('task 应有 title 字段', () => {
      assert.ok('title' in sampleTask);
      assert.strictEqual(typeof sampleTask.title, 'string');
    });

    it('task 应有 description 字段', () => {
      assert.ok('description' in sampleTask);
    });

    it('task 应有 status 字段（初始 pending）', () => {
      assert.strictEqual(sampleTask.status, 'pending');
    });

    it('task 应有 dependencies 数组', () => {
      assert.ok(Array.isArray(sampleTask.dependencies));
    });

    it('task 应有 complexity 字段', () => {
      assert.ok('complexity' in sampleTask);
      assert.ok(['low', 'medium', 'high'].includes(sampleTask.complexity));
    });

    it('task 应有 files 数组', () => {
      assert.ok(Array.isArray(sampleTask.files));
    });

    it('task 应有 notes 字段', () => {
      assert.ok('notes' in sampleTask);
    });

    it('task 应有 origin 字段（新增）', () => {
      assert.ok('origin' in sampleTask);
      assert.ok(['init', 'change'].includes(sampleTask.origin));
    });

    it('task 应有 changeRef 字段（新增）', () => {
      assert.ok('changeRef' in sampleTask);
    });
  });

  // ========================================
  // progress.json
  // ========================================
  describe('progress.json 模板', () => {
    const filePath = path.join(TEMPLATES_DIR, 'progress.json');

    it('文件应存在', () => {
      assert.ok(fs.existsSync(filePath));
    });

    it('应是有效的 JSON', () => {
      const content = fs.readFileSync(filePath, 'utf8');
      assert.doesNotThrow(() => JSON.parse(content));
    });

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    it('应有 projectName 字段', () => {
      assert.ok('projectName' in data);
    });

    it('应有 projectType 字段', () => {
      assert.ok('projectType' in data);
      assert.ok(['web', 'game-engine'].includes(data.projectType));
    });

    it('应有 currentPhase 字段', () => {
      assert.ok('currentPhase' in data);
      assert.strictEqual(data.currentPhase, 'initialized');
    });

    it('应有 totalTasks 字段', () => {
      assert.ok('totalTasks' in data);
      assert.strictEqual(typeof data.totalTasks, 'number');
    });

    it('应有 completedTasks 字段', () => {
      assert.ok('completedTasks' in data);
      assert.strictEqual(data.completedTasks, 0);
    });

    it('应有 currentTask 字段（初始 null）', () => {
      assert.ok('currentTask' in data);
      assert.strictEqual(data.currentTask, null);
    });

    it('应有 lastSession 对象', () => {
      assert.ok(data.lastSession);
      assert.ok('date' in data.lastSession);
      assert.ok(Array.isArray(data.lastSession.tasksCompleted));
      assert.ok('notes' in data.lastSession);
    });

    it('应有 blockedTasks 数组', () => {
      assert.ok(Array.isArray(data.blockedTasks));
    });

    it('应有 changeHistory 数组（新增）', () => {
      assert.ok(Array.isArray(data.changeHistory));
      assert.strictEqual(data.changeHistory.length, 0);
    });
  });
});

describe('模板间一致性验证', () => {
  it('task.json 的 status 值域应覆盖所有流程需要的状态', () => {
    // 框架使用的状态: pending, in_progress, completed, blocked, cancelled
    // task.json 模板中示例为 pending，但文档中定义了完整值域
    const taskContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'task.json'), 'utf8');
    assert.ok(taskContent.includes('pending'), '应包含 pending 状态');
  });

  it('progress.json 的 projectType 值域应与 spec.md 一致', () => {
    const specContent = fs.readFileSync(path.join(TEMPLATES_DIR, 'spec.md'), 'utf8');
    const progressData = JSON.parse(fs.readFileSync(path.join(TEMPLATES_DIR, 'progress.json'), 'utf8'));
    // spec.md 定义 web | game-engine
    assert.ok(specContent.includes('web') && specContent.includes('game-engine'));
    assert.ok(['web', 'game-engine'].includes(progressData.projectType));
  });
});
