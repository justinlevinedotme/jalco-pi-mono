import { fuzzyMatch } from "@mariozechner/pi-tui";
import type { TodoFrontMatter } from "./types.js";
import { buildTodoSearchText, isTodoClosed } from "../format/index.js";

export function filterTodos(todos: TodoFrontMatter[], query: string): TodoFrontMatter[] {
  const trimmed = query.trim();
  if (!trimmed) return todos;

  const tokens = trimmed
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) return todos;

  const matches: Array<{ todo: TodoFrontMatter; score: number }> = [];
  for (const todo of todos) {
    const text = buildTodoSearchText(todo);
    let totalScore = 0;
    let matched = true;
    for (const token of tokens) {
      const result = fuzzyMatch(token, text);
      if (!result.matches) {
        matched = false;
        break;
      }
      totalScore += result.score;
    }
    if (matched) {
      matches.push({ todo, score: totalScore });
    }
  }

  return matches
    .sort((a, b) => {
      const aClosed = isTodoClosed(a.todo.status);
      const bClosed = isTodoClosed(b.todo.status);
      if (aClosed !== bClosed) return aClosed ? 1 : -1;
      const aAssigned = !aClosed && Boolean(a.todo.assigned_to_session);
      const bAssigned = !bClosed && Boolean(b.todo.assigned_to_session);
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
      return a.score - b.score;
    })
    .map((match) => match.todo);
}
