#!/usr/bin/env node
// PreToolUse (Bash/run_in_terminal) hook: 阻止危险命令（--no-verify / push --force / rm -rf /）
const { readStdinJson, normalize, isTool, getCommand } = require('./_common/normalize');

readStdinJson(raw => {
  try {
    const { toolName, toolInput } = normalize(raw);
    if (!isTool(toolName, 'bash')) return process.exit(0);

    const cmd = getCommand(toolInput) + '';
    if (!cmd) return process.exit(0);

    const patterns = [
      { re: /--no-verify\b/, msg: '禁止跳过 git hook（--no-verify）。如 hook 失败请排查根因而非绕过。' },
      { re: /git\s+push\s+.*--force(\s|$|[^-])/, msg: '禁止未经批准的 force push（可能覆盖远端工作）。如必要请用户明确授权。' },
      { re: /git\s+push\s+.*-f(\s|$)/, msg: '禁止未经批准的 force push（-f）。如必要请用户明确授权。' },
      { re: /rm\s+-rf\s+\/(?:\s|$)/, msg: '禁止 rm -rf /（根目录）。' },
      { re: /rm\s+-rf\s+~\s*$/, msg: '禁止 rm -rf ~（用户主目录）。' },
      { re: /git\s+reset\s+--hard\s+origin/, msg: 'git reset --hard origin/* 会丢弃本地工作，请先 stash 或 branch 备份。' },
    ];
    for (const p of patterns) {
      if (p.re.test(cmd)) {
        process.stderr.write(`🚫 危险命令阻止：${p.msg}\n  命令：${cmd}\n`);
        process.exit(2); // exit 2 blocks the tool call (both Claude Code & Copilot)
      }
    }
  } catch (e) {}
  process.exit(0);
});
