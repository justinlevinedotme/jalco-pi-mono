export function resolveRoot(): string {
  const value = process.env.PI_TODOS_CWD;
  if (value && value.trim()) return value.trim();
  return process.cwd();
}
