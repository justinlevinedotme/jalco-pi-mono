import { getTodosDir, listTodosSync } from "../../io/index.js";
import { filterTodos } from "../../core/filter.js";

export function getTodoCompletions(argumentPrefix: string) {
  const todos = listTodosSync(getTodosDir(process.cwd()));
  if (!todos.length) return null;
  const matches = filterTodos(todos, argumentPrefix);
  if (!matches.length) return null;
  return matches.map((todo) => {
    const title = todo.title || "(untitled)";
    const tags = todo.tags.length ? ` • ${todo.tags.join(", ")}` : "";
    return {
      value: title,
      label: `${title}`,
      description: `${todo.status || "open"}${tags}`,
    };
  });
}
