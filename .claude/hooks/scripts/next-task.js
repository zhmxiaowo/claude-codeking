#!/usr/bin/env node
// Print the next executable pending task as compact JSON.
// Skips cancelled tasks and pending tasks whose dependencies are not completed.
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const taskPath = path.join(cwd, 'task.json');

try {
  if (!fs.existsSync(taskPath)) process.exit(0);
  const data = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const completed = new Set(tasks.filter(t => t.status === 'completed').map(t => t.id));
  const blocked = [];

  for (const task of tasks) {
    if (task.status === 'cancelled' || task.status === 'completed' || task.status === 'blocked') continue;
    if (task.status !== 'pending') continue;

    const deps = Array.isArray(task.dependencies) ? task.dependencies : [];
    const unmet = deps.filter(id => !completed.has(id));
    if (unmet.length) {
      blocked.push({ id: task.id, unmet });
      continue;
    }

    const result = {
      id: task.id,
      title: task.title,
      description: task.description,
      dependencies: deps,
      changeArea: task.changeArea || null,
      doneWhen: task.doneWhen || [],
      verificationLevel: task.verificationLevel || null,
      files: task.files || [],
      origin: task.origin || null,
      changeRef: task.changeRef || null
    };
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  if (blocked.length) {
    process.stdout.write(JSON.stringify({ blocked }));
  }
} catch (e) {
  process.exit(1);
}
