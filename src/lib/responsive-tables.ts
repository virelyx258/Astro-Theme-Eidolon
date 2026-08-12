import { SKIP, visit } from 'unist-util-visit';

export function applyResponsiveTables(tree: any) {
  visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
    if (node.tagName !== 'table' || index === undefined || !parent) return;
    const classes = Array.isArray(node.properties?.className) ? node.properties.className : [];
    if (classes.includes('responsive-table')) return;

    const section = node.children?.find((child: any) => child.tagName === 'thead' || child.tagName === 'tbody');
    const row = section?.children?.find((child: any) => child.tagName === 'tr');
    const columns = Math.max(1, row?.children?.filter((child: any) => child.tagName === 'th' || child.tagName === 'td').length ?? 1);
    node.properties = { ...node.properties, className: [...classes, 'responsive-table'] };
    parent.children[index] = {
      type: 'element',
      tagName: 'div',
      properties: { className: ['table-scroll'], style: `--table-columns:${columns}` },
      children: [node],
    };
    return SKIP;
  });
}

export default function responsiveTables() {
  return (tree: any) => applyResponsiveTables(tree);
}
