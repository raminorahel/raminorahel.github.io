// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

// Site url maker utils
import { info } from "./src/configs/default";
import MkUrl from "./src/utils/mkUrl";

// https://astro.build/config
export default defineConfig({
  site: new MkUrl(info.domains.main).build(info.name),
  vite: {
    plugins: [tailwindcss()],
  },
});
