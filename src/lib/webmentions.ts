export function getWebmentionEndpoint(base: string, route: 'get' | 'receive'): string {
  const endpoint = new URL(base.endsWith('/') ? base : `${base}/`);
  return new URL(route, endpoint).href;
}
