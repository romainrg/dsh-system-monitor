/**
 * A small, durable to-do store.
 *
 * The list belongs to the Host, not the browser: it survives a reload, a
 * profile switch and an application update, and lives in one readable JSON file
 * you can back up, grep or edit by hand.
 *
 * Writes are atomic (temp file + rename) so a crash mid-save cannot truncate
 * the list, and every mutation is validated before it touches disk.
 */

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import os from 'node:os';

const SCHEMA = 1;
const MAX_TODOS = 500;
const MAX_TEXT = 500;
const PRIORITIES = ['high', 'normal', 'low'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `$DSH_HOME/data/system-monitor/todos.json`, or `~/.dsh/...` without DSH_HOME. */
export function defaultTodoFile(env = process.env) {
  const home = env.DSH_HOME || join(os.homedir(), '.dsh');
  return join(home, 'data', 'system-monitor', 'todos.json');
}

function newId() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Trim, collapse runs of whitespace and cap the length. */
function cleanText(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length === 0) throw new Error('a to-do needs some text');
  return text.slice(0, MAX_TEXT);
}

function cleanDue(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value);
  if (!DATE.test(text)) throw new Error('a due date must be YYYY-MM-DD');
  return text;
}

function cleanPriority(value) {
  const text = String(value ?? 'normal');
  return PRIORITIES.includes(text) ? text : 'normal';
}

/** Read and repair whatever is on disk; an unreadable file starts empty. */
async function load(file) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    const list = Array.isArray(parsed?.todos) ? parsed.todos : [];
    return list
      .filter((entry) => entry && typeof entry.id === 'string' && typeof entry.text === 'string')
      .slice(0, MAX_TODOS)
      .map((entry) => ({
        id: entry.id,
        text: String(entry.text).slice(0, MAX_TEXT),
        done: entry.done === true,
        createdAt: Number(entry.createdAt) || Date.now(),
        doneAt: entry.doneAt ? Number(entry.doneAt) : null,
        due: DATE.test(String(entry.due ?? '')) ? String(entry.due) : null,
        priority: cleanPriority(entry.priority),
      }));
  } catch {
    return [];
  }
}

async function save(file, todos) {
  await mkdir(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  const body = JSON.stringify({ schema: SCHEMA, updatedAt: Date.now(), todos }, null, 2);
  await writeFile(temp, body, { mode: 0o600 });
  await rename(temp, file);
}

/**
 * Build a store bound to one file.
 * @param options - `file` overrides the default location.
 */
export function createTodoStore(options = {}) {
  const file = options.file || defaultTodoFile();
  let todos = null;

  async function read() {
    if (todos === null) todos = await load(file);
    return todos;
  }

  /** Today's date at the host's local midnight, as `YYYY-MM-DD`. */
  function today() {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }

  return {
    file,
    /** The whole list, newest deadline first. */
    async list() {
      const list = await read();
      return [...list].sort((left, right) => {
        if (left.done !== right.done) return left.done ? 1 : -1;
        if (left.due !== right.due) {
          if (left.due === null) return 1;
          if (right.due === null) return -1;
          return left.due < right.due ? -1 : 1;
        }
        return right.createdAt - left.createdAt;
      });
    },

    /** Counts for the tab badge and the KPI tiles. */
    async summary() {
      const list = await read();
      const day = today();
      const open = list.filter((entry) => !entry.done);
      return {
        total: list.length,
        open: open.length,
        done: list.length - open.length,
        overdue: open.filter((entry) => entry.due !== null && entry.due < day).length,
        dueToday: open.filter((entry) => entry.due === day).length,
        high: open.filter((entry) => entry.priority === 'high').length,
        updatedAt: list.reduce((latest, entry) => Math.max(latest, entry.createdAt, entry.doneAt ?? 0), 0),
      };
    },

    /**
     * Apply one validated mutation and persist it.
     * @param request - `{ op, id?, text?, due?, priority? }` from the route.
     * @returns the updated list.
     */
    async apply(request) {
      const list = await read();
      const op = String(request?.op ?? '');
      const find = (id) => {
        const entry = list.find((item) => item.id === id);
        if (!entry) throw new Error(`no such to-do: ${String(id)}`);
        return entry;
      };

      if (op === 'add') {
        if (list.length >= MAX_TODOS) throw new Error(`the list is full (${MAX_TODOS} items)`);
        list.push({
          id: newId(),
          text: cleanText(request.text),
          done: false,
          createdAt: Date.now(),
          doneAt: null,
          due: cleanDue(request.due),
          priority: cleanPriority(request.priority),
        });
      } else if (op === 'toggle') {
        const entry = find(request.id);
        entry.done = !entry.done;
        entry.doneAt = entry.done ? Date.now() : null;
      } else if (op === 'update') {
        const entry = find(request.id);
        if (request.text !== undefined) entry.text = cleanText(request.text);
        if (request.due !== undefined) entry.due = cleanDue(request.due);
        if (request.priority !== undefined) entry.priority = cleanPriority(request.priority);
      } else if (op === 'delete') {
        const index = list.findIndex((item) => item.id === request.id);
        if (index < 0) throw new Error(`no such to-do: ${String(request.id)}`);
        list.splice(index, 1);
      } else if (op === 'clearDone') {
        for (let index = list.length - 1; index >= 0; index -= 1) {
          if (list[index].done) list.splice(index, 1);
        }
      } else {
        throw new Error(`unknown operation: ${op}`);
      }

      await save(file, list);
      return this.list();
    },

    /** The raw file content, for a caller that wants to keep a copy. */
    async raw() {
      try {
        return await readFile(file, 'utf8');
      } catch {
        return null;
      }
    },
  };
}
