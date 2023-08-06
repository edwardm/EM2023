import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://dev-astro.edwardmargallo.com/",
  // base: '/em2023',
  // root: './em2023',
  //srcDir: './em2023',
  // outDir: './em2023',
  integrations: [mdx(), sitemap()],
});
