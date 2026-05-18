#!/usr/bin/env node
// Print the current resumable task or next executable pending task as compact JSON.
// Skips cancelled/completed/blocked tasks and pending tasks whose dependencies are not completed.
const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const taskPath = path.join(cwd, 'task.json');
const progressPath = path.join(cwd, 'progress.json');

function taskId(value) {
  return value && typeof value === 'object' ? value.id : value;
}

function toResult(task) {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    changeArea: task.changeArea || null,
    doneWhen: task.doneWhen || [],
    verificationLevel: task.verificationLevel || null,
    files: task.files || [],
    origin: task.origin || null,
    changeRef: task.changeRef || null
  };
}

try {
  if (!fs.existsSync(taskPath)) process.exit(0);
  const progress = fs.existsSync(progressPath)
    ? JSON.parse(fs.readFileSync(progressPath, 'utf8'))
    : {};
  if (progress.currentPhase === 'completed') process.exit(0);

  const data = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const completed = new Set(tasks.filter(t => t.status === 'completed').map(t => t.id));
  const blocked = [];
  const currentId = taskId(progress.currentTask);
  const current = tasks.find(t =>
    t.status === 'in_progress'
    || (currentId && t.id === currentId && !['completed', 'cancelled', 'blocked'].includes(t.status))
  );

  if (current) {
    process.stdout.write(JSON.stringify(toResult(current)));
    process.exit(0);
  }

  for (const task of tasks) {
    if (task.status === 'cancelled' || task.status === 'completed' || task.status === 'blocked') continue;
    if (task.status !== 'pending') continue;

    const deps = Array.isArray(task.dependencies) ? task.dependencies : [];
    const unmet = deps.filter(id => !completed.has(id));
    if (unmet.length) {
      blocked.push({ id: task.id, unmet });
      continue;
    }

    process.stdout.write(JSON.stringify(toResult(task)));
    process.exit(0);
  }

  if (blocked.length) {
    process.stdout.write(JSON.stringify({ blocked }));
  }
} catch (e) {
  process.exit(1);
}
