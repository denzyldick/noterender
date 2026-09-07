export function asset(path) {
  return (process.env.BASE_URL || '/') + path.replace(/^\//, '');
}