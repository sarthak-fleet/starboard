import config from "@saas-maker/eslint-config/next";

const eslintConfig = [
  {
    ignores: [
      ".cf-pages-bundle",
      ".open-next",
      ".wrangler",
      ".next",
      "landing-astro/.astro",
      "out",
      "dist",
      "build",
      "node_modules",
    ],
  },
  ...config,
];

export default eslintConfig;
