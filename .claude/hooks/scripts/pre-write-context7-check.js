#!/usr/bin/env node
// PreToolUse (Write/Edit) hook: 检测第三方 import，若近 24h 未查 Context7 则 stderr 警告
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const content = (data.tool_input?.content || data.tool_input?.new_string || '') + '';
    if (!content) return process.exit(0);

    // 提取 import 的 package 名（过滤相对路径 / node builtins）
    const importRegex = /(?:import|from|require)\s*\(?['"]([^'"]+)['"]/g;
    const builtins = new Set(['fs','path','os','crypto','child_process','http','https','url','util','stream','buffer','events','zlib','net','dns','tls','assert','process','module']);
    const pkgs = new Set();
    let m;
    while ((m = importRegex.exec(content)) !== null) {
      const spec = m[1];
      if (spec.startsWith('.') || spec.startsWith('/') || builtins.has(spec)) continue;
      // @scope/name 取前两段；name 取第一段
      const parts = spec.split('/');
      const pkg = spec.startsWith('@') ? parts.slice(0,2).join('/') : parts[0];
      pkgs.add(pkg);
    }
    if (!pkgs.size) return process.exit(0);

    const cachePath = path.join(process.cwd(), '.claude', 'context7-cache.json');
    let cache = {};
    if (fs.existsSync(cachePath)) {
      try { cache = JSON.parse(fs.readFileSync(cachePath,'utf8')); } catch {}
    }
    const now = Date.now();
    const stale = [];
    for (const pkg of pkgs) {
      const entry = cache[pkg];
      if (!entry || (now - new Date(entry.lastQuery).getTime()) > 24*3600*1000) {
        stale.push(pkg);
      }
    }
    if (stale.length) {
      process.stderr.write(`⚠ Context7 未查询警告：以下 package 近 24h 无查询记录，存在 API 幻觉风险：\n`);
      stale.forEach(p => process.stderr.write(`    - ${p}\n`));
      process.stderr.write(`  建议先用 mcp__*context7*__resolve-library-id + query-docs 查证后再写\n`);
    }
  } catch (e) {}
  process.exit(0);
});
