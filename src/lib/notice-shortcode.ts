const NOTICE_ICON = {
  type: 'element',
  tagName: 'span',
  properties: { className: ['shortcode-notice'], ariaLabel: '警告' },
  children: [{
    type: 'element',
    tagName: 'svg',
    properties: {
      ariaHidden: 'true',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
    },
    children: [
      { type: 'element', tagName: 'circle', properties: { cx: 12, cy: 12, r: 10 }, children: [] },
      { type: 'element', tagName: 'path', properties: { d: 'M12 8v4' }, children: [] },
      { type: 'element', tagName: 'path', properties: { d: 'M12 16h.01' }, children: [] },
    ],
  }],
};

function cloneNoticeIcon() {
  return structuredClone(NOTICE_ICON);
}

export function applyNoticeShortcodes(tree: any) {
  const transform = (node: any) => {
    if (!Array.isArray(node.children) || node.tagName === 'code' || node.tagName === 'pre') return;
    const output: any[] = [];
    for (const child of node.children) {
      if (child.type !== 'text' || !child.value.includes('[!/]')) {
        transform(child);
        output.push(child);
        continue;
      }
      const parts = child.value.split('[!/]');
      parts.forEach((part: string, index: number) => {
        if (part) output.push({ type: 'text', value: part });
        if (index < parts.length - 1) output.push({ type: 'text', value: '\u00a0' }, cloneNoticeIcon(), { type: 'text', value: '\u00a0' });
      });
    }
    node.children = output;
  };
  transform(tree);
}

export default function noticeShortcode() {
  return (tree: any) => applyNoticeShortcodes(tree);
}
