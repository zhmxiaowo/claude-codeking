// Claude Code (snake_case) + VS Code Copilot (camelCase) hook 输入归一化
// Copilot 忽略 settings.json 的 matcher，脚本内必须自行过滤工具名

function readStdinJson(cb) {
  let buf = '';
  process.stdin.on('data', c => buf += c);
  process.stdin.on('end', () => {
    try { cb(JSON.parse(buf || '{}')); } catch { cb({}); }
  });
}

function normalize(raw) {
  return {
    toolName:       raw.tool_name       || raw.toolName       || '',
    toolInput:      raw.tool_input      || raw.toolInput      || {},
    toolResponse:   raw.tool_response   || raw.toolResponse   || {},
    transcriptPath: raw.transcript_path || raw.transcriptPath || '',
    sessionId:      raw.session_id      || raw.sessionId      || '',
    eventName:      raw.hook_event_name || raw.hookEventName  || '',
    cwd:            raw.cwd             || process.cwd(),
  };
}

const GROUPS = {
  bash:        ['Bash', 'run_in_terminal'],
  write:       ['Write', 'Edit', 'MultiEdit',
                'create_file', 'replace_string_in_file', 'insert_edit_into_file'],
  mcpContext7: /^mcp__.*context7.*/i,
};

function isTool(name, group) {
  const g = GROUPS[group];
  if (!g) return false;
  return g instanceof RegExp ? g.test(name) : g.includes(name);
}

function getCommand(ti)   { return ti.command || ti.commandLine || ''; }
function getWriteBody(ti) {
  return ti.content || ti.new_string || ti.newString || ti.code || '';
}
function getFilePath(ti)  { return ti.file_path || ti.filePath || ti.path || ''; }

module.exports = {
  readStdinJson, normalize, isTool,
  getCommand, getWriteBody, getFilePath,
};
