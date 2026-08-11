import { visit } from 'unist-util-visit';

export function applyExternalLinks(tree: any, siteUrl: string) {
  const siteHostname = new URL(siteUrl).hostname;

  visit(tree, 'element', (node: any) => {
    if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;

    try {
      const url = new URL(node.properties.href, siteUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

      if (url.hostname === siteHostname) {
        delete node.properties.target;
        delete node.properties.rel;
      } else {
        node.properties.target = '_blank';
        node.properties.rel = 'noopener noreferrer';
      }
    } catch {
      // Keep malformed or non-web links unchanged.
    }
  });
}

export default function externalLinks(options: { siteUrl: string }) {
  return (tree: any) => {
    applyExternalLinks(tree, options.siteUrl);
  };
}
