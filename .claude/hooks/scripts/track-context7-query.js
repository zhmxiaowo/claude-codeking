#!/usr/bin/env node
// PostToolUse (mcp__*context7*__*) hook: 记录被查询的 package 到缓存
const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', c => input += c);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const toolName = data.tool_name || '';
    if (!toolName.includes('context7')) return process.exit(0);

    // 从 tool_input 中提取 libraryName / library-id
    const ti = data.tool_input || {};
    const pkg = ti.libraryName || ti.library_name || ti.libraryID || ti.library_id || ti.package || '';
    if (!pkg) return process.exit(0);
    const key = pkg.toString().replace(/^\//, '').split('/').slice(0,2).join('/');

    const cacheDir = path.join(process.cwd(), '.claude');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
    const cachePath = path.join(cacheDir, 'context7-cache.json');
    let cache = {};
    if (fs.existsSync(cachePath)) {
      try { cache = JSON.parse(fs.readFileSync(cachePath,'utf8')); } catch {}
    }
    cache[key] = {
      lastQuery: new Date().toISOString(),
      queries: (cache[key]?.queries || 0) + 1,
    };
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  } catch (e) {}
  process.exit(0);
});
