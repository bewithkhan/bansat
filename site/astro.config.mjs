// The Bansat documentation site. Pages are generated from the repo by scripts/sync-content.mjs,
// so edit framework/*.md, docs/BLUEPRINT.md or CHANGELOG.md, never the generated pages.
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://bewithkhan.github.io',
  base: '/bansat',
  trailingSlash: 'always',
  integrations: [
    starlight({
      title: 'Bansat (بنسټ)',
      description:
        'A blueprint-first framework and Claude Agent Skill by Muhammad Tufail Khan: plan product, architecture, security, privacy law, UI states and delivery before any code.',
      social: [{ icon: 'github', label: 'Bansat on GitHub', href: 'https://github.com/bewithkhan/bansat' }],
      customCss: [
        '@fontsource/space-grotesk/500.css',
        '@fontsource/space-grotesk/700.css',
        '@fontsource/ibm-plex-mono/400.css',
        './src/styles/bansat.css',
      ],
      sidebar: [
        { label: 'Start here', items: [{ label: 'Home', link: '/' }, { slug: 'framework/cover' }, { slug: 'framework/how-to-use' }, { slug: 'casebook', label: 'Breach casebook' }] },
        { label: 'Framework', items: [{ autogenerate: { directory: 'framework/parts' } }] },
        { label: 'Appendices', items: [{ autogenerate: { directory: 'framework/appendices' } }, { slug: 'casebook' }] },
        { label: 'Delivery methods', items: [{ autogenerate: { directory: 'methods' } }] },
        { label: 'Law tracker', items: [{ slug: 'laws' }, { slug: 'laws/changes' }, { slug: 'laws/about' }] },
        { label: 'Project', items: [{ autogenerate: { directory: 'project' } }] },
      ],
      head: [{ tag: 'script', attrs: { src: '/bansat/bansat-fresh.js', defer: true } }],
      pagination: true,
      lastUpdated: false,
    }),
  ],
});
