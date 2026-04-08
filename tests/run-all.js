#!/usr/bin/env node
/**
 * 主测试运行器
 * 运行所有测试文件，汇总结果
 *
 * 用法：
 *   node tests/run-all.js          # 运行所有测试
 *   node tests/run-all.js hooks    # 只运行 hook 测试
 *   node tests/run-all.js skills   # 只运行 skill 测试
 */
const { execSync } = require('node:child_process');
const path = require('node:path');

const TESTS = [
  { name: 'hooks',     file: 'test-hooks.js',     desc: 'Hook 脚本单元测试' },
  { name: 'skills',    file: 'test-skills.js',    desc: 'Skill 文件结构验证' },
  { name: 'agents',    file: 'test-agents.js',    desc: 'Agent 定义验证' },
  { name: 'rules',     file: 'test-rules.js',     desc: 'Rules 规则验证' },
  { name: 'templates', file: 'test-templates.js', desc: '模板文件验证' },
  { name: 'settings',  file: 'test-settings.js',  desc: 'Settings/MCP 配置验证' },
  { name: 'claude-md', file: 'test-claude-md.js', desc: 'CLAUDE.md 主文档验证' },
];

const filter = process.argv[2];
const testsToRun = filter
  ? TESTS.filter(t => t.name === filter)
  : TESTS;

if (filter && testsToRun.length === 0) {
  console.error(`未知测试: "${filter}"`);
  console.error(`可用: ${TESTS.map(t => t.name).join(', ')}`);
  process.exit(1);
}

console.log('='.repeat(60));
console.log(' Claude-Codeking 框架验证套件');
console.log('='.repeat(60));
console.log('');

let totalPass = 0;
let totalFail = 0;
const failures = [];

function parseSpecOutput(output) {
  // Node spec reporter uses unicode checkmarks/crosses
  let pass = 0, fail = 0;
  const failLines = [];
  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('\u2714') || trimmed.startsWith('✔')) pass++;
    if (trimmed.startsWith('\u2716') || trimmed.startsWith('✖')) {
      fail++;
      failLines.push(trimmed);
    }
  }
  return { pass, fail, failLines };
}

for (const test of testsToRun) {
  const filePath = path.join(__dirname, test.file);
  console.log(`--- ${test.desc} (${test.file}) ---`);

  let output = '';
  let exitOk = true;
  try {
    output = execSync(`node --test "${filePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.join(__dirname, '..'),
      timeout: 30000,
    });
  } catch (e) {
    exitOk = false;
    output = (e.stdout || '') + '\n' + (e.stderr || '');
  }

  const { pass, fail, failLines } = parseSpecOutput(output);

  if (pass === 0 && fail === 0 && !exitOk) {
    // 整个文件崩溃
    totalFail += 1;
    const errMsg = output.split('\n').filter(l => l.includes('Error')).slice(0, 3).join(' | ') || 'Unknown error';
    failures.push({ test: test.name, line: `文件执行失败: ${errMsg}` });
    console.log(`  CRASH`);
  } else {
    totalPass += pass;
    totalFail += fail;
    for (const fl of failLines) {
      failures.push({ test: test.name, line: fl });
    }
    console.log(`  PASS: ${pass}  FAIL: ${fail}`);
  }
  console.log('');
}

// 汇总
console.log('='.repeat(60));
console.log(` 总计: ${totalPass + totalFail} 个测试`);
console.log(` PASS: ${totalPass}  FAIL: ${totalFail}`);
console.log('='.repeat(60));

if (failures.length > 0) {
  console.log('');
  console.log('失败详情:');
  for (const f of failures) {
    console.log(`  [${f.test}] ${f.line}`);
  }
  console.log('');
  process.exit(1);
} else {
  console.log('');
  console.log('ALL TESTS PASSED!');
  console.log('');
  process.exit(0);
}
