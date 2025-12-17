export function withBase(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const cleaned = path.startsWith('/') ? path.slice(1) : path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${cleaned}`;
}
