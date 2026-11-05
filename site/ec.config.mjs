// Expressive Code settings for the site's code blocks (loaded automatically by Starlight).
import { defineEcConfig } from '@astrojs/starlight/expressive-code';

// A code block that scrolls sideways must be reachable by keyboard (WCAG 2.1.1; axe:
// scrollable-region-focusable). Expressive Code's script makes overflowing blocks focusable after
// the page loads and removes the attributes from blocks that fit. Setting them at build time too
// means keyboard users without JavaScript can scroll, and axe never sees a block before the script runs.
function focusableCodeBlocks() {
  const visit = (node) => {
    if (node.type === 'element' && node.tagName === 'pre') {
      node.properties = { ...node.properties, tabIndex: 0, role: 'region' };
    }
    node.children?.forEach(visit);
  };
  return {
    name: 'bansat-focusable-code-blocks',
    hooks: {
      postprocessRenderedBlock: ({ renderData }) => visit(renderData.blockAst),
    },
  };
}

export default defineEcConfig({
  plugins: [focusableCodeBlocks()],
});
