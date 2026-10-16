import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

/*
  base: "./"
  ----------
  Every URL the build emits is written relative to index.html rather than
  absolute from "/", because this site is served from a sub-path in more than
  one place:

    - GitHub Pages project sites  -> https://<user>.github.io/<repo>/
    - the raw.githack branch previews used for side-by-side comparison

  An absolute "/assets/..." would 404 on both; a relative one works everywhere,
  including a domain root.
*/
export default defineConfig({
  base: "./",
  plugins: [vue()],
});
