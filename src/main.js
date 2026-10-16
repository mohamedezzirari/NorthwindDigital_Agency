/*
  Application entry.

  `vite-ssg/single-page` is the no-router SSG entry: it pre-renders this one
  document and hydrates it in the browser. Using the router-flavoured ViteSSG
  would mean adding vue-router purely to describe a single route — and it would
  introduce a base-path problem on sub-path hosts (GitHub Pages project sites,
  raw.githack branch previews), because a history-mode router matches against
  location.pathname.
*/
import { ViteSSG } from "vite-ssg/single-page";
import App from "./App.vue";

/* Imported through the bundler rather than linked in index.html so the build
   emits (and fingerprints) it, and so the <link> lands in the built HTML —
   which keeps the page styled even when JavaScript never runs. */
import "./styles/main.css";

/* vite-ssg calls this instead of the usual createApp(App).mount('#app'). */
export const createApp = ViteSSG(App);
