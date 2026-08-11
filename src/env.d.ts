/// <reference types="astro/client" />

interface TwikooClient {
  init(options: Record<string, unknown>): Promise<unknown>;
  getCommentsCount(options: Record<string, unknown>): Promise<Array<{ url: string; count: number }> | undefined>;
}

interface Window {
  twikoo?: TwikooClient;
  __miragesTwikoo?: { script?: Promise<TwikooClient>; clientBound?: boolean };
  requestIdleCallback?: (callback: () => void) => number;
}
