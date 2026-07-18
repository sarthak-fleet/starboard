// Blume configuration — presentation and search layer for docs/.
//
// Markdown under docs/ is the source of truth. Blume only renders it.
// Never edit generated Blume output; edit the Markdown and rebuild.
//
// Usage:
//   pnpm docs:dev     → blume dev   (local docs site; requires `pnpm add -D blume`)
//   pnpm docs:build   → blume build (static site → .blume/dist by default)
//
// Blume is NOT part of the production Worker build. `pnpm deploy:cf` does not
// invoke Blume. The generated site is gitignored (see .gitignore).

import { defineConfig } from 'blume';

export default defineConfig({
  title: 'Starboard — Documentation',
  description:
    'GitHub stars organizer: sync, tag, and semantic vector search across your starred repositories. Architecture, decisions, operations, and knowledge for the Starboard project.',

  content: {
    // Canonical documentation root. Keep in sync with scripts/check-docs.mjs.
    root: 'docs',
    include: ['**/*.{md,mdx}'],
    exclude: ['**/_*', '**/.*', 'archive/**'],
  },

  // The archive/ folder is excluded from the published site — it is
  // historical context for contributors, not user-facing documentation.
  // If you want archive pages to appear, remove "archive/**" from exclude.

  search: {
    provider: 'orama',
  },

  theme: {
    accent: 'violet',
    radius: 'md',
    mode: 'system',
  },

  markdown: {
    imageZoom: true,
    code: {
      icons: true,
      wrap: false,
    },
    codeBlocks: {
      theme: {
        light: 'github-light',
        dark: 'github-dark',
      },
    },
  },

  ai: {
    // Emit llms.txt / llms-full.txt for the docs site. The product app has
    // its own agent surfaces under public/ (see docs/product/surfaces.md);
    // this is the docs-site llms.txt, separate from the app's.
    llmsTxt: true,
    mcp: {
      enabled: false,
    },
  },

  seo: {
    og: { enabled: true },
    sitemap: true,
    robots: true,
    structuredData: true,
  },

  deployment: {
    output: 'static',
    // Update this to the docs site URL when the docs site is published.
    // Leave as a placeholder until the operator confirms the docs domain.
    site: 'https://docs.starboard.codevetter.com',
  },
});
